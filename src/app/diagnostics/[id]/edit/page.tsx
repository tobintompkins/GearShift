'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { DiagnosticJob, Customer, Vehicle, Job, Employee } from '@/lib/types';
import { format } from 'date-fns';

export default function EditDiagnosticJobPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [diagnosticJob, setDiagnosticJob] = useState<DiagnosticJob | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [formData, setFormData] = useState({
    jobId: '',
    employeeId: '',
    diagnosticDate: '',
    scanToolUsed: '',
    troubleCodes: '',
    freezeFrameData: '',
    liveDataNotes: '',
    diagnosticConclusion: '',
    recommendedRepairs: '',
    status: 'pending',
    notes: '',
  });

  useEffect(() => {
    if (id) {
      fetchDiagnosticJob();
      fetchEmployees();
    }
  }, [id]);

  useEffect(() => {
    if (diagnosticJob?.vehicleId) {
      fetchVehicles(diagnosticJob.customerId);
      fetchJobs(diagnosticJob.vehicleId);
    }
  }, [diagnosticJob]);

  const fetchDiagnosticJob = async () => {
    try {
      setFetching(true);
      const response = await fetch(`/api/diagnostic-jobs/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch diagnostic job');
      }
      const data = await response.json();
      setDiagnosticJob(data);
      setFormData({
        jobId: data.jobId || '',
        employeeId: data.employeeId || '',
        diagnosticDate: format(new Date(data.diagnosticDate), 'yyyy-MM-dd'),
        scanToolUsed: data.scanToolUsed || '',
        troubleCodes: data.troubleCodes || '',
        freezeFrameData: data.freezeFrameData || '',
        liveDataNotes: data.liveDataNotes || '',
        diagnosticConclusion: data.diagnosticConclusion || '',
        recommendedRepairs: data.recommendedRepairs || '',
        status: data.status,
        notes: data.notes || '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setFetching(false);
    }
  };

  const fetchVehicles = async (customerId: string) => {
    try {
      const response = await fetch(`/api/vehicles?customerId=${customerId}`);
      if (response.ok) {
        const data = await response.json();
        setVehicles(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching vehicles:', err);
    }
  };

  const fetchJobs = async (vehicleId: string) => {
    try {
      const response = await fetch(`/api/jobs?vehicleId=${vehicleId}`);
      if (response.ok) {
        const data = await response.json();
        setJobs(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
    }
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/diagnostic-jobs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          jobId: formData.jobId || null,
          employeeId: formData.employeeId || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update diagnostic job');
      }

      router.push(`/diagnostics/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading diagnostic job...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !diagnosticJob) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error || 'Diagnostic job not found'}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-4 md:py-8 max-w-4xl">
        <div className="mb-4 md:mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Edit Diagnostic Job
          </h1>
          <p className="text-sm md:text-base text-gray-600">
            {diagnosticJob.customer?.firstName} {diagnosticJob.customer?.lastName} - {diagnosticJob.vehicle?.year} {diagnosticJob.vehicle?.make} {diagnosticJob.vehicle?.model}
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-4 md:p-6 space-y-6">
          {/* Related Job & Employee */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Related Repair Job (Optional)
              </label>
              <select
                value={formData.jobId}
                onChange={(e) => setFormData({ ...formData, jobId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- No Related Job --</option>
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {format(new Date(job.date), 'MMM d, yyyy')} - {job.serviceType}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Technician (Optional)
              </label>
              <select
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Select Technician --</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.firstName} {employee.lastName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date & Scan Tool */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Diagnostic Date *
              </label>
              <input
                type="date"
                value={formData.diagnosticDate}
                onChange={(e) => setFormData({ ...formData, diagnosticDate: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Scan Tool Used
              </label>
              <input
                type="text"
                value={formData.scanToolUsed}
                onChange={(e) => setFormData({ ...formData, scanToolUsed: e.target.value })}
                placeholder="e.g., Autel MaxiSys, Snap-on, Launch X431"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Trouble Codes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trouble Codes
            </label>
            <input
              type="text"
              value={formData.troubleCodes}
              onChange={(e) => setFormData({ ...formData, troubleCodes: e.target.value })}
              placeholder="e.g., P0171, P0300, P0420 (comma-separated)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Freeze Frame Data */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Freeze Frame Data
            </label>
            <textarea
              value={formData.freezeFrameData}
              onChange={(e) => setFormData({ ...formData, freezeFrameData: e.target.value })}
              rows={4}
              placeholder="Enter freeze frame data from scan tool..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
          </div>

          {/* Live Data Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Live Data Notes
            </label>
            <textarea
              value={formData.liveDataNotes}
              onChange={(e) => setFormData({ ...formData, liveDataNotes: e.target.value })}
              rows={4}
              placeholder="Notes from live data readings..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Diagnostic Conclusion */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Diagnostic Conclusion
            </label>
            <textarea
              value={formData.diagnosticConclusion}
              onChange={(e) => setFormData({ ...formData, diagnosticConclusion: e.target.value })}
              rows={3}
              placeholder="What was found/diagnosed..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Recommended Repairs */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recommended Repairs
            </label>
            <textarea
              value={formData.recommendedRepairs}
              onChange={(e) => setFormData({ ...formData, recommendedRepairs: e.target.value })}
              rows={3}
              placeholder="Recommended repairs based on diagnostic findings..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status & Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              placeholder="Any additional notes..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Form Actions */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 font-medium disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Diagnostic Job'}
            </button>
            <Link
              href={`/diagnostics/${id}`}
              className="bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 font-medium text-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}

