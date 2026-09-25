import React, { useState, useEffect, useRef } from 'react';

export const getLocalTodayDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const DatePickerModal = ({ isOpen, onClose, selectedDate, onSelectDate }) => {
  const popoverRef = useRef(null);

  // Selected date object or current date
  const initialDate = selectedDate ? new Date(selectedDate + 'T00:00:00') : new Date();
  const [viewDate, setViewDate] = useState(new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));

  // Handle click outside to close popover
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const handleDayClick = (day) => {
    const formattedMonth = String(month + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    const dateStr = `${year}-${formattedMonth}-${formattedDay}`;
    onSelectDate(dateStr);
    onClose();
  };

  const isDaySelected = (day) => {
    const formattedMonth = String(month + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    return selectedDate === `${year}-${formattedMonth}-${formattedDay}`;
  };

  const today = new Date();
  const isToday = (day) => {
    return (
      today.getDate() === day &&
      today.getMonth() === month &&
      today.getFullYear() === year
    );
  };

  return (
    <div
      ref={popoverRef}
      className="absolute right-0 top-full mt-2 z-50 bg-[#161720] border border-[#262837] rounded-2xl w-64 shadow-2xl p-4 font-sans text-gray-200 space-y-3 animate-fadeIn"
    >
      {/* Month Navigator Header */}
      <div className="flex justify-between items-center pb-2 border-b border-[#262837]">
        <button
          onClick={handlePrevMonth}
          className="p-1 rounded-lg bg-[#1e202e] hover:bg-[#282b3d] text-gray-300 transition text-xs font-bold"
          title="Previous Month"
        >
          ◀
        </button>
        <span className="font-extrabold text-xs text-amber-400 font-heading">
          {monthNames[month]} {year}
        </span>
        <button
          onClick={handleNextMonth}
          className="p-1 rounded-lg bg-[#1e202e] hover:bg-[#282b3d] text-gray-300 transition text-xs font-bold"
          title="Next Month"
        >
          ▶
        </button>
      </div>

      {/* Day Header Names */}
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-extrabold text-gray-500 uppercase">
        <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
      </div>

      {/* Day Grid */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="h-7" />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const selected = isDaySelected(day);
          const todayDay = isToday(day);

          return (
            <button
              key={day}
              onClick={() => handleDayClick(day)}
              className={`h-7 w-7 mx-auto rounded-lg text-xs font-extrabold flex items-center justify-center transition ${
                selected
                  ? 'bg-amber-500 text-black shadow-md font-black scale-105'
                  : todayDay
                  ? 'border border-amber-500/50 text-amber-400 hover:bg-amber-500/10'
                  : 'text-gray-300 hover:bg-[#222435] hover:text-white'
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Quick Action Footer */}
      <div className="pt-2 border-t border-[#262837] flex justify-between items-center text-[11px]">
        <button
          onClick={() => {
            const todayStr = getLocalTodayDateString();
            onSelectDate(todayStr);
            onClose();
          }}
          className="text-amber-400 hover:underline font-bold"
        >
          Today
        </button>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white font-bold"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default DatePickerModal;
