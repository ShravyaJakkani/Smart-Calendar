import { useState } from 'react';
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, isToday, isBefore, isAfter
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../utils/cn';

export function Calendar({ selectedDate, setSelectedDate, endDate, setEndDate, tasks }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  
  const onDateClick = (day) => {
    if (endDate || !selectedDate) {
      setSelectedDate(day);
      if (setEndDate) setEndDate(null);
    } else {
      if (isBefore(day, selectedDate)) {
        setSelectedDate(day);
      } else if (isSameDay(day, selectedDate)) {
        setSelectedDate(day);
      } else {
        if (setEndDate) setEndDate(day);
      }
    }
  };

  // Calendar cells generation logic
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const calendarStartDate = startOfWeek(monthStart);
  const calendarEndDate = endOfWeek(monthEnd);

  const dateFormat = "d";
  const days = [];
  let day = calendarStartDate;

  while (day <= calendarEndDate) {
    const cloneDay = day;
    
    // Check if this day has tasks
    const dateKey = format(cloneDay, 'yyyy-MM-dd');
    const dayTasks = tasks[dateKey] || [];
    
    const isStart = selectedDate && isSameDay(day, selectedDate);
    const isEnd = endDate && isSameDay(day, endDate);
    const inRange = selectedDate && endDate && isAfter(day, selectedDate) && isBefore(day, endDate);
    const isSelected = isStart || isEnd;

    days.push(
      <div 
        key={day.toString()}
        onClick={() => onDateClick(cloneDay)}
        className={cn(
          "relative flex flex-col items-center justify-center p-2 h-14 w-full cursor-pointer rounded-xl transition-all duration-200",
          !isSameMonth(day, monthStart) ? "text-zinc-600" : "text-zinc-200",
          isSelected && "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 font-bold",
          inRange && "bg-indigo-500/20 text-indigo-300 font-medium",
          !isSelected && !inRange && isToday(day) && "bg-zinc-800 text-indigo-400 font-bold",
          !isSelected && !inRange && !isToday(day) && "hover:bg-zinc-800"
        )}
      >
        <span className="text-sm select-none">{format(cloneDay, dateFormat)}</span>
        
        {/* Render tasks */}
        {dayTasks.length > 0 && (
          <div className="absolute bottom-1 w-[90%] flex flex-col gap-[2px]">
            {dayTasks.slice(0, 2).map((task, i) => (
              <div 
                key={i} 
                className={cn(
                  "text-[9px] leading-tight truncate px-1 rounded-sm w-full text-center font-medium",
                  isSelected ? "bg-white/20 text-white" : "bg-indigo-500 text-white shadow-sm"
                )} 
              >
                {task.title}
              </div>
            ))}
            {dayTasks.length > 2 && (
              <div className="text-[8px] text-zinc-500 font-medium text-center">
                +{dayTasks.length - 2} more
              </div>
            )}
          </div>
        )}
      </div>
    );
    day = addDays(day, 1);
  }

  // Weekday headers
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl w-full h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <p className="text-sm text-zinc-400 mt-1">Select a date to view tasks</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={prevMonth}
            className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button 
            onClick={nextMonth}
            className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekdays.map((day) => (
          <div key={day} className="text-center text-xs font-semibold uppercase text-zinc-500 py-2">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {days}
      </div>
    </div>
  );
}
