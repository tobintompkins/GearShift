'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { MaintenanceInterval, MaintenanceIntervalType, Vehicle } from '@/lib/types';
import { format } from 'date-fns';

const intervalTypeLabels: Record<MaintenanceIntervalType, string> = {
  'oil-change': '🛢️ Oil Change',
  'transmission': '⚙️ Transmission Service',
  'coolant': '🌡️ Coolant Flush',
  'brake-fluid': '🛑 Brake Fluid Service',
  'differential': '🔧 Differential Service',
};

export default function EditMaintenanceIntervalPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [interval, setInterval] = useState<MaintenanceInterval | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  const [formData, setFormData] = useState({
    intervalMileage: '',
    intervalMonths: '',
    lastServiceDate: '',
    lastServiceMileage: '',
    notes: '',
    isActive: true,
  });

  useEffect(() => {
    if (id) {
      fetchInterval();
      fetchVehicles();
    }
  }, [id]);

  const fetchInterval = async () => {
    try {
      setFetching(true);
      const response = await fetch(`/api/maintenance-intervals/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch maintenance interval');
      }
      const data = await response.json();
      setInterval(data);
      setFormData({
        intervalMileage: data.intervalMileage?.toString() || '',
        intervalMonths: data.intervalMonths?.toString() || '',
        lastServiceDate: data.lastServiceDate ? format(new Date(data.lastServiceDate), 'yyyy-MM-dd') : '',
        lastServiceMileage: data.lastServiceMileage?.toString() || '',
        notes: data.notes || '',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!formData.intervalMileage && !formData.intervalMonths) {
      setError('At least one interval (mileage or months) is required');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/maintenance-intervals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          intervalMileage: formData.intervalMileage ? Number(formData.intervalMileage) : null,
          intervalMonths: formData.intervalMonths ? Number(formData.intervalMonths) : null,
          lastServiceDate: formData.lastServiceDate || null,
          lastServiceMileage: formData.lastServiceMileage ? Number(formData.lastServiceMileage) : null,
          notes: formData.notes || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update maintenance interval');
      }

      router.push('/maintenance-intervals');
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
            <p className="mt-4 text-gray-600">Loading maintenance interval...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !interval) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error || 'Maintenance interval not found'}
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
            Edit Maintenance Interval
          </h1>
          <p className="text-sm md:text-base text-gray-600">
            {interval.vehicle?.year} {interval.vehicle?.make} {interval.vehicle?.model} - {intervalTypeLabels[interval.intervalType]}
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-4 md:p-6 space-y-6">
          {/* Interval Settings */}
          <div className="border-t border-gray-200 pt-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Interval Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Interval Mileage (miles)
                </label>
                <input
                  type="number"
                  value={formData.intervalMileage}
                  onChange={(e) => setFormData({ ...formData, intervalMileage: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Interval Months
                </label>
                <input
                  type="number"
                  value={formData.intervalMonths}
                  onChange={(e) => setFormData({ ...formData, intervalMonths: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Last Service */}
          <div className="border-t border-gray-200 pt-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Last Service</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Service Date
                </label>
                <input
                  type="date"
                  value={formData.lastServiceDate}
                  onChange={(e) => setFormData({ ...formData, lastServiceDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Service Mileage
                </label>
                <input
                  type="number"
                  value={formData.lastServiceMileage}
                  onChange={(e) => setFormData({ ...formData, lastServiceMileage: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Next Due (Read-only) */}
          {(interval.nextDueDate || interval.nextDueMileage) && (
            <div className="bg-blue-50 rounded-md p-4 border border-blue-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Next Due (Auto-Calculated)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                {interval.nextDueDate && (
                  <div>
                    <span className="font-medium text-gray-700">Next Due Date:</span>{' '}
                    <span className="text-gray-900">
                      {format(new Date(interval.nextDueDate), 'MMM d, yyyy')}
                    </span>
                  </div>
                )}
                {interval.nextDueMileage && (
                  <div>
                    <span className="font-medium text-gray-700">Next Due Mileage:</span>{' '}
                    <span className="text-gray-900">
                      {interval.nextDueMileage.toLocaleString()} miles
                    </span>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-600 mt-2">
                This will be recalculated automatically when you save changes.
              </p>
            </div>
          )}

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
              {loading ? 'Updating...' : 'Update Maintenance Interval'}
            </button>
            <Link
              href="/maintenance-intervals"
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

