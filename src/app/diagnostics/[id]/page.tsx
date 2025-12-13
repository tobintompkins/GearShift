'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { DiagnosticJob } from '@/lib/types';
import { format } from 'date-fns';

export default function DiagnosticJobDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [diagnosticJob, setDiagnosticJob] = useState<DiagnosticJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchDiagnosticJob();
    }
  }, [id]);

  const fetchDiagnosticJob = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/diagnostic-jobs/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch diagnostic job');
      }
      const data = await response.json();
      setDiagnosticJob(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
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

      router.push('/diagnostics');
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

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    'in-progress': 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-4 md:py-8 max-w-4xl">
        <div className="mb-4 md:mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Diagnostic Job Details
            </h1>
            <p className="text-sm md:text-base text-gray-600">
              {diagnosticJob.customer?.firstName} {diagnosticJob.customer?.lastName} - {diagnosticJob.vehicle?.year} {diagnosticJob.vehicle?.make} {diagnosticJob.vehicle?.model}
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/diagnostics/${id}/edit`}
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
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[diagnosticJob.status]}`}>
              {diagnosticJob.status.charAt(0).toUpperCase() + diagnosticJob.status.slice(1).replace('-', ' ')}
            </span>
            {diagnosticJob.troubleCodes && (
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 border border-red-300">
                {diagnosticJob.troubleCodes.split(',').length} Trouble Code{diagnosticJob.troubleCodes.split(',').length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Customer & Vehicle Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Customer Information</h2>
              <div className="space-y-2 text-sm text-gray-700">
                <p>
                  <strong>Name:</strong>{' '}
                  <Link href={`/customers/${diagnosticJob.customerId}`} className="text-blue-600 hover:text-blue-800">
                    {diagnosticJob.customer?.firstName} {diagnosticJob.customer?.lastName}
                  </Link>
                </p>
                {diagnosticJob.customer?.phone && (
                  <p><strong>Phone:</strong> {diagnosticJob.customer.phone}</p>
                )}
                {diagnosticJob.customer?.email && (
                  <p><strong>Email:</strong> {diagnosticJob.customer.email}</p>
                )}
              </div>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Vehicle Information</h2>
              <div className="space-y-2 text-sm text-gray-700">
                <p>
                  <strong>Vehicle:</strong>{' '}
                  <Link href={`/vehicles/${diagnosticJob.vehicleId}`} className="text-blue-600 hover:text-blue-800">
                    {diagnosticJob.vehicle?.year} {diagnosticJob.vehicle?.make} {diagnosticJob.vehicle?.model}
                  </Link>
                </p>
                {diagnosticJob.vehicle?.mileage && (
                  <p><strong>Mileage:</strong> {diagnosticJob.vehicle.mileage.toLocaleString()} miles</p>
                )}
                {diagnosticJob.vehicle?.vin && (
                  <p><strong>VIN:</strong> {diagnosticJob.vehicle.vin}</p>
                )}
                {diagnosticJob.vehicle?.licensePlate && (
                  <p><strong>License Plate:</strong> {diagnosticJob.vehicle.licensePlate}</p>
                )}
              </div>
            </div>
          </div>

          {/* Diagnostic Details */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Diagnostic Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
              <div>
                <strong>Date:</strong> {format(new Date(diagnosticJob.diagnosticDate), 'MMM d, yyyy')}
              </div>
              {diagnosticJob.scanToolUsed && (
                <div>
                  <strong>Scan Tool:</strong> {diagnosticJob.scanToolUsed}
                </div>
              )}
              {diagnosticJob.employee && (
                <div>
                  <strong>Technician:</strong> {diagnosticJob.employee.firstName} {diagnosticJob.employee.lastName}
                </div>
              )}
              {diagnosticJob.job && (
                <div>
                  <strong>Related Job:</strong>{' '}
                  <Link href={`/jobs/${diagnosticJob.job.id}`} className="text-blue-600 hover:text-blue-800">
                    {diagnosticJob.job.serviceType}
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Trouble Codes */}
          {diagnosticJob.troubleCodes && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Trouble Codes</h2>
              <div className="flex flex-wrap gap-2">
                {diagnosticJob.troubleCodes.split(',').map((code, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-red-50 text-red-700 rounded text-sm font-mono border border-red-200"
                  >
                    {code.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Freeze Frame Data */}
          {diagnosticJob.freezeFrameData && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Freeze Frame Data</h2>
              <div className="bg-gray-50 rounded-md p-4">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                  {diagnosticJob.freezeFrameData}
                </pre>
              </div>
            </div>
          )}

          {/* Live Data Notes */}
          {diagnosticJob.liveDataNotes && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Live Data Notes</h2>
              <div className="bg-gray-50 rounded-md p-4">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {diagnosticJob.liveDataNotes}
                </p>
              </div>
            </div>
          )}

          {/* Diagnostic Conclusion */}
          {diagnosticJob.diagnosticConclusion && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Diagnostic Conclusion</h2>
              <div className="bg-blue-50 rounded-md p-4 border border-blue-200">
                <p className="text-sm text-gray-900 whitespace-pre-wrap">
                  {diagnosticJob.diagnosticConclusion}
                </p>
              </div>
            </div>
          )}

          {/* Recommended Repairs */}
          {diagnosticJob.recommendedRepairs && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Recommended Repairs</h2>
              <div className="bg-green-50 rounded-md p-4 border border-green-200">
                <p className="text-sm text-gray-900 whitespace-pre-wrap">
                  {diagnosticJob.recommendedRepairs}
                </p>
              </div>
            </div>
          )}

          {/* Additional Notes */}
          {diagnosticJob.notes && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Additional Notes</h2>
              <div className="bg-gray-50 rounded-md p-4">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {diagnosticJob.notes}
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 pt-4 border-t border-gray-200">
            <Link
              href={`/diagnostics/${id}/edit`}
              className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors"
            >
              Edit Diagnostic Job
            </Link>
            <Link
              href="/diagnostics"
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

