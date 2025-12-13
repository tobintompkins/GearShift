'use client';

import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Payroll Error</h2>
        <p className="text-gray-600 mb-2">{error.message || 'An error occurred'}</p>
        {error.digest && (
          <p className="text-xs text-gray-500 mb-6">Error ID: {error.digest}</p>
        )}
        <div className="flex flex-col gap-3">
          <button
            onClick={reset}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Try again
          </button>
          <Link
            href="/payroll"
            className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400"
          >
            Go to Payroll
          </Link>
          <Link
            href="/dashboard"
            className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

