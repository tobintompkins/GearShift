'use client';

import { useState, useEffect } from 'react';
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  format,
} from 'date-fns';
import Calendar from '@/components/Calendar';
import Navigation from '@/components/Navigation';
import { Job } from '@/lib/types';

export default function CalendarPage() {
  const [view, setView] = useState<'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = async (date: Date) => {
    try {
      setLoading(true);
      setError(null);

      let startDate: Date;
      let endDate: Date;

      if (view === 'week') {
        startDate = startOfWeek(date, { weekStartsOn: 0 });
        endDate = endOfWeek(date, { weekStartsOn: 0 });
      } else {
        startDate = startOfMonth(date);
        endDate = endOfMonth(date);
      }

      const response = await fetch(
        `/api/jobs/calendar?startDate=${format(startDate, 'yyyy-MM-dd')}&endDate=${format(endDate, 'yyyy-MM-dd')}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }

      const data = await response.json();
      // Convert date strings to Date objects
      const jobsWithDates = data.map((job: any) => ({
        ...job,
        date: new Date(job.date),
        createdAt: new Date(job.createdAt),
        updatedAt: new Date(job.updatedAt),
      }));
      setJobs(jobsWithDates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs(currentDate);
  }, [currentDate, view]);

  const handleDateChange = (date: Date) => {
    setCurrentDate(date);
  };

  const handleViewChange = (newView: 'week' | 'month') => {
    setView(newView);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-2 md:px-4 py-4 md:py-8">
        <div className="mb-4 md:mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Job Scheduling Calendar
          </h1>
          <p className="text-sm md:text-base text-gray-600">
            View and manage all your scheduled jobs
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-lg shadow-lg p-8 md:p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading calendar...</p>
          </div>
        ) : (
          <Calendar
            view={view}
            currentDate={currentDate}
            jobs={jobs}
            onDateChange={handleDateChange}
            onViewChange={handleViewChange}
          />
        )}
      </main>
    </div>
  );
}


