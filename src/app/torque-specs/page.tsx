'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { TorqueSpec, Vehicle, ServiceType, JobTemplate } from '@/lib/types';

export default function TorqueSpecsPage() {
  const [torqueSpecs, setTorqueSpecs] = useState<TorqueSpec[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [jobTemplates, setJobTemplates] = useState<JobTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterVehicle, setFilterVehicle] = useState<string>('all');
  const [filterServiceType, setFilterServiceType] = useState<string>('all');
  const [filterJobTemplate, setFilterJobTemplate] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    fetchTorqueSpecs();
    fetchVehicles();
    fetchServiceTypes();
    fetchJobTemplates();
  }, [filterVehicle, filterServiceType, filterJobTemplate]);

  const fetchTorqueSpecs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (filterVehicle !== 'all') {
        params.append('vehicleId', filterVehicle);
      }
      if (filterServiceType !== 'all') {
        params.append('serviceTypeId', filterServiceType);
      }
      if (filterJobTemplate !== 'all') {
        params.append('jobTemplateId', filterJobTemplate);
      }
      params.append('activeOnly', 'true');

      const response = await fetch(`/api/torque-specs?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch torque specs');
      }
      const data = await response.json();
      setTorqueSpecs(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
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

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this torque spec?')) {
      return;
    }

    try {
      const response = await fetch(`/api/torque-specs/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete torque spec');
      }

      fetchTorqueSpecs();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const filteredSpecs = torqueSpecs.filter((spec) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      spec.componentName.toLowerCase().includes(search) ||
      spec.notes?.toLowerCase().includes(search)
    );
  });

  const stats = {
    total: torqueSpecs.length,
    vehicleSpecific: torqueSpecs.filter((s) => s.vehicleId).length,
    serviceTypeSpecific: torqueSpecs.filter((s) => s.serviceTypeId).length,
    templateSpecific: torqueSpecs.filter((s) => s.jobTemplateId).length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-4 md:py-8">
        <div className="mb-4 md:mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              🔩 Torque Spec Reference
            </h1>
            <p className="text-sm md:text-base text-gray-600">
              Track torque specifications for vehicles, job types, and service templates
            </p>
          </div>
          <Link
            href="/torque-specs/new"
            className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors text-sm md:text-base text-center"
          >
            + New Torque Spec
          </Link>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">Total Specs</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold text-green-600">{stats.vehicleSpecific}</div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">Vehicle-Specific</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold text-purple-600">{stats.serviceTypeSpecific}</div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">Service Type</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold text-orange-600">{stats.templateSpecific}</div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">Template-Specific</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Vehicle:</label>
              <select
                value={filterVehicle}
                onChange={(e) => setFilterVehicle(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="all">All Vehicles</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Service Type:</label>
              <select
                value={filterServiceType}
                onChange={(e) => setFilterServiceType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="all">All Service Types</option>
                {serviceTypes.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Job Template:</label>
              <select
                value={filterJobTemplate}
                onChange={(e) => setFilterJobTemplate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="all">All Templates</option>
                {jobTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Search by component name..."
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
            <p className="mt-4 text-gray-600">Loading torque specs...</p>
          </div>
        ) : filteredSpecs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <p className="text-gray-600 mb-4">No torque specs found.</p>
            <Link
              href="/torque-specs/new"
              className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors"
            >
              Create First Torque Spec
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSpecs.map((spec) => (
              <div
                key={spec.id}
                className="bg-white rounded-lg shadow-md p-4 md:p-6"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <h3 className="text-lg md:text-xl font-semibold text-gray-900">
                        {spec.componentName}
                      </h3>
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-300">
                        {spec.torqueValue} {spec.unit}
                      </span>
                      {spec.sequence && (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-300">
                          Sequence: {spec.sequence}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
                      {spec.vehicle && (
                        <div>
                          <span className="font-medium">Vehicle:</span>{' '}
                          <Link
                            href={`/vehicles/${spec.vehicle.id}`}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            {spec.vehicle.year} {spec.vehicle.make} {spec.vehicle.model}
                          </Link>
                        </div>
                      )}
                      {spec.serviceType && (
                        <div>
                          <span className="font-medium">Service Type:</span>{' '}
                          <span className="text-gray-900">{spec.serviceType.name}</span>
                        </div>
                      )}
                      {spec.jobTemplate && (
                        <div>
                          <span className="font-medium">Job Template:</span>{' '}
                          <Link
                            href={`/job-templates/${spec.jobTemplate.id}`}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            {spec.jobTemplate.name}
                          </Link>
                        </div>
                      )}
                    </div>

                    {spec.notes && (
                      <p className="text-sm text-gray-600 mt-3">{spec.notes}</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 md:min-w-[150px]">
                    <Link
                      href={`/torque-specs/${spec.id}/edit`}
                      className="bg-blue-600 text-white px-3 py-2 rounded-md text-xs font-medium hover:bg-blue-700 transition-colors text-center"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(spec.id)}
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

