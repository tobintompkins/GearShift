'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { TimeEntry, Employee, Job } from '@/lib/types';
import { format, formatDistanceToNow, isToday, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

export default function PayrollPage() {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('week');
  const [showClockInForm, setShowClockInForm] = useState(false);
  const [clockInEmployeeId, setClockInEmployeeId] = useState<string>('');
  const [clockInJobId, setClockInJobId] = useState<string>('');
  const [clockInNotes, setClockInNotes] = useState<string>('');

  useEffect(() => {
    fetchEmployees();
    fetchJobs();
    fetchTimeEntries();
  }, [selectedEmployeeId, dateRange]);

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees');
      if (response.ok) {
        const data = await response.json();
        setEmployees(Array.isArray(data) ? data.filter((e: Employee) => e.isActive) : []);
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
  };

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/jobs?status=in-progress,pending');
      if (response.ok) {
        const data = await response.json();
        setJobs(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
    }
  };

  const fetchTimeEntries = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (selectedEmployeeId !== 'all') {
        params.append('employeeId', selectedEmployeeId);
      }

      if (dateRange === 'today') {
        const today = new Date().toISOString().split('T')[0];
        params.append('startDate', today);
        params.append('endDate', today);
      } else if (dateRange === 'week') {
        const start = startOfWeek(new Date());
        const end = endOfWeek(new Date());
        params.append('startDate', format(start, 'yyyy-MM-dd'));
        params.append('endDate', format(end, 'yyyy-MM-dd'));
      } else if (dateRange === 'month') {
        const start = startOfMonth(new Date());
        const end = endOfMonth(new Date());
        params.append('startDate', format(start, 'yyyy-MM-dd'));
        params.append('endDate', format(end, 'yyyy-MM-dd'));
      }

      const response = await fetch(`/api/time-entries?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch time entries');
      }
      const data = await response.json();
      setTimeEntries(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleClockIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clockInEmployeeId) {
      alert('Please select an employee');
      return;
    }

    try {
      const response = await fetch('/api/time-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: clockInEmployeeId,
          jobId: clockInJobId || null,
          notes: clockInNotes || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to clock in');
      }

      setShowClockInForm(false);
      setClockInEmployeeId('');
      setClockInJobId('');
      setClockInNotes('');
      fetchTimeEntries();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleClockOut = async (entryId: string) => {
    if (!confirm('Clock out this employee?')) {
      return;
    }

    try {
      const response = await fetch(`/api/time-entries/${entryId}/clock-out`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to clock out');
      }

      fetchTimeEntries();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleBreak = async (entryId: string, action: 'start' | 'end') => {
    try {
      const response = await fetch(`/api/time-entries/${entryId}/break`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to ${action} break`);
      }

      fetchTimeEntries();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const formatTime = (minutes: number | null) => {
    if (minutes === null || minutes === 0) return '0h 0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatDuration = (start: Date, end: Date | null) => {
    if (!end) {
      const now = new Date();
      const ms = now.getTime() - new Date(start).getTime();
      const minutes = Math.floor(ms / (1000 * 60));
      return formatTime(minutes);
    }
    const ms = new Date(end).getTime() - new Date(start).getTime();
    const minutes = Math.floor(ms / (1000 * 60));
    return formatTime(minutes);
  };

  const activeEntries = timeEntries.filter((e) => !e.clockOut);
  const completedEntries = timeEntries.filter((e) => e.clockOut);

  const totalHours = timeEntries.reduce((sum, entry) => {
    if (entry.totalMinutes) {
      return sum + entry.totalMinutes;
    }
    if (!entry.clockOut) {
      const now = new Date();
      const ms = now.getTime() - new Date(entry.clockIn).getTime();
      return sum + Math.floor(ms / (1000 * 60)) - entry.breakMinutes;
    }
    return sum;
  }, 0);

  const stats = {
    active: activeEntries.length,
    completed: completedEntries.length,
    totalHours: formatTime(totalHours),
    onBreak: activeEntries.filter((e) => e.breakStart && !e.breakEnd).length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-4 md:py-8">
        <div className="mb-4 md:mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              ⏰ Payroll / Hours Tracking
            </h1>
            <p className="text-sm md:text-base text-gray-600">
              Track employee clock-in/out, breaks, and hours per job
            </p>
          </div>
          <button
            onClick={() => setShowClockInForm(!showClockInForm)}
            className="w-full sm:w-auto bg-green-600 text-white px-4 py-2 rounded-md font-medium hover:bg-green-700 transition-colors text-sm md:text-base"
          >
            {showClockInForm ? 'Cancel' : '+ Clock In'}
          </button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold text-green-600">{stats.active}</div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">Clocked In</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold text-blue-600">{stats.completed}</div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">Completed Today</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold text-purple-600">{stats.totalHours}</div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">Total Hours</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold text-orange-600">{stats.onBreak}</div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">On Break</div>
          </div>
        </div>

        {/* Clock In Form */}
        {showClockInForm && (
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Clock In Employee</h2>
            <form onSubmit={handleClockIn} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employee *
                </label>
                <select
                  value={clockInEmployeeId}
                  onChange={(e) => setClockInEmployeeId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">-- Select Employee --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job (Optional)
                </label>
                <select
                  value={clockInJobId}
                  onChange={(e) => setClockInJobId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">-- No Job --</option>
                  {jobs.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.customerFirstName} {job.customerLastName} - {job.serviceType}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={clockInNotes}
                  onChange={(e) => setClockInNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Optional notes about this shift..."
                />
              </div>
              <button
                type="submit"
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 font-medium"
              >
                Clock In
              </button>
            </form>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Employee:</label>
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="all">All Employees</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Date Range:</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="all">All Time</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading time entries...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Active Entries */}
            {activeEntries.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Currently Clocked In ({activeEntries.length})
                </h2>
                <div className="space-y-4">
                  {activeEntries.map((entry) => {
                    const isOnBreak = entry.breakStart && !entry.breakEnd;
                    return (
                      <div
                        key={entry.id}
                        className="bg-white rounded-lg shadow-md p-4 md:p-6 border-l-4 border-green-500"
                      >
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              {entry.employee?.photo ? (
                                <img
                                  src={entry.employee.photo}
                                  alt={`${entry.employee.firstName} ${entry.employee.lastName}`}
                                  className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-lg font-bold text-blue-600">
                                  {entry.employee?.firstName[0]}{entry.employee?.lastName[0]}
                                </div>
                              )}
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {entry.employee?.firstName} {entry.employee?.lastName}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  Clocked in {formatDistanceToNow(new Date(entry.clockIn), { addSuffix: true })}
                                </p>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
                              <div>
                                <span className="font-medium">Clock In:</span>{' '}
                                {format(new Date(entry.clockIn), 'MMM d, yyyy h:mm a')}
                              </div>
                              <div>
                                <span className="font-medium">Duration:</span>{' '}
                                <span className="font-semibold text-green-600">
                                  {formatDuration(entry.clockIn, entry.clockOut)}
                                </span>
                              </div>
                              {entry.job && (
                                <div>
                                  <span className="font-medium">Job:</span>{' '}
                                  <Link
                                    href={`/jobs/${entry.job.id}`}
                                    className="text-blue-600 hover:text-blue-800"
                                  >
                                    {entry.job.serviceType} - {entry.job.customerFirstName}{' '}
                                    {entry.job.customerLastName}
                                  </Link>
                                </div>
                              )}
                              {entry.breakMinutes > 0 && (
                                <div>
                                  <span className="font-medium">Break Time:</span>{' '}
                                  {formatTime(entry.breakMinutes)}
                                </div>
                              )}
                            </div>
                            {entry.notes && (
                              <p className="text-sm text-gray-600 mt-2 italic">{entry.notes}</p>
                            )}
                          </div>
                          <div className="flex flex-col gap-2 md:min-w-[200px]">
                            {isOnBreak ? (
                              <button
                                onClick={() => handleBreak(entry.id, 'end')}
                                className="bg-orange-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-orange-700 transition-colors"
                              >
                                End Break
                              </button>
                            ) : (
                              <button
                                onClick={() => handleBreak(entry.id, 'start')}
                                className="bg-yellow-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-yellow-700 transition-colors"
                              >
                                Start Break
                              </button>
                            )}
                            <button
                              onClick={() => handleClockOut(entry.id)}
                              className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
                            >
                              Clock Out
                            </button>
                            {isOnBreak && (
                              <div className="bg-orange-100 text-orange-800 px-3 py-2 rounded-md text-xs font-medium text-center">
                                ⏸️ On Break
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Completed Entries */}
            {completedEntries.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Completed Shifts ({completedEntries.length})
                </h2>
                <div className="space-y-3">
                  {completedEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="bg-white rounded-lg shadow-md p-4 md:p-6"
                    >
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {entry.employee?.photo ? (
                              <img
                                src={entry.employee.photo}
                                alt={`${entry.employee.firstName} ${entry.employee.lastName}`}
                                className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600">
                                {entry.employee?.firstName[0]}{entry.employee?.lastName[0]}
                              </div>
                            )}
                            <div>
                              <h3 className="font-semibold text-gray-900">
                                {entry.employee?.firstName} {entry.employee?.lastName}
                              </h3>
                              <p className="text-xs text-gray-600">
                                {format(new Date(entry.date), 'MMM d, yyyy')}
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-700">
                            <div>
                              <span className="font-medium">In:</span>{' '}
                              {format(new Date(entry.clockIn), 'h:mm a')}
                            </div>
                            <div>
                              <span className="font-medium">Out:</span>{' '}
                              {entry.clockOut ? format(new Date(entry.clockOut), 'h:mm a') : 'N/A'}
                            </div>
                            <div>
                              <span className="font-medium">Hours:</span>{' '}
                              <span className="font-semibold text-green-600">
                                {formatTime(entry.totalMinutes || 0)}
                              </span>
                            </div>
                            {entry.breakMinutes > 0 && (
                              <div>
                                <span className="font-medium">Break:</span>{' '}
                                {formatTime(entry.breakMinutes)}
                              </div>
                            )}
                          </div>
                          {entry.job && (
                            <div className="text-sm text-gray-600 mt-2">
                              <span className="font-medium">Job:</span>{' '}
                              <Link
                                href={`/jobs/${entry.job.id}`}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                {entry.job.serviceType}
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeEntries.length === 0 && completedEntries.length === 0 && (
              <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                <p className="text-gray-600 mb-4">No time entries found for the selected filters.</p>
                <button
                  onClick={() => setShowClockInForm(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-md font-medium hover:bg-green-700 transition-colors"
                >
                  Clock In First Employee
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

