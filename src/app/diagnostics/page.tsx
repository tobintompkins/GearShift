'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { DiagnosticJob, DiagnosticJobStatus, Customer, Vehicle, Job, Employee } from '@/lib/types';
import { format } from 'date-fns';

const statusColors: Record<DiagnosticJobStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  'in-progress': 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

export default function DiagnosticsPage() {
  const [diagnosticJobs, setDiagnosticJobs] = useState<DiagnosticJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCustomer, setFilterCustomer] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    fetchDiagnosticJobs();
  }, [filterStatus, filterCustomer]);

  const fetchDiagnosticJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (filterStatus !== 'all') {
        params.append('status', filterStatus);
      }
      if (filterCustomer !== 'all') {
        params.append('customerId', filterCustomer);
      }

      const response = await fetch(`/api/diagnostic-jobs?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch diagnostic jobs');
      }
      const data = await response.json();
      setDiagnosticJobs(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this diagnostic job?')) {
      return;
    }

    try {
      const response = await fetch(`/api/diagnostic-jobs/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete diagnostic job');
      }

      fetchDiagnosticJobs();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const filteredJobs = diagnosticJobs.filter((job) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      job.customer?.firstName?.toLowerCase().includes(search) ||
      job.customer?.lastName?.toLowerCase().includes(search) ||
      job.vehicle?.make?.toLowerCase().includes(search) ||
      job.vehicle?.model?.toLowerCase().includes(search) ||
      job.troubleCodes?.toLowerCase().includes(search) ||
      job.scanToolUsed?.toLowerCase().includes(search) ||
      job.diagnosticConclusion?.toLowerCase().includes(search)
    );
  });

  const stats = {
    total: diagnosticJobs.length,
    pending: diagnosticJobs.filter((j) => j.status === 'pending').length,
    inProgress: diagnosticJobs.filter((j) => j.status === 'in-progress').length,
    completed: diagnosticJobs.filter((j) => j.status === 'completed').length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-4 md:py-8">
        <div className="mb-4 md:mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              🔧 OBD / Diagnostic Job Tracking
            </h1>
            <p className="text-sm md:text-base text-gray-600">
              Track diagnostic work separately from repair jobs
            </p>
          </div>
          <Link
            href="/diagnostics/new"
            className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors text-sm md:text-base text-center"
          >
            + New Diagnostic Job
          </Link>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">Total Diagnostics</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">Pending</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold text-blue-600">{stats.inProgress}</div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">In Progress</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">Completed</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Status:</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Search by customer, vehicle, codes, tool..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
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
            <p className="mt-4 text-gray-600">Loading diagnostic jobs...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <p className="text-gray-600 mb-4">No diagnostic jobs found.</p>
            <Link
              href="/diagnostics/new"
              className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors"
            >
              Create First Diagnostic Job
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map((diagnosticJob) => (
              <div
                key={diagnosticJob.id}
                className="bg-white rounded-lg shadow-md p-4 md:p-6"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <h3 className="text-lg md:text-xl font-semibold text-gray-900">
                        {diagnosticJob.customer?.firstName} {diagnosticJob.customer?.lastName}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[diagnosticJob.status as DiagnosticJobStatus]}`}
                      >
                        {diagnosticJob.status.charAt(0).toUpperCase() + diagnosticJob.status.slice(1).replace('-', ' ')}
                      </span>
                      {diagnosticJob.troubleCodes && (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-300">
                          {diagnosticJob.troubleCodes.split(',').length} Code{diagnosticJob.troubleCodes.split(',').length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700 mb-3">
                      <div>
                        <span className="font-medium">Vehicle:</span>{' '}
                        <Link
                          href={`/vehicles/${diagnosticJob.vehicleId}`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {diagnosticJob.vehicle?.year} {diagnosticJob.vehicle?.make} {diagnosticJob.vehicle?.model}
                        </Link>
                        {diagnosticJob.vehicle?.mileage && (
                          <span className="text-gray-500 ml-2">
                            ({diagnosticJob.vehicle.mileage.toLocaleString()} miles)
                          </span>
                        )}
                      </div>
                      <div>
                        <span className="font-medium">Date:</span>{' '}
                        {format(new Date(diagnosticJob.diagnosticDate), 'MMM d, yyyy')}
                      </div>
                      {diagnosticJob.scanToolUsed && (
                        <div>
                          <span className="font-medium">Scan Tool:</span>{' '}
                          <span className="text-gray-900">{diagnosticJob.scanToolUsed}</span>
                        </div>
                      )}
                      {diagnosticJob.employee && (
                        <div>
                          <span className="font-medium">Technician:</span>{' '}
                          <span className="text-gray-900">
                            {diagnosticJob.employee.firstName} {diagnosticJob.employee.lastName}
                          </span>
                        </div>
                      )}
                      {diagnosticJob.job && (
                        <div>
                          <span className="font-medium">Related Job:</span>{' '}
                          <Link
                            href={`/jobs/${diagnosticJob.job.id}`}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            {diagnosticJob.job.serviceType}
                          </Link>
                        </div>
                      )}
                    </div>

                    {diagnosticJob.troubleCodes && (
                      <div className="mb-3">
                        <span className="text-sm font-medium text-gray-700">Trouble Codes:</span>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {diagnosticJob.troubleCodes.split(',').map((code, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-red-50 text-red-700 rounded text-xs font-mono border border-red-200"
                            >
                              {code.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {diagnosticJob.diagnosticConclusion && (
                      <div className="mb-2">
                        <span className="text-sm font-medium text-gray-700">Conclusion:</span>
                        <p className="text-sm text-gray-900 mt-1">{diagnosticJob.diagnosticConclusion}</p>
                      </div>
                    )}

                    {diagnosticJob.recommendedRepairs && (
                      <div className="mb-2">
                        <span className="text-sm font-medium text-gray-700">Recommended Repairs:</span>
                        <p className="text-sm text-gray-900 mt-1">{diagnosticJob.recommendedRepairs}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 md:min-w-[150px]">
                    <Link
                      href={`/diagnostics/${diagnosticJob.id}`}
                      className="bg-blue-600 text-white px-3 py-2 rounded-md text-xs font-medium hover:bg-blue-700 transition-colors text-center"
                    >
                      View Details
                    </Link>
                    <Link
                      href={`/diagnostics/${diagnosticJob.id}/edit`}
                      className="bg-gray-100 text-gray-700 px-3 py-2 rounded-md text-xs font-medium hover:bg-gray-200 transition-colors text-center"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(diagnosticJob.id)}
                      className="bg-red-600 text-white px-3 py-2 rounded-md text-xs font-medium hover:bg-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

