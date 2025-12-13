'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { InspectionChecklist, InspectionItemStatus } from '@/lib/types';
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

export default function InspectionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [inspection, setInspection] = useState<InspectionChecklist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchInspection();
    }
  }, [id]);

  const fetchInspection = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/inspections/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch inspection');
      }
      const data = await response.json();
      setInspection(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
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

      router.push('/inspections');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  if (loading) {
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

  if (error || !inspection) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error || 'Inspection not found'}
          </div>
        </main>
      </div>
    );
  }

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
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-4 md:py-8 max-w-6xl">
        <div className="mb-4 md:mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Inspection Checklist
            </h1>
            <p className="text-sm md:text-base text-gray-600">
              {inspection.vehicle?.year} {inspection.vehicle?.make} {inspection.vehicle?.model}
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/inspections/${id}/edit`}
              className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors text-sm"
            >
              Edit
            </Link>
            <button
              onClick={handleDelete}
              className="bg-red-600 text-white px-4 py-2 rounded-md font-medium hover:bg-red-700 transition-colors text-sm"
            >
              Delete
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 space-y-6">
          {/* Header Information */}
          <div className="border-b border-gray-200 pb-4">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {inspection.overallStatus && (
                <span
                  className={`px-4 py-2 rounded-full text-sm font-medium border ${
                    statusColors[inspection.overallStatus]
                  }`}
                >
                  Overall: {statusLabels[inspection.overallStatus]}
                </span>
              )}
              {inspection.isComplete && (
                <span className="px-4 py-2 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-300">
                  ✓ Complete
                </span>
              )}
              {immediateRepairCount > 0 && (
                <span className="px-4 py-2 rounded-full text-sm font-medium bg-red-100 text-red-800 border border-red-300">
                  ❌ {immediateRepairCount} Immediate Repair{immediateRepairCount !== 1 ? 's' : ''}
                </span>
              )}
              {needsAttentionCount > 0 && (
                <span className="px-4 py-2 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 border border-yellow-300">
                  ⚠️ {needsAttentionCount} Needs Attention
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Inspection Date:</span>{' '}
                {format(new Date(inspection.inspectionDate), 'MMM d, yyyy')}
              </div>
              {inspection.mileage && (
                <div>
                  <span className="font-medium text-gray-700">Mileage:</span>{' '}
                  {inspection.mileage.toLocaleString()} miles
                </div>
              )}
              {inspection.employee && (
                <div>
                  <span className="font-medium text-gray-700">Inspector:</span>{' '}
                  {inspection.employee.firstName} {inspection.employee.lastName}
                </div>
              )}
              {inspection.job && (
                <div>
                  <span className="font-medium text-gray-700">Related Job:</span>{' '}
                  <Link
                    href={`/jobs/${inspection.job.id}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {inspection.job.serviceType}
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Vehicle Information */}
          {inspection.vehicle && (
            <div className="border-b border-gray-200 pb-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Vehicle Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Vehicle:</span>{' '}
                  <Link
                    href={`/vehicles/${inspection.vehicle.id}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {inspection.vehicle.year} {inspection.vehicle.make} {inspection.vehicle.model}
                  </Link>
                </div>
                {inspection.vehicle.vin && (
                  <div>
                    <span className="font-medium text-gray-700">VIN:</span> {inspection.vehicle.vin}
                  </div>
                )}
                {inspection.vehicle.licensePlate && (
                  <div>
                    <span className="font-medium text-gray-700">License Plate:</span> {inspection.vehicle.licensePlate}
                  </div>
                )}
                {inspection.vehicle.customer && (
                  <div>
                    <span className="font-medium text-gray-700">Customer:</span>{' '}
                    <Link
                      href={`/customers/${inspection.vehicle.customer.id}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {inspection.vehicle.customer.firstName} {inspection.vehicle.customer.lastName}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Inspection Items */}
          <div className="border-b border-gray-200 pb-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Inspection Items</h2>
            <div className="space-y-4">
              {inspectionCategories.map((category) => {
                const status = inspection[category.statusKey] as InspectionItemStatus | null;
                const notes = inspection[category.notesKey] as string | null;

                if (!status) return null;

                return (
                  <div
                    key={category.key}
                    className={`rounded-lg p-4 border-2 ${
                      status === 'immediate-repair'
                        ? 'bg-red-50 border-red-300'
                        : status === 'needs-attention'
                        ? 'bg-yellow-50 border-yellow-300'
                        : 'bg-green-50 border-green-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{category.label}</h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${
                          statusColors[status]
                        }`}
                      >
                        {statusLabels[status]}
                      </span>
                    </div>
                    {notes && (
                      <p className="text-sm text-gray-700 mt-2">{notes}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Overall Assessment */}
          {(inspection.overallNotes || inspection.recommendations) && (
            <div className="border-b border-gray-200 pb-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Overall Assessment</h2>
              {inspection.overallNotes && (
                <div className="mb-4">
                  <h3 className="font-medium text-gray-900 mb-2">Overall Notes</h3>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-md p-3">{inspection.overallNotes}</p>
                </div>
              )}
              {inspection.recommendations && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Recommendations</h3>
                  <p className="text-sm text-gray-700 bg-yellow-50 rounded-md p-3 border border-yellow-200">
                    {inspection.recommendations}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Signatures */}
          {(inspection.customerSignature || inspection.inspectorSignature) && (
            <div className="border-b border-gray-200 pb-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Signatures</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {inspection.inspectorSignature && (
                  <div>
                    <h3 className="font-medium text-gray-700 mb-2">Inspector Signature</h3>
                    <div className="border border-gray-300 rounded-md p-4 h-24 bg-gray-50">
                      {inspection.inspectorSignature}
                    </div>
                  </div>
                )}
                {inspection.customerSignature && (
                  <div>
                    <h3 className="font-medium text-gray-700 mb-2">Customer Signature</h3>
                    <div className="border border-gray-300 rounded-md p-4 h-24 bg-gray-50">
                      {inspection.customerSignature}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <Link
              href={`/inspections/${id}/edit`}
              className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors"
            >
              Edit Inspection
            </Link>
            <Link
              href="/inspections"
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 font-medium"
            >
              Back to List
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

