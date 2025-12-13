'use client';

import { useState, useEffect } from 'react';
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  isSameDay,
  isSameMonth,
} from 'date-fns';
import { Job } from '@/lib/types';
import Link from 'next/link';

interface CalendarProps {
  view: 'week' | 'month';
  currentDate: Date;
  jobs: Job[];
  onDateChange: (date: Date) => void;
  onViewChange: (view: 'week' | 'month') => void;
}

export default function Calendar({
  view,
  currentDate,
  jobs,
  onDateChange,
  onViewChange,
}: CalendarProps) {
  const [selectedDate, setSelectedDate] = useState(currentDate);

  const getDaysForView = () => {
    if (view === 'week') {
      const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
      const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 0 });
      return eachDayOfInterval({ start: weekStart, end: weekEnd });
    } else {
      const monthStart = startOfMonth(selectedDate);
      const monthEnd = endOfMonth(selectedDate);
      // Get the full weeks that contain the month
      const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
      const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
      return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    }
  };

  const getJobsForDay = (day: Date) => {
    return jobs.filter((job) => {
      const jobDate = new Date(job.date);
      return isSameDay(jobDate, day);
    });
  };

  const parseTime = (timeString: string): number => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const navigatePrevious = () => {
    if (view === 'week') {
      const newDate = subWeeks(selectedDate, 1);
      setSelectedDate(newDate);
      onDateChange(newDate);
    } else {
      const newDate = subMonths(selectedDate, 1);
      setSelectedDate(newDate);
      onDateChange(newDate);
    }
  };

  const navigateNext = () => {
    if (view === 'week') {
      const newDate = addWeeks(selectedDate, 1);
      setSelectedDate(newDate);
      onDateChange(newDate);
    } else {
      const newDate = addMonths(selectedDate, 1);
      setSelectedDate(newDate);
      onDateChange(newDate);
    }
  };

  const navigateToday = () => {
    const today = new Date();
    setSelectedDate(today);
    onDateChange(today);
  };

  const days = getDaysForView();
  const isMonthView = view === 'month';

  const statusColors = {
    pending: 'bg-yellow-100 border-yellow-300 text-yellow-900',
    'in-progress': 'bg-blue-100 border-blue-300 text-blue-900',
    'awaiting-parts': 'bg-orange-100 border-orange-300 text-orange-900',
    completed: 'bg-green-100 border-green-300 text-green-900',
    cancelled: 'bg-red-100 border-red-300 text-red-900',
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-3 md:p-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 md:mb-6 gap-3 md:gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={navigatePrevious}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Previous"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <h2 className="text-lg md:text-2xl font-bold text-gray-900 text-center">
            {view === 'week'
              ? `Week of ${format(startOfWeek(selectedDate, { weekStartsOn: 0 }), 'MMM d')}`
              : format(selectedDate, 'MMMM yyyy')}
          </h2>
          <button
            onClick={navigateNext}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Next"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={navigateToday}
            className="px-3 md:px-4 py-1.5 md:py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-xs md:text-sm font-medium"
          >
            Today
          </button>
          <div className="flex bg-gray-100 rounded-md p-0.5 md:p-1">
            <button
              onClick={() => onViewChange('week')}
              className={`px-3 md:px-4 py-1.5 md:py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${
                view === 'week'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => onViewChange('month')}
              className={`px-3 md:px-4 py-1.5 md:py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${
                view === 'month'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Month
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      {view === 'week' ? (
        <div className="overflow-x-auto">
          <div className="grid grid-cols-7 gap-1 md:gap-2 min-w-[700px]">
            {/* Day Headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div
                key={day}
                className="text-center font-semibold text-gray-700 py-2 border-b text-xs md:text-sm"
              >
                {day}
              </div>
            ))}

            {/* Week Days */}
            {days.map((day, index) => {
              const dayJobs = getJobsForDay(day);
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={index}
                  className={`min-h-[100px] md:min-h-[120px] border rounded-lg p-1 md:p-2 ${
                    isToday ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div
                    className={`text-xs md:text-sm font-medium mb-1 md:mb-2 ${
                      isToday ? 'text-blue-700' : 'text-gray-700'
                    }`}
                  >
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-0.5 md:space-y-1">
                    {dayJobs
                      .sort((a, b) => parseTime(a.startTime) - parseTime(b.startTime))
                      .map((job) => (
                        <Link
                          key={job.id}
                          href={`/jobs/${job.id}`}
                          className={`block text-[10px] md:text-xs p-1 md:p-1.5 rounded border ${statusColors[job.status]} hover:opacity-80 transition-opacity`}
                        >
                          <div className="font-medium truncate">
                            {job.customerFirstName} {job.customerLastName}
                          </div>
                          <div className="text-[9px] md:text-xs opacity-90">
                            {job.startTime}
                            {job.endTime && ` - ${job.endTime}`}
                          </div>
                          <div className="text-[9px] md:text-xs opacity-75 truncate hidden md:block">
                            {job.serviceType}
                          </div>
                          {job.employee && (
                            <div className="text-[8px] md:text-[10px] opacity-70 mt-0.5 truncate">
                              👤 {job.employee.firstName} {job.employee.lastName}
                            </div>
                          )}
                        </Link>
                      ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="grid grid-cols-7 gap-1 min-w-[600px]">
            {/* Day Headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div
                key={day}
                className="text-center font-semibold text-gray-700 py-2 text-xs md:text-sm"
              >
                {day}
              </div>
            ))}

            {/* Month Days */}
            {days.map((day, index) => {
              const dayJobs = getJobsForDay(day);
              const isToday = isSameDay(day, new Date());
              const isCurrentMonth = isSameMonth(day, selectedDate);

              return (
                <div
                  key={index}
                  className={`min-h-[80px] md:min-h-[100px] border rounded-lg p-1 md:p-1.5 ${
                    isToday
                      ? 'bg-blue-50 border-blue-300'
                      : isCurrentMonth
                      ? 'bg-white border-gray-200'
                      : 'bg-gray-50 border-gray-100'
                  }`}
                >
                  <div
                    className={`text-xs font-medium mb-0.5 md:mb-1 ${
                      isToday
                        ? 'text-blue-700'
                        : isCurrentMonth
                        ? 'text-gray-900'
                        : 'text-gray-400'
                    }`}
                  >
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-0.5">
                    {dayJobs
                      .slice(0, 2)
                      .sort((a, b) => parseTime(a.startTime) - parseTime(b.startTime))
                      .map((job) => (
                        <Link
                          key={job.id}
                          href={`/jobs/${job.id}`}
                          className={`block text-[9px] md:text-[10px] p-0.5 md:p-1 rounded border ${statusColors[job.status]} hover:opacity-80 transition-opacity truncate`}
                          title={`${job.customerFirstName} ${job.customerLastName} - ${job.startTime}${job.employee ? ` - ${job.employee.firstName} ${job.employee.lastName}` : ''}`}
                        >
                          <div className="truncate font-medium">
                            {job.startTime} {job.customerFirstName}
                          </div>
                          {job.employee && (
                            <div className="text-[8px] md:text-[9px] opacity-70 truncate">
                              👤 {job.employee.firstName.charAt(0)}.{job.employee.lastName.charAt(0)}
                            </div>
                          )}
                        </Link>
                      ))}
                    {dayJobs.length > 2 && (
                      <div className="text-[9px] md:text-[10px] text-gray-500 px-1">
                        +{dayJobs.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}


