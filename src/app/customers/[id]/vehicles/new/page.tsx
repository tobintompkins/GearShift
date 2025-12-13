'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState } from 'react';
import Navigation from '@/components/Navigation';
import VehicleForm from '@/components/VehicleForm';
import { VehicleFormData } from '@/lib/types';

export default function NewVehiclePage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params.id as string;
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: VehicleFormData) => {
    try {
      setError(null);
      const response = await fetch(`/api/customers/${customerId}/vehicles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create vehicle');
      }

      router.push(`/customers/${customerId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-4 md:py-8 max-w-4xl">
        <div className="mb-4 md:mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Add Vehicle</h1>
          <p className="text-sm md:text-base text-gray-600">
            Add a new vehicle to the customer's profile
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <VehicleForm
          customerId={customerId}
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
        />
      </main>
    </div>
  );
}


