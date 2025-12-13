'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { InspectionChecklist, InspectionItemStatus, Vehicle } from '@/lib/types';
import { format } from 'date-fns';

const statusLabels: Record<InspectionItemStatus, string> = {
  'ok': '✅ OK',
  'needs-attention': '⚠️ Needs Attention',
  'immediate-repair': '❌ Immediate Repair',
};

const statusColors: Record<InspectionItemStatus, string> = {
  'ok': 'bg-green-100 text-green-800 border-green-300',
  'needs-attention': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'immediate-repair': 'bg-red-100 text-red-800 border-red-300',
};

const inspectionCategories = [
  { key: 'tires', label: '🛞 Tires', statusKey: 'tiresStatus' as keyof InspectionChecklist, notesKey: 'tiresNotes' as keyof InspectionChecklist },
  { key: 'brakes', label: '🛑 Brakes', statusKey: 'brakesStatus' as keyof InspectionChecklist, notesKey: 'brakesNotes' as keyof InspectionChecklist },
  { key: 'suspension', label: '🔧 Suspension', statusKey: 'suspensionStatus' as keyof InspectionChecklist, notesKey: 'suspensionNotes' as keyof InspectionChecklist },
  { key: 'steering', label: '🚗 Steering', statusKey: 'steeringStatus' as keyof InspectionChecklist, notesKey: 'steeringNotes' as keyof InspectionChecklist },
  { key: 'fluids', label: '💧 Fluids', statusKey: 'fluidsStatus' as keyof InspectionChecklist, notesKey: 'fluidsNotes' as keyof InspectionChecklist },
  { key: 'beltsHoses', label: '⚙️ Belts & Hoses', statusKey: 'beltsHosesStatus' as keyof InspectionChecklist, notesKey: 'beltsHosesNotes' as keyof InspectionChecklist },
  { key: 'battery', label: '🔋 Battery Health', statusKey: 'batteryStatus' as keyof InspectionChecklist, notesKey: 'batteryNotes' as keyof InspectionChecklist },
];

export default function InspectionsPage() {
  const [inspections, setInspections] = useState<InspectionChecklist[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterVehicle, setFilterVehicle] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showCompleteOnly, setShowCompleteOnly] = useState(false);

  useEffect(() => {
    fetchVehicles();
    fetchInspections();
  }, [filterVehicle, filterStatus, showCompleteOnly]);

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

  const fetchInspections = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (filterVehicle !== 'all') {
        params.append('vehicleId', filterVehicle);
      }
      if (filterStatus !== 'all') {
        params.append('overallStatus', filterStatus);
      }
      if (showCompleteOnly) {
        params.append('completeOnly', 'true');
      }

      const response = await fetch(`/api/inspections?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch inspections');
      }
      const data = await response.json();
      setInspections(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this inspection checklist?')) {
      return;
    }

    try {
      const response = await fetch(`/api/inspections/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete inspection');
      }

      fetchInspections();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const getStatusCount = (status: InspectionItemStatus | null) => {
    if (!status) return 0;
    return inspections.reduce((count, inspection) => {
      return count + (
        (inspection.tiresStatus === status ? 1 : 0) +
        (inspection.brakesStatus === status ? 1 : 0) +
        (inspection.suspensionStatus === status ? 1 : 0) +
        (inspection.steeringStatus === status ? 1 : 0) +
        (inspection.fluidsStatus === status ? 1 : 0) +
        (inspection.beltsHosesStatus === status ? 1 : 0) +
        (inspection.batteryStatus === status ? 1 : 0)
      );
    }, 0);
  };

  const stats = {
    total: inspections.length,
    complete: inspections.filter((i) => i.isComplete).length,
    immediateRepair: inspections.filter((i) => i.overallStatus === 'immediate-repair').length,
    needsAttention: inspections.filter((i) => i.overallStatus === 'needs-attention').length,
    ok: inspections.filter((i) => i.overallStatus === 'ok').length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-4 md:py-8">
        <div className="mb-4 md:mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              📋 Inspection Checklist System
            </h1>
            <p className="text-sm md:text-base text-gray-600">
              Professional digital inspection forms for vehicles
            </p>
          </div>
          <Link
            href="/inspections/new"
            className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors text-sm md:text-base text-center"
          >
            + New Inspection
          </Link>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">Total Inspections</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold text-green-600">{stats.complete}</div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">Complete</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center border-l-4 border-red-500">
            <div className="text-2xl md:text-3xl font-bold text-red-600">{stats.immediateRepair}</div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">Immediate Repair</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center border-l-4 border-yellow-500">
            <div className="text-2xl md:text-3xl font-bold text-yellow-600">{stats.needsAttention}</div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">Needs Attention</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold text-green-600">{stats.ok}</div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">All OK</div>
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
              <label className="text-sm font-medium text-gray-700">Overall Status:</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="all">All Statuses</option>
                <option value="ok">✅ OK</option>
                <option value="needs-attention">⚠️ Needs Attention</option>
                <option value="immediate-repair">❌ Immediate Repair</option>
              </select>
            </div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showCompleteOnly}
                onChange={(e) => setShowCompleteOnly(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Complete Only</span>
            </label>
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
            <p className="mt-4 text-gray-600">Loading inspections...</p>
          </div>
        ) : inspections.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <p className="text-gray-600 mb-4">No inspections found.</p>
            <Link
              href="/inspections/new"
              className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors"
            >
              Create First Inspection
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {inspections.map((inspection) => {
              const itemsWithStatus = inspectionCategories.filter((cat) => {
                const status = inspection[cat.statusKey] as InspectionItemStatus | null;
                return status !== null;
              });

              const immediateRepairCount = itemsWithStatus.filter((cat) => {
                return inspection[cat.statusKey] === 'immediate-repair';
              }).length;

              const needsAttentionCount = itemsWithStatus.filter((cat) => {
                return inspection[cat.statusKey] === 'needs-attention';
              }).length;

              return (
                <div
                  key={inspection.id}
                  className={`bg-white rounded-lg shadow-md p-4 md:p-6 border-l-4 ${
                    inspection.overallStatus === 'immediate-repair'
                      ? 'border-red-500'
                      : inspection.overallStatus === 'needs-attention'
                      ? 'border-yellow-500'
                      : 'border-green-500'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <h3 className="text-lg md:text-xl font-semibold text-gray-900">
                          {inspection.vehicle?.year} {inspection.vehicle?.make} {inspection.vehicle?.model}
                        </h3>
                        {inspection.overallStatus && (
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium border ${
                              statusColors[inspection.overallStatus]
                            }`}
                          >
                            {statusLabels[inspection.overallStatus]}
                          </span>
                        )}
                        {inspection.isComplete && (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-300">
                            ✓ Complete
                          </span>
                        )}
                        {immediateRepairCount > 0 && (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-300">
                            ❌ {immediateRepairCount} Immediate Repair{immediateRepairCount !== 1 ? 's' : ''}
                          </span>
                        )}
                        {needsAttentionCount > 0 && (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-300">
                            ⚠️ {needsAttentionCount} Needs Attention
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700 mb-4">
                        <div>
                          <span className="font-medium">Inspection Date:</span>{' '}
                          {format(new Date(inspection.inspectionDate), 'MMM d, yyyy')}
                        </div>
                        {inspection.mileage && (
                          <div>
                            <span className="font-medium">Mileage:</span>{' '}
                            {inspection.mileage.toLocaleString()} miles
                          </div>
                        )}
                        {inspection.employee && (
                          <div>
                            <span className="font-medium">Inspector:</span>{' '}
                            {inspection.employee.firstName} {inspection.employee.lastName}
                          </div>
                        )}
                        {inspection.job && (
                          <div>
                            <span className="font-medium">Related Job:</span>{' '}
                            <Link
                              href={`/jobs/${inspection.job.id}`}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              {inspection.job.serviceType}
                            </Link>
                          </div>
                        )}
                        {inspection.vehicle?.customer && (
                          <div>
                            <span className="font-medium">Customer:</span>{' '}
                            <Link
                              href={`/customers/${inspection.vehicle.customer.id}`}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              {inspection.vehicle.customer.firstName} {inspection.vehicle.customer.lastName}
                            </Link>
                          </div>
                        )}
                      </div>

                      {/* Inspection Items Summary */}
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 mb-4">
                        {inspectionCategories.map((cat) => {
                          const status = inspection[cat.statusKey] as InspectionItemStatus | null;
                          if (!status) return null;
                          return (
                            <div
                              key={cat.key}
                              className={`p-2 rounded-md border text-center ${
                                statusColors[status]
                              }`}
                            >
                              <div className="text-xs font-medium">{cat.label}</div>
                              <div className="text-xs mt-1">{statusLabels[status]}</div>
                            </div>
                          );
                        })}
                      </div>

                      {inspection.recommendations && (
                        <div className="bg-yellow-50 rounded-md p-3 border border-yellow-200 mb-2">
                          <p className="text-sm font-medium text-gray-900 mb-1">Recommendations:</p>
                          <p className="text-sm text-gray-700">{inspection.recommendations}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 md:min-w-[150px]">
                      <Link
                        href={`/inspections/${inspection.id}`}
                        className="bg-blue-600 text-white px-3 py-2 rounded-md text-xs font-medium hover:bg-blue-700 transition-colors text-center"
                      >
                        View Details
                      </Link>
                      <Link
                        href={`/inspections/${inspection.id}/edit`}
                        className="bg-gray-100 text-gray-700 px-3 py-2 rounded-md text-xs font-medium hover:bg-gray-200 transition-colors text-center"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(inspection.id)}
                        className="bg-red-600 text-white px-3 py-2 rounded-md text-xs font-medium hover:bg-red-700 transition-colors"
                      >
                        Delete
                      </button>
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

