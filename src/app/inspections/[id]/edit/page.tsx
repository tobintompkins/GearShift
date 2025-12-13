'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { InspectionChecklist, InspectionItemStatus, Vehicle, Job, Employee } from '@/lib/types';
import { format } from 'date-fns';

const statusOptions: { value: InspectionItemStatus; label: string }[] = [
  { value: 'ok', label: '✅ OK' },
  { value: 'needs-attention', label: '⚠️ Needs Attention' },
  { value: 'immediate-repair', label: '❌ Immediate Repair' },
];

const inspectionCategories = [
  { key: 'tires', label: '🛞 Tires', description: 'Tire condition, tread depth, pressure, wear patterns' },
  { key: 'brakes', label: '🛑 Brakes', description: 'Brake pads, rotors, calipers, brake fluid' },
  { key: 'suspension', label: '🔧 Suspension', description: 'Shocks, struts, springs, bushings' },
  { key: 'steering', label: '🚗 Steering', description: 'Steering components, alignment, power steering' },
  { key: 'fluids', label: '💧 Fluids', description: 'Engine oil, transmission, coolant, brake fluid levels' },
  { key: 'beltsHoses', label: '⚙️ Belts & Hoses', description: 'Serpentine belt, timing belt, radiator hoses' },
  { key: 'battery', label: '🔋 Battery Health', description: 'Battery voltage, terminals, charging system' },
];

export default function EditInspectionPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inspection, setInspection] = useState<InspectionChecklist | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [formData, setFormData] = useState({
    vehicleId: '',
    jobId: '',
    employeeId: '',
    inspectionDate: new Date().toISOString().split('T')[0],
    mileage: '',
    tiresStatus: '' as InspectionItemStatus | '',
    tiresNotes: '',
    brakesStatus: '' as InspectionItemStatus | '',
    brakesNotes: '',
    suspensionStatus: '' as InspectionItemStatus | '',
    suspensionNotes: '',
    steeringStatus: '' as InspectionItemStatus | '',
    steeringNotes: '',
    fluidsStatus: '' as InspectionItemStatus | '',
    fluidsNotes: '',
    beltsHosesStatus: '' as InspectionItemStatus | '',
    beltsHosesNotes: '',
    batteryStatus: '' as InspectionItemStatus | '',
    batteryNotes: '',
    overallStatus: '' as InspectionItemStatus | '',
    overallNotes: '',
    recommendations: '',
    isComplete: false,
  });

  useEffect(() => {
    if (id) {
      fetchInspection();
      fetchVehicles();
      fetchEmployees();
    }
  }, [id]);

  useEffect(() => {
    if (formData.vehicleId) {
      fetchJobs(formData.vehicleId);
    } else {
      setJobs([]);
    }
  }, [formData.vehicleId]);

  const fetchInspection = async () => {
    try {
      setFetching(true);
      const response = await fetch(`/api/inspections/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch inspection');
      }
      const data = await response.json();
      setInspection(data);
      setFormData({
        vehicleId: data.vehicleId || '',
        jobId: data.jobId || '',
        employeeId: data.employeeId || '',
        inspectionDate: format(new Date(data.inspectionDate), 'yyyy-MM-dd'),
        mileage: data.mileage ? data.mileage.toString() : '',
        tiresStatus: data.tiresStatus || '',
        tiresNotes: data.tiresNotes || '',
        brakesStatus: data.brakesStatus || '',
        brakesNotes: data.brakesNotes || '',
        suspensionStatus: data.suspensionStatus || '',
        suspensionNotes: data.suspensionNotes || '',
        steeringStatus: data.steeringStatus || '',
        steeringNotes: data.steeringNotes || '',
        fluidsStatus: data.fluidsStatus || '',
        fluidsNotes: data.fluidsNotes || '',
        beltsHosesStatus: data.beltsHosesStatus || '',
        beltsHosesNotes: data.beltsHosesNotes || '',
        batteryStatus: data.batteryStatus || '',
        batteryNotes: data.batteryNotes || '',
        overallStatus: data.overallStatus || '',
        overallNotes: data.overallNotes || '',
        recommendations: data.recommendations || '',
        isComplete: data.isComplete || false,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setFetching(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      const response = await fetch('/api/vehicles');
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

    if (!formData.vehicleId || !formData.inspectionDate) {
      setError('Vehicle and inspection date are required');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/inspections/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          jobId: formData.jobId || null,
          employeeId: formData.employeeId || null,
          mileage: formData.mileage ? Number(formData.mileage) : null,
          tiresStatus: formData.tiresStatus || null,
          tiresNotes: formData.tiresNotes || null,
          brakesStatus: formData.brakesStatus || null,
          brakesNotes: formData.brakesNotes || null,
          suspensionStatus: formData.suspensionStatus || null,
          suspensionNotes: formData.suspensionNotes || null,
          steeringStatus: formData.steeringStatus || null,
          steeringNotes: formData.steeringNotes || null,
          fluidsStatus: formData.fluidsStatus || null,
          fluidsNotes: formData.fluidsNotes || null,
          beltsHosesStatus: formData.beltsHosesStatus || null,
          beltsHosesNotes: formData.beltsHosesNotes || null,
          batteryStatus: formData.batteryStatus || null,
          batteryNotes: formData.batteryNotes || null,
          overallStatus: formData.overallStatus || null,
          overallNotes: formData.overallNotes || null,
          recommendations: formData.recommendations || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update inspection checklist');
      }

      router.push(`/inspections/${id}`);
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
            <p className="mt-4 text-gray-600">Loading inspection...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error && !inspection) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-4 md:py-8 max-w-6xl">
        <div className="mb-4 md:mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Edit Inspection Checklist
          </h1>
          <p className="text-sm md:text-base text-gray-600">
            Update inspection details
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-4 md:p-6 space-y-6">
          {/* Header Information */}
          <div className="border-b border-gray-200 pb-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Inspection Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vehicle *
                </label>
                <select
                  value={formData.vehicleId}
                  onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value, jobId: '' })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Inspection Date *
                </label>
                <input
                  type="date"
                  value={formData.inspectionDate}
                  onChange={(e) => setFormData({ ...formData, inspectionDate: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mileage
                </label>
                <input
                  type="number"
                  value={formData.mileage}
                  onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                  placeholder="Enter mileage"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Inspector
                </label>
                <select
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Select Inspector --</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.firstName} {employee.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Related Job (Optional)
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
            </div>
          </div>

          {/* Inspection Items */}
          <div className="border-b border-gray-200 pb-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Inspection Items</h2>
            <div className="space-y-6">
              {inspectionCategories.map((category) => {
                const statusKey = `${category.key}Status` as keyof typeof formData;
                const notesKey = `${category.key}Notes` as keyof typeof formData;
                const status = formData[statusKey] as InspectionItemStatus | '';
                const notes = formData[notesKey] as string;

                return (
                  <div key={category.key} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{category.label}</h3>
                        <p className="text-xs text-gray-600">{category.description}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Status
                        </label>
                        <select
                          value={status}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              [statusKey]: e.target.value || '',
                            });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">-- Not Inspected --</option>
                          {statusOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Notes
                        </label>
                        <textarea
                          value={notes}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              [notesKey]: e.target.value,
                            });
                          }}
                          rows={2}
                          placeholder="Enter inspection notes..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Overall Assessment */}
          <div className="border-b border-gray-200 pb-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Overall Assessment</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Overall Status
                </label>
                <select
                  value={formData.overallStatus}
                  onChange={(e) => setFormData({ ...formData, overallStatus: e.target.value as InspectionItemStatus | '' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Select Overall Status --</option>
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Overall Notes
                </label>
                <textarea
                  value={formData.overallNotes}
                  onChange={(e) => setFormData({ ...formData, overallNotes: e.target.value })}
                  rows={3}
                  placeholder="Overall inspection summary..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recommendations
                </label>
                <textarea
                  value={formData.recommendations}
                  onChange={(e) => setFormData({ ...formData, recommendations: e.target.value })}
                  rows={3}
                  placeholder="Recommended repairs or services..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Completion Status */}
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.isComplete}
                onChange={(e) => setFormData({ ...formData, isComplete: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Mark as Complete</span>
            </label>
          </div>

          {/* Form Actions */}
          <div className="flex gap-4 pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 font-medium disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Inspection Checklist'}
            </button>
            <Link
              href={`/inspections/${id}`}
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

