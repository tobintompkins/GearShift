'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';
import JobForm from '@/components/JobForm';
import Navigation from '@/components/Navigation';
import { JobFormData } from '@/lib/types';

function NewJobForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerId = searchParams?.get('customerId') || undefined;
  const vehicleId = searchParams?.get('vehicleId') || undefined;
  const templateId = searchParams?.get('templateId') || undefined;
  const templateServiceType = searchParams?.get('serviceType') || undefined;
  const templateDuration = searchParams?.get('duration') || undefined;
  const templatePrice = searchParams?.get('price') || undefined;
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: JobFormData) => {
    try {
      setError(null);
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create job');
      }

      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-4 md:py-8 max-w-4xl">
        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
        <JobForm 
          onSubmit={handleSubmit} 
          onCancel={() => router.back()}
          customerId={customerId}
          initialData={{
            ...(vehicleId ? { vehicleId: vehicleId } : {}),
            ...(templateServiceType ? { serviceType: templateServiceType } : {}),
            ...(templateDuration ? { duration: parseInt(templateDuration) } : {}),
            ...(templatePrice ? { price: parseFloat(templatePrice) } : {}),
          } as any}
          templateId={templateId}
        />
      </main>
    </div>
  );
}

export default function NewJobPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <NewJobForm />
    </Suspense>
  );
}



