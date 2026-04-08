import { useState } from 'react';
import { format, addDays, isSameDay, isAfter } from 'date-fns';
import { Plus, Check, Trash2, Clock } from 'lucide-react';
import { cn } from '../utils/cn';

export function Tasks({ selectedDate, endDate, tasks, setTasks }) {
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const dateKey = format(selectedDate, 'yyyy-MM-dd');
  const currentTasks = tasks[dateKey] || [];

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask = {
      id: crypto.randomUUID(),
      title: newTaskTitle,
      description: newTaskDesc,
      completed: false
    };

    setTasks(prev => {
      const nextTasks = { ...prev };
      
      let current = selectedDate;
      const end = endDate && isAfter(endDate, selectedDate) ? endDate : selectedDate;
      
      while (current <= end || isSameDay(current, end)) {
        const dKey = format(current, 'yyyy-MM-dd');
        nextTasks[dKey] = [...(nextTasks[dKey] || []), newTask];
        current = addDays(current, 1);
      }
      return nextTasks;
    });
    
    setNewTaskTitle("");
    setNewTaskDesc("");
  };

  const toggleTask = (taskId) => {
    setTasks(prev => {
      const next = { ...prev };
      let newCompletedState = null;
      for (const d of Object.keys(next)) {
        const idx = next[d].findIndex(t => t.id === taskId);
        if (idx !== -1) {
          if (newCompletedState === null) {
            newCompletedState = !next[d][idx].completed;
          }
          next[d] = next[d].map(t => t.id === taskId ? { ...t, completed: newCompletedState } : t);
        }
      }
      return next;
    });
  };

  const deleteTask = (taskId) => {
    setTasks(prev => {
      const next = { ...prev };
      for (const d of Object.keys(next)) {
        next[d] = next[d].filter(t => t.id !== taskId);
      }
      return next;
    });
  };

  const progress = currentTasks.length > 0 
    ? Math.round((currentTasks.filter(t => t.completed).length / currentTasks.length) * 100) 
    : 0;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-xl w-full flex flex-col h-full">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
          <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
        </div>
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">Schedule</h2>
          <p className="text-xs sm:text-sm text-zinc-400">{format(selectedDate, "EEEE, MMMM d")}</p>
        </div>
      </div>

      {/* Progress Bar */}
      {currentTasks.length > 0 && (
        <div className="mb-6">
          <div className="flex justify-between text-xs text-zinc-400 mb-2 font-medium">
            <span>Daily Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
             <div 
               className="h-full bg-indigo-500 rounded-full transition-all duration-500 ease-out" 
               style={{ width: `${progress}%` }} 
             />
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
        {currentTasks.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-3">
            <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mb-2">
              <Check className="w-8 h-8 text-zinc-700" />
            </div>
            <p className="text-sm">No tasks for this day.</p>
            <p className="text-xs text-zinc-600">Add a task below to get started.</p>
          </div>
        ) : (
          currentTasks.map(task => (
            <div 
              key={task.id} 
              className={cn(
                "group flex items-center justify-between p-3 rounded-xl border transition-all duration-200",
                task.completed 
                  ? "bg-zinc-800/30 border-transparent" 
                  : "bg-zinc-800/80 border-zinc-700/50 hover:border-zinc-600"
              )}
            >
              <div className="flex flex-col gap-1 w-full mr-3">
                <div className="flex items-start gap-3">
                  <button 
                    onClick={() => toggleTask(task.id)}
                    className={cn(
                      "mt-0.5 flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center transition-colors duration-200",
                      task.completed 
                        ? "bg-indigo-500 text-white" 
                        : "border-2 border-zinc-500 text-transparent hover:border-indigo-400"
                    )}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <div className="flex flex-col">
                    <span className={cn(
                      "text-sm font-medium transition-colors duration-200",
                      task.completed ? "text-zinc-500 line-through" : "text-zinc-200"
                    )}>
                      {task.title}
                    </span>
                    {task.description && (
                      <span className={cn(
                        "text-xs mt-1",
                        task.completed ? "text-zinc-600 line-through" : "text-zinc-400"
                      )}>
                        {task.description}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => deleteTask(task.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-all duration-200"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleAddTask} className="mt-4 pt-4 border-t border-zinc-800 flex flex-col gap-2">
        <input
          type="text"
          placeholder="Task title..."
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          className="w-full bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-zinc-500"
        />
        <div className="relative">
          <input
            type="text"
            placeholder="Description (optional)..."
            value={newTaskDesc}
            onChange={(e) => setNewTaskDesc(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm rounded-xl pl-4 pr-12 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-zinc-500"
          />
          <button 
            type="submit"
            disabled={!newTaskTitle.trim()}
            className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
