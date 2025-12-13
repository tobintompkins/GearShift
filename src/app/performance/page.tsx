'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { Employee } from '@/lib/types';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

interface PerformanceMetrics {
  jobsCompleted: number;
  totalRevenue: number;
  averageRevenue: number;
  averageJobTime: number;
  customerSatisfaction: number | null;
  totalJobs: number;
  pendingJobs: number;
  inProgressJobs: number;
  awaitingPartsJobs: number;
  cancelledJobs: number;
}

interface PerformanceData {
  employee: Employee;
  metrics: PerformanceMetrics;
}

export default function PerformancePage() {
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  useEffect(() => {
    fetchPerformanceData();
  }, [dateRange, startDate, endDate]);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (dateRange === 'custom' && startDate && endDate) {
        params.append('startDate', startDate);
        params.append('endDate', endDate);
      } else if (dateRange === 'month') {
        const start = startOfMonth(new Date());
        const end = endOfMonth(new Date());
        params.append('startDate', format(start, 'yyyy-MM-dd'));
        params.append('endDate', format(end, 'yyyy-MM-dd'));
      } else if (dateRange === 'week') {
        const start = subDays(new Date(), 7);
        const end = new Date();
        params.append('startDate', format(start, 'yyyy-MM-dd'));
        params.append('endDate', format(end, 'yyyy-MM-dd'));
      }
      
      const response = await fetch(`/api/employees/performance?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch performance data');
      }
      const data = await response.json();
      setPerformanceData(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (minutes: number) => {
    if (minutes === 0) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const overallStats = {
    totalEmployees: performanceData.length,
    totalJobsCompleted: performanceData.reduce((sum, d) => sum + d.metrics.jobsCompleted, 0),
    totalRevenue: performanceData.reduce((sum, d) => sum + d.metrics.totalRevenue, 0),
    averageRevenuePerEmployee: performanceData.length > 0
      ? performanceData.reduce((sum, d) => sum + d.metrics.totalRevenue, 0) / performanceData.length
      : 0,
    averageJobTime: performanceData.length > 0
      ? performanceData.reduce((sum, d) => sum + d.metrics.averageJobTime, 0) / performanceData.length
      : 0,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-4 md:py-8">
        <div className="mb-4 md:mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              📊 Technician Performance Metrics
            </h1>
            <p className="text-sm md:text-base text-gray-600">
              Track employee performance, revenue, and job completion metrics
            </p>
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Date Range</h2>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Period:</label>
              <select
                value={dateRange}
                onChange={(e) => {
                  setDateRange(e.target.value);
                  if (e.target.value !== 'custom') {
                    setStartDate('');
                    setEndDate('');
                  }
                }}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="all">All Time</option>
                <option value="month">This Month</option>
                <option value="week">Last 7 Days</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
            {dateRange === 'custom' && (
              <>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Start:</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">End:</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Overall Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold text-blue-600">{overallStats.totalEmployees}</div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">Active Technicians</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold text-green-600">{overallStats.totalJobsCompleted}</div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">Total Jobs Completed</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold text-purple-600">
              {formatCurrency(overallStats.totalRevenue)}
            </div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">Total Revenue</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold text-orange-600">
              {formatCurrency(overallStats.averageRevenuePerEmployee)}
            </div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">Avg Revenue/Employee</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold text-indigo-600">
              {formatTime(Math.round(overallStats.averageJobTime))}
            </div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">Avg Job Time</div>
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
            <p className="mt-4 text-gray-600">Loading performance metrics...</p>
          </div>
        ) : performanceData.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <p className="text-gray-600 mb-4">No performance data found.</p>
            <Link
              href="/employees"
              className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors"
            >
              Add Employees
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {performanceData.map((data) => (
              <div
                key={data.employee.id}
                className="bg-white rounded-lg shadow-md p-4 md:p-6"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                  <div className="flex items-center gap-4">
                    {data.employee.photo ? (
                      <img
                        src={data.employee.photo}
                        alt={`${data.employee.firstName} ${data.employee.lastName}`}
                        className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-600">
                        {data.employee.firstName[0]}{data.employee.lastName[0]}
                      </div>
                    )}
                    <div>
                      <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
                        {data.employee.firstName} {data.employee.lastName}
                      </h2>
                      {data.employee.skills && (
                        <p className="text-sm text-gray-600 mt-1">
                          Skills: {data.employee.skills}
                        </p>
                      )}
                      {data.employee.email && (
                        <p className="text-xs text-gray-500">{data.employee.email}</p>
                      )}
                    </div>
                  </div>
                  <Link
                    href={`/employees/${data.employee.id}`}
                    className="bg-blue-100 text-blue-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-200 transition-colors"
                  >
                    View Profile
                  </Link>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="text-sm font-medium text-blue-700 mb-1">Jobs Completed</div>
                    <div className="text-2xl md:text-3xl font-bold text-blue-900">
                      {data.metrics.jobsCompleted}
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      of {data.metrics.totalJobs} total jobs
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <div className="text-sm font-medium text-green-700 mb-1">Total Revenue</div>
                    <div className="text-2xl md:text-3xl font-bold text-green-900">
                      {formatCurrency(data.metrics.totalRevenue)}
                    </div>
                    <div className="text-xs text-green-600 mt-1">
                      Avg: {formatCurrency(data.metrics.averageRevenue)}
                    </div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <div className="text-sm font-medium text-purple-700 mb-1">Average Job Time</div>
                    <div className="text-2xl md:text-3xl font-bold text-purple-900">
                      {formatTime(data.metrics.averageJobTime)}
                    </div>
                    <div className="text-xs text-purple-600 mt-1">
                      per completed job
                    </div>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                    <div className="text-sm font-medium text-yellow-700 mb-1">Customer Satisfaction</div>
                    <div className="text-2xl md:text-3xl font-bold text-yellow-900">
                      {data.metrics.customerSatisfaction !== null
                        ? `${data.metrics.customerSatisfaction}/5 ⭐`
                        : 'N/A'}
                    </div>
                    <div className="text-xs text-yellow-600 mt-1">
                      {data.metrics.customerSatisfaction === null && 'Survey feature coming soon'}
                    </div>
                  </div>
                </div>

                {/* Job Status Breakdown */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Job Status Breakdown</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="text-center">
                      <div className="text-lg font-bold text-yellow-600">{data.metrics.pendingJobs}</div>
                      <div className="text-xs text-gray-600">Pending</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">{data.metrics.inProgressJobs}</div>
                      <div className="text-xs text-gray-600">In Progress</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-orange-600">{data.metrics.awaitingPartsJobs}</div>
                      <div className="text-xs text-gray-600">Awaiting Parts</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-red-600">{data.metrics.cancelledJobs}</div>
                      <div className="text-xs text-gray-600">Cancelled</div>
                    </div>
                  </div>
                </div>

                {/* Performance Bar */}
                {overallStats.totalRevenue > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Revenue Contribution</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {((data.metrics.totalRevenue / overallStats.totalRevenue) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all"
                        style={{
                          width: `${(data.metrics.totalRevenue / overallStats.totalRevenue) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

