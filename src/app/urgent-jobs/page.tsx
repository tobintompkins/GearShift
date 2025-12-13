'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { Job, UrgentType } from '@/lib/types';
import { format, isPast, isToday } from 'date-fns';

export default function UrgentJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const urgentTypes: UrgentType[] = ['emergency', 'breakdown', 'no-start', 'safety-issue'];

  const urgentTypeLabels: Record<UrgentType, string> = {
    emergency: '🚨 Emergency',
    breakdown: '⚠️ Breakdown',
    'no-start': '🔋 No-Start',
    'safety-issue': '🛡️ Safety Issue',
  };

  const urgentTypeColors: Record<UrgentType, string> = {
    emergency: 'bg-red-100 text-red-800 border-red-300',
    breakdown: 'bg-orange-100 text-orange-800 border-orange-300',
    'no-start': 'bg-yellow-100 text-yellow-800 border-yellow-300',
    'safety-issue': 'bg-purple-100 text-purple-800 border-purple-300',
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'awaiting-parts':
        return 'bg-orange-100 text-orange-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [filterType, filterStatus]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      params.append('urgent', 'true');
      if (filterType !== 'all') {
        params.append('urgentType', filterType);
      }
      if (filterStatus !== 'all') {
        params.append('status', filterStatus);
      }
      
      const response = await fetch(`/api/jobs?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch urgent jobs');
      }
      const data = await response.json();
      setJobs(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: jobs.length,
    emergency: jobs.filter(j => j.urgentType === 'emergency').length,
    breakdown: jobs.filter(j => j.urgentType === 'breakdown').length,
    noStart: jobs.filter(j => j.urgentType === 'no-start').length,
    safetyIssue: jobs.filter(j => j.urgentType === 'safety-issue').length,
    pending: jobs.filter(j => j.status === 'pending').length,
    inProgress: jobs.filter(j => j.status === 'in-progress').length,
    overdue: jobs.filter(j => {
      try {
        return isPast(new Date(j.date)) && j.status !== 'completed' && j.status !== 'cancelled';
      } catch {
        return false;
      }
    }).length,
    today: jobs.filter(j => {
      try {
        return isToday(new Date(j.date));
      } catch {
        return false;
      }
    }).length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-4 md:py-8">
        <div className="mb-4 md:mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              🚨 Urgent Jobs Queue
            </h1>
            <p className="text-sm md:text-base text-gray-600">
              Priority jobs requiring immediate attention
            </p>
          </div>
          <Link
            href="/jobs/new"
            className="w-full sm:w-auto bg-red-600 text-white px-4 py-2 rounded-md font-medium hover:bg-red-700 transition-colors text-sm md:text-base text-center"
          >
            + New Urgent Job
          </Link>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4 text-center border-l-4 border-red-500">
            <div className="text-2xl md:text-3xl font-bold text-red-600">{stats.total}</div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">Total Urgent</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center border-l-4 border-orange-500">
            <div className="text-2xl md:text-3xl font-bold text-orange-600">{stats.emergency}</div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">Emergencies</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center border-l-4 border-yellow-500">
            <div className="text-2xl md:text-3xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">Pending</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center border-l-4 border-purple-500">
            <div className="text-2xl md:text-3xl font-bold text-purple-600">{stats.overdue}</div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">Overdue</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center border-l-4 border-blue-500">
            <div className="text-2xl md:text-3xl font-bold text-blue-600">{stats.today}</div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">Today</div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Urgent Type:</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
            >
              <option value="all">All Types</option>
              {urgentTypes.map(type => (
                <option key={type} value={type}>{urgentTypeLabels[type]}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Status:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="awaiting-parts">Awaiting Parts</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            <p className="mt-4 text-gray-600">Loading urgent jobs...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <p className="text-gray-600 mb-4">No urgent jobs found.</p>
            <Link
              href="/jobs/new"
              className="bg-red-600 text-white px-4 py-2 rounded-md font-medium hover:bg-red-700 transition-colors"
            >
              Create Urgent Job
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => {
              const isOverdue = (() => {
                try {
                  return isPast(new Date(job.date)) && job.status !== 'completed' && job.status !== 'cancelled';
                } catch {
                  return false;
                }
              })();
              const isTodayJob = (() => {
                try {
                  return isToday(new Date(job.date));
                } catch {
                  return false;
                }
              })();

              return (
                <div
                  key={job.id}
                  className={`bg-white rounded-lg shadow-md p-4 md:p-6 border-l-4 ${
                    job.urgentType === 'emergency'
                      ? 'border-red-500'
                      : job.urgentType === 'breakdown'
                      ? 'border-orange-500'
                      : job.urgentType === 'no-start'
                      ? 'border-yellow-500'
                      : job.urgentType === 'safety-issue'
                      ? 'border-purple-500'
                      : 'border-red-500'
                  } ${isOverdue ? 'ring-2 ring-red-300' : ''}`}
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <h3 className="text-lg md:text-xl font-semibold text-gray-900">
                          {job.customerFirstName} {job.customerLastName}
                        </h3>
                        {job.urgentType && (
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium border ${
                              urgentTypeColors[job.urgentType]
                            }`}
                          >
                            {urgentTypeLabels[job.urgentType]}
                          </span>
                        )}
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}
                        >
                          {job.status.charAt(0).toUpperCase() + job.status.slice(1).replace('-', ' ')}
                        </span>
                        {isOverdue && (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-300">
                            ⚠️ Overdue
                          </span>
                        )}
                        {isTodayJob && (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-300">
                            📅 Today
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm text-gray-600 mb-3">
                        <div>
                          <span className="font-medium">Service:</span>{' '}
                          <span className="text-gray-900">{job.serviceType}</span>
                        </div>
                        <div>
                          <span className="font-medium">Date:</span>{' '}
                          <span className="text-gray-900">
                            {(() => {
                              try {
                                return format(new Date(job.date), 'MMM d, yyyy');
                              } catch {
                                return 'Invalid date';
                              }
                            })()}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Time:</span>{' '}
                          <span className="text-gray-900">{job.startTime}</span>
                        </div>
                        <div>
                          <span className="font-medium">Vehicle:</span>{' '}
                          <span className="text-gray-900">{job.vehicleInfo}</span>
                        </div>
                        <div>
                          <span className="font-medium">Address:</span>{' '}
                          <span className="text-gray-900">{job.customerAddress}</span>
                        </div>
                        <div>
                          <span className="font-medium">Phone:</span>{' '}
                          <span className="text-gray-900">{job.customerPhone}</span>
                        </div>
                        {job.employee && (
                          <div>
                            <span className="font-medium">Assigned to:</span>{' '}
                            <span className="text-gray-900">
                              {job.employee.firstName} {job.employee.lastName}
                            </span>
                          </div>
                        )}
                        {job.price && (
                          <div>
                            <span className="font-medium">Price:</span>{' '}
                            <span className="text-gray-900 font-semibold">${job.price.toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 md:min-w-[150px]">
                      <Link
                        href={`/jobs/${job.id}`}
                        className="bg-red-600 text-white px-3 py-2 rounded-md text-xs font-medium hover:bg-red-700 transition-colors text-center"
                      >
                        View Details
                      </Link>
                      <Link
                        href={`/jobs/${job.id}/edit`}
                        className="bg-blue-100 text-blue-700 px-3 py-2 rounded-md text-xs font-medium hover:bg-blue-200 transition-colors text-center"
                      >
                        Edit Job
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

