'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { TorqueSpec, Vehicle, ServiceType, JobTemplate } from '@/lib/types';

export default function EditTorqueSpecPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [torqueSpec, setTorqueSpec] = useState<TorqueSpec | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [jobTemplates, setJobTemplates] = useState<JobTemplate[]>([]);

  const [formData, setFormData] = useState({
    componentName: '',
    torqueValue: '',
    unit: 'ft-lbs',
    sequence: '',
    notes: '',
    vehicleId: '',
    serviceTypeId: '',
    jobTemplateId: '',
    isActive: true,
  });

  useEffect(() => {
    if (id) {
      fetchTorqueSpec();
      fetchVehicles();
      fetchServiceTypes();
      fetchJobTemplates();
    }
  }, [id]);

  const fetchTorqueSpec = async () => {
    try {
      setFetching(true);
      const response = await fetch(`/api/torque-specs/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch torque spec');
      }
      const data = await response.json();
      setTorqueSpec(data);
      setFormData({
        componentName: data.componentName,
        torqueValue: data.torqueValue.toString(),
        unit: data.unit,
        sequence: data.sequence || '',
        notes: data.notes || '',
        vehicleId: data.vehicleId || '',
        serviceTypeId: data.serviceTypeId || '',
        jobTemplateId: data.jobTemplateId || '',
        isActive: data.isActive,
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

  const fetchServiceTypes = async () => {
    try {
      const response = await fetch('/api/service-types');
      if (response.ok) {
        const data = await response.json();
        setServiceTypes(Array.isArray(data) ? data.filter((st: ServiceType) => st.isActive) : []);
      }
    } catch (err) {
      console.error('Error fetching service types:', err);
    }
  };

  const fetchJobTemplates = async () => {
    try {
      const response = await fetch('/api/job-templates?activeOnly=true');
      if (response.ok) {
        const data = await response.json();
        setJobTemplates(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching job templates:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!formData.componentName || !formData.torqueValue) {
      setError('Component name and torque value are required');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/torque-specs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          torqueValue: Number(formData.torqueValue),
          vehicleId: formData.vehicleId || null,
          serviceTypeId: formData.serviceTypeId || null,
          jobTemplateId: formData.jobTemplateId || null,
          sequence: formData.sequence || null,
          notes: formData.notes || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update torque spec');
      }

      router.push('/torque-specs');
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
            <p className="mt-4 text-gray-600">Loading torque spec...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !torqueSpec) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error || 'Torque spec not found'}
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
            Edit Torque Spec
          </h1>
          <p className="text-sm md:text-base text-gray-600">
            {torqueSpec.componentName} - {torqueSpec.torqueValue} {torqueSpec.unit}
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-4 md:p-6 space-y-6">
          {/* Component Name & Torque Value */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Component Name *
              </label>
              <input
                type="text"
                value={formData.componentName}
                onChange={(e) => setFormData({ ...formData, componentName: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Torque Value *
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.torqueValue}
                  onChange={(e) => setFormData({ ...formData, torqueValue: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit *
                </label>
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ft-lbs">ft-lbs</option>
                  <option value="Nm">Nm</option>
                  <option value="in-lbs">in-lbs</option>
                </select>
              </div>
            </div>
          </div>

          {/* Sequence */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sequence (Optional)
            </label>
            <input
              type="text"
              value={formData.sequence}
              onChange={(e) => setFormData({ ...formData, sequence: e.target.value })}
              placeholder="e.g., 1-2-3-4-5-6 for head bolts"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Attachments */}
          <div className="border-t border-gray-200 pt-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Attach To (Optional)</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vehicle
                </label>
                <select
                  value={formData.vehicleId}
                  onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- No Vehicle --</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service Type
                </label>
                <select
                  value={formData.serviceTypeId}
                  onChange={(e) => setFormData({ ...formData, serviceTypeId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- No Service Type --</option>
                  {serviceTypes.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job Template
                </label>
                <select
                  value={formData.jobTemplateId}
                  onChange={(e) => setFormData({ ...formData, jobTemplateId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- No Template --</option>
                  {jobTemplates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
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
              {loading ? 'Updating...' : 'Update Torque Spec'}
            </button>
            <Link
              href="/torque-specs"
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

