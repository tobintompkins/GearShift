'use client';

import { useState, FormEvent } from 'react';
import { VehicleFormData, Vehicle } from '@/lib/types';

interface VehicleFormProps {
  initialData?: Vehicle;
  customerId: string;
  onSubmit: (data: VehicleFormData) => Promise<void>;
  onCancel?: () => void;
}

export default function VehicleForm({ initialData, customerId, onSubmit, onCancel }: VehicleFormProps) {
  const [formData, setFormData] = useState<VehicleFormData>({
    make: initialData?.make || '',
    model: initialData?.model || '',
    year: initialData?.year || undefined,
    engine: initialData?.engine || undefined,
    mileage: initialData?.mileage || undefined,
    licensePlate: initialData?.licensePlate || undefined,
    vin: initialData?.vin || undefined,
    color: initialData?.color || undefined,
    notes: initialData?.notes || undefined,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6 p-4 md:p-6 bg-white rounded-lg shadow-md">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Year
          </label>
          <input
            type="text"
            value={formData.year || ''}
            onChange={(e) => setFormData({ ...formData, year: e.target.value || undefined })}
            placeholder="e.g., 2020"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Make *
          </label>
          <input
            type="text"
            required
            value={formData.make}
            onChange={(e) => setFormData({ ...formData, make: e.target.value })}
            placeholder="e.g., Toyota, Ford"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Model *
          </label>
          <input
            type="text"
            required
            value={formData.model}
            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
            placeholder="e.g., Camry, F-150"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Engine
          </label>
          <input
            type="text"
            value={formData.engine || ''}
            onChange={(e) => setFormData({ ...formData, engine: e.target.value || undefined })}
            placeholder="e.g., 3.5L V6, 2.0L Turbo"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mileage
          </label>
          <input
            type="number"
            min="0"
            value={formData.mileage || ''}
            onChange={(e) => setFormData({ ...formData, mileage: e.target.value ? parseInt(e.target.value) : undefined })}
            placeholder="Current mileage in miles"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            License Plate
          </label>
          <input
            type="text"
            value={formData.licensePlate || ''}
            onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value || undefined })}
            placeholder="e.g., ABC-1234"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            VIN (Vehicle Identification Number)
          </label>
          <input
            type="text"
            value={formData.vin || ''}
            onChange={(e) => setFormData({ ...formData, vin: e.target.value || undefined })}
            placeholder="17-character VIN"
            maxLength={17}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Color
          </label>
          <input
            type="text"
            value={formData.color || ''}
            onChange={(e) => setFormData({ ...formData, color: e.target.value || undefined })}
            placeholder="e.g., Red, Blue, Silver"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            value={formData.notes || ''}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value || undefined })}
            rows={3}
            placeholder="Additional notes about this vehicle..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Saving...' : initialData ? 'Update Vehicle' : 'Add Vehicle'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}


