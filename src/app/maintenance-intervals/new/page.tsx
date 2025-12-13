'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { Vehicle, MaintenanceIntervalType } from '@/lib/types';

const intervalTypeLabels: Record<MaintenanceIntervalType, string> = {
  'oil-change': '🛢️ Oil Change',
  'transmission': '⚙️ Transmission Service',
  'coolant': '🌡️ Coolant Flush',
  'brake-fluid': '🛑 Brake Fluid Service',
  'differential': '🔧 Differential Service',
};

const defaultIntervals: Record<MaintenanceIntervalType, { mileage: number; months: number }> = {
  'oil-change': { mileage: 3000, months: 3 },
  'transmission': { mileage: 30000, months: 24 },
  'coolant': { mileage: 30000, months: 24 },
  'brake-fluid': { mileage: 20000, months: 24 },
  'differential': { mileage: 30000, months: 24 },
};

export default function NewMaintenanceIntervalPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  const [formData, setFormData] = useState({
    vehicleId: '',
    intervalType: 'oil-change' as MaintenanceIntervalType,
    intervalMileage: '',
    intervalMonths: '',
    lastServiceDate: '',
    lastServiceMileage: '',
    notes: '',
    isActive: true,
  });

  useEffect(() => {
    fetchVehicles();
  }, []);

  useEffect(() => {
    // Auto-fill default intervals when type changes
    if (formData.intervalType && defaultIntervals[formData.intervalType]) {
      const defaults = defaultIntervals[formData.intervalType];
      if (!formData.intervalMileage) {
        setFormData((prev) => ({ ...prev, intervalMileage: defaults.mileage.toString() }));
      }
      if (!formData.intervalMonths) {
        setFormData((prev) => ({ ...prev, intervalMonths: defaults.months.toString() }));
      }
    }
  }, [formData.intervalType]);

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

    if (!formData.vehicleId || !formData.intervalType) {
      setError('Vehicle and interval type are required');
      setLoading(false);
      return;
    }

    if (!formData.intervalMileage && !formData.intervalMonths) {
      setError('At least one interval (mileage or months) is required');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/maintenance-intervals', {
        method: 'POST',
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
        throw new Error(errorData.error || 'Failed to create maintenance interval');
      }

      router.push('/maintenance-intervals');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const selectedVehicle = vehicles.find((v) => v.id === formData.vehicleId);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-4 md:py-8 max-w-4xl">
        <div className="mb-4 md:mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            New Maintenance Interval
          </h1>
          <p className="text-sm md:text-base text-gray-600">
            Set up a maintenance interval tracker for a vehicle
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-4 md:p-6 space-y-6">
          {/* Vehicle & Interval Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vehicle *
              </label>
              <select
                value={formData.vehicleId}
                onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
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
              {selectedVehicle && selectedVehicle.mileage && (
                <p className="text-xs text-gray-500 mt-1">
                  Current mileage: {selectedVehicle.mileage.toLocaleString()} miles
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Interval Type *
              </label>
              <select
                value={formData.intervalType}
                onChange={(e) => setFormData({ ...formData, intervalType: e.target.value as MaintenanceIntervalType })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(intervalTypeLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>

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
                  placeholder="e.g., 3000, 5000, 10000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Leave blank if using time-based only</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Interval Months
                </label>
                <input
                  type="number"
                  value={formData.intervalMonths}
                  onChange={(e) => setFormData({ ...formData, intervalMonths: e.target.value })}
                  placeholder="e.g., 3, 6, 12"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Leave blank if using mileage-based only</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              <strong>Note:</strong> At least one interval (mileage or months) is required. Both can be set for "whichever comes first" tracking.
            </p>
          </div>

          {/* Last Service (Optional) */}
          <div className="border-t border-gray-200 pt-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Last Service (Optional)</h2>
            <p className="text-sm text-gray-600 mb-4">
              If you know when the last service was performed, enter it here. Otherwise, leave blank and mark as complete after the first service.
            </p>
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
                  placeholder={selectedVehicle?.mileage?.toString() || 'Enter mileage'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
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
              placeholder="Additional notes about this maintenance interval..."
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
              {loading ? 'Creating...' : 'Create Maintenance Interval'}
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

