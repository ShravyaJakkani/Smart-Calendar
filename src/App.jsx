import { useState, useEffect, useRef, useMemo } from 'react';
import { Calendar } from './components/Calendar';
import { Tasks } from './components/Tasks';

const PREDEFINED_IMAGES = [
  'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&q=80',
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1600&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=80',
  'https://images.unsplash.com/photo-1473220464592-3118cf9d750c?w=1600&q=80',
  'https://images.unsplash.com/photo-1517842645767-c639042777db?w=1600&q=80',
];

const getRandomImage = () => PREDEFINED_IMAGES[Math.floor(Math.random() * PREDEFINED_IMAGES.length)];

function App() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [endDate, setEndDate] = useState(null);
  
  // Tasks state stored in the root to persist across views
  const [tasks, setTasks] = useState({});

  // Hero image state
  const [heroImage, setHeroImage] = useState(() => {
    return localStorage.getItem('smart_calendar_hero') || getRandomImage();
  });
  
  const [isCopied, setIsCopied] = useState(false);
  const [isWarningDismissed, setIsWarningDismissed] = useState(false);
  const [latePendingCount, setLatePendingCount] = useState(0);
  const fileInputRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setHeroImage(base64String);
        try {
          localStorage.setItem('smart_calendar_hero', base64String);
        } catch (error) {
          console.warn('Image too large for local storage.');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetImage = () => {
    const newRandom = getRandomImage();
    setHeroImage(newRandom);
    localStorage.removeItem('smart_calendar_hero');
  };

  const heroOpacity = useMemo(() => {
    if (!selectedDate) return 1;

    const formatDate = (date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    let datesToCheck = [];
    if (selectedDate && endDate) {
      let current = new Date(selectedDate);
      while (current <= endDate) {
        datesToCheck.push(formatDate(current));
        current.setDate(current.getDate() + 1);
      }
    } else {
      datesToCheck.push(formatDate(selectedDate));
    }

    let allTasks = [];
    datesToCheck.forEach(key => {
      if (tasks[key]) allTasks = allTasks.concat(tasks[key]);
    });

    if (allTasks.length === 0) return 1.0; 

    const completedCount = allTasks.filter(t => t.completed).length;
    const completionPercent = completedCount / allTasks.length;

    return 0.3 + (completionPercent * 0.7);
  }, [tasks, selectedDate, endDate]);

  const handleShareLayout = async () => {
    if (!tasks || Object.keys(tasks).length === 0) {
      alert("No tasks to share!");
      return;
    }

    let summary = "Smart Calendar Schedule\n\n";
    
    const sortedDates = Object.keys(tasks).sort();
    let hasTasks = false;

    sortedDates.forEach(date => {
      const dailyTasks = tasks[date];
      if (dailyTasks && dailyTasks.length > 0) {
        hasTasks = true;
        summary += `Date: ${date}\n`;
        dailyTasks.forEach(task => {
          summary += `- ${task.title} (${task.completed ? 'Completed' : 'Pending'})\n`;
        });
        summary += '\n';
      }
    });

    if (!hasTasks) {
      alert("No active tasks to share!");
      return;
    }

    try {
      await navigator.clipboard.writeText(summary.trim());
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy!', err);
      alert('Failed to copy to clipboard.');
    }
  };

  // On mount, populate today with a sample task
  useEffect(() => {
    import('date-fns').then(({ format }) => {
      const todayKey = format(new Date(), 'yyyy-MM-dd');
      setTasks(prev => {
        if(Object.keys(prev).length === 0) {
          return {
            [todayKey]: [
              { id: '1', title: 'Welcome to Smart Calendar!', completed: false },
              { id: '2', title: 'Add your first task', completed: false },
            ]
          };
        }
        return prev;
      });
    });
  }, []);

  // Effect to handle late-day warning
  useEffect(() => {
    const checkLateDayTasks = () => {
      const now = new Date();
      const hours = now.getHours();
      
      if (hours >= 18) {
        // Format today's date
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        const todayKey = `${y}-${m}-${d}`;
        
        const todaysTasks = tasks[todayKey] || [];
        const pendingCount = todaysTasks.filter(t => !t.completed).length;
        
        setLatePendingCount(pendingCount);
      } else {
        setLatePendingCount(0);
      }
    };

    checkLateDayTasks();
    const intervalId = setInterval(checkLateDayTasks, 60000); // Check every minute
    return () => clearInterval(intervalId);
  }, [tasks]);

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans flex flex-col">
      {/* Top section with full-width hero image */}
      <header className="relative w-full h-64 md:h-80 lg:h-96 shrink-0 bg-zinc-900 border-b border-white/5 overflow-hidden">
        <img 
          src={heroImage} 
          alt="Calendar Hero" 
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out" 
          style={{ opacity: heroOpacity }}
        />
        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/20" />
        
        {/* Image Controls */}
        <div className="absolute top-4 right-4 flex gap-2 z-10">
          <input 
            type="file" 
            accept="image/*" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 bg-zinc-800/60 hover:bg-zinc-700/80 backdrop-blur text-xs font-medium rounded-lg text-white transition-all border border-white/10"
          >
            Upload Photo
          </button>
          <button 
            onClick={handleResetImage}
            className="px-3 py-1.5 bg-zinc-800/60 hover:bg-zinc-700/80 backdrop-blur text-xs font-medium rounded-lg text-white transition-all border border-white/10"
          >
            Random
          </button>
        </div>
        
        <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 pb-8">
          <div className="relative max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-4 z-10">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent mb-3 shadow-sm">
                Smart Calendar
              </h1>
              <p className="text-zinc-300 text-lg md:text-xl max-w-lg drop-shadow-md">
                Organize your days, manage your tasks, and achieve your goals with a unified workflow.
              </p>
            </div>
            <div className="hidden md:flex gap-3">
               <button 
                 onClick={handleShareLayout}
                 className="px-5 py-2.5 bg-zinc-800/80 backdrop-blur hover:bg-zinc-700/80 text-sm font-medium rounded-xl text-white transition-all border border-zinc-700/50 hover:border-zinc-500 active:scale-95 shadow-lg flex items-center gap-2"
               >
                 {isCopied ? (
                   <span className="text-emerald-400 flex items-center gap-2">✓ Copied!</span>
                 ) : (
                   "Share Layout"
                 )}
               </button>
               <button className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-sm font-medium rounded-xl text-white transition-all shadow-lg shadow-indigo-500/25 active:scale-95">
                 New Event
               </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main two-column content area */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 flex flex-col">
        <div className="flex flex-col lg:flex-row gap-8 flex-1 items-start">
          
          {/* Left Column (Calendar) */}
          <section className="w-full lg:w-7/12 flex flex-col xl:min-h-[600px]">
            <div className="w-full h-full flex flex-col gap-6">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-2xl font-semibold text-zinc-100 flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center ring-1 ring-indigo-500/30">📅</span>
                  Calendar View
                </h2>
              </div>
              <div className="flex-1 bg-zinc-900/60 rounded-3xl border border-white/5 p-4 md:p-6 lg:p-8 backdrop-blur-md shadow-2xl">
                <Calendar 
                  selectedDate={selectedDate} 
                  setSelectedDate={setSelectedDate} 
                  endDate={endDate}
                  setEndDate={setEndDate}
                  tasks={tasks} 
                />
              </div>
            </div>
          </section>

          {/* Right Column (Tasks) */}
          <section className="w-full lg:w-5/12 flex flex-col xl:min-h-[600px]">
             <div className="w-full h-full flex flex-col gap-6">
               <div className="flex items-center justify-between px-2">
                <h2 className="text-2xl font-semibold text-zinc-100 flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center ring-1 ring-cyan-500/30">✓</span>
                  Notes & Tasks
                </h2>
              </div>
              <div className="flex-1 bg-zinc-900/60 rounded-3xl border border-white/5 p-4 md:p-6 lg:p-8 backdrop-blur-md shadow-2xl">
                <Tasks 
                  selectedDate={selectedDate} 
                  endDate={endDate}
                  tasks={tasks} 
                  setTasks={setTasks} 
                />
              </div>
             </div>
          </section>

        </div>
      </main>

      {/* Late Day Warning Toast */}
      {latePendingCount > 0 && !isWarningDismissed && (
        <div className="fixed bottom-6 right-6 bg-red-500/90 text-white px-5 py-4 rounded-2xl shadow-lg backdrop-blur flex items-center justify-between gap-4 z-50 border border-red-400/30 transition-all hover:-translate-y-1">
          <div className="flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <p className="font-medium">
              You still have {latePendingCount} pending task{latePendingCount !== 1 ? 's' : ''} for today!
            </p>
          </div>
          <button 
            onClick={() => setIsWarningDismissed(true)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-black/20 transition-colors"
            title="Dismiss"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
