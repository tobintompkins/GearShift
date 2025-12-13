'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Inspection checklist error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong!</h2>
          <p className="text-gray-600 mb-6">{error.message || 'An error occurred while loading inspection checklists'}</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={reset}
              className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors"
            >
              Try again
            </button>
            <Link
              href="/inspections"
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md font-medium hover:bg-gray-400 transition-colors"
            >
              Back to Inspections
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

