'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { TorqueSpec } from '@/lib/types';

interface TorqueSpecsDisplayProps {
  jobId: string;
}

export default function TorqueSpecsDisplay({ jobId }: TorqueSpecsDisplayProps) {
  const [torqueSpecs, setTorqueSpecs] = useState<TorqueSpec[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (jobId) {
      fetchTorqueSpecs();
    }
  }, [jobId]);

  const fetchTorqueSpecs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/torque-specs/by-job?jobId=${jobId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch torque specs');
      }
      const data = await response.json();
      setTorqueSpecs(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-sm text-gray-600">
        <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
        Loading torque specs...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-red-600">
        Error loading torque specs: {error}
      </div>
    );
  }

  if (torqueSpecs.length === 0) {
    return (
      <div className="text-sm text-gray-600">
        <p>No torque specs found for this job.</p>
        <Link href="/torque-specs/new" className="text-blue-600 hover:text-blue-800 text-xs mt-1 inline-block">
          Add torque spec →
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base md:text-lg font-semibold text-gray-900">Torque Specifications</h3>
        <Link
          href="/torque-specs"
          className="text-xs text-blue-600 hover:text-blue-800"
        >
          View All →
        </Link>
      </div>
      <div className="space-y-2">
        {torqueSpecs.map((spec) => (
          <div
            key={spec.id}
            className="bg-gray-50 rounded-md p-3 border border-gray-200"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-900">{spec.componentName}</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                    {spec.torqueValue} {spec.unit}
                  </span>
                  {spec.sequence && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                      Seq: {spec.sequence}
                    </span>
                  )}
                </div>
                {spec.notes && (
                  <p className="text-xs text-gray-600 mt-1">{spec.notes}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

