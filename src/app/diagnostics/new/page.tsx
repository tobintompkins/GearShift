'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { Customer, Vehicle, Job, Employee } from '@/lib/types';
import { format } from 'date-fns';

export default function NewDiagnosticJobPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [formData, setFormData] = useState({
    customerId: '',
    vehicleId: '',
    jobId: '',
    employeeId: '',
    diagnosticDate: new Date().toISOString().split('T')[0],
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
    fetchCustomers();
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (formData.customerId) {
      fetchVehicles(formData.customerId);
    } else {
      setVehicles([]);
    }
  }, [formData.customerId]);

  useEffect(() => {
    if (formData.vehicleId) {
      fetchJobs(formData.vehicleId);
    } else {
      setJobs([]);
    }
  }, [formData.vehicleId]);

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers');
      if (response.ok) {
        const data = await response.json();
        setCustomers(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
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
      const response = await fetch('/api/diagnostic-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          jobId: formData.jobId || null,
          employeeId: formData.employeeId || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create diagnostic job');
      }

      router.push('/diagnostics');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-4 md:py-8 max-w-4xl">
        <div className="mb-4 md:mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            New Diagnostic Job
          </h1>
          <p className="text-sm md:text-base text-gray-600">
            Create a new OBD / diagnostic job tracking record
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-4 md:p-6 space-y-6">
          {/* Customer & Vehicle */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer *
              </label>
              <select
                value={formData.customerId}
                onChange={(e) => setFormData({ ...formData, customerId: e.target.value, vehicleId: '' })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Select Customer --</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.firstName} {customer.lastName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vehicle *
              </label>
              <select
                value={formData.vehicleId}
                onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value, jobId: '' })}
                required
                disabled={!formData.customerId}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="">-- Select Vehicle --</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.year} {vehicle.make} {vehicle.model}
                    {vehicle.licensePlate && ` (${vehicle.licensePlate})`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Related Job & Employee */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Related Repair Job (Optional)
              </label>
              <select
                value={formData.jobId}
                onChange={(e) => setFormData({ ...formData, jobId: e.target.value })}
                disabled={!formData.vehicleId}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
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
            <p className="text-xs text-gray-500 mt-1">Enter trouble codes separated by commas</p>
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
              placeholder="Notes from live data readings (RPM, temperature, pressure, etc.)..."
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
              {loading ? 'Creating...' : 'Create Diagnostic Job'}
            </button>
            <Link
              href="/diagnostics"
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

