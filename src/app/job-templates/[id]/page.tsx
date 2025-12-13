'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { JobTemplate, JobTemplateFormData } from '@/lib/types';

export default function JobTemplateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [template, setTemplate] = useState<JobTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [duration, setDuration] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [description, setDescription] = useState('');
  const [parts, setParts] = useState('');
  const [notes, setNotes] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchTemplate(params.id as string);
    }
  }, [params.id]);

  useEffect(() => {
    if (template) {
      setName(template.name);
      setServiceType(template.serviceType);
      setDuration(template.duration?.toString() || '');
      setPrice(template.price?.toString() || '');
      setDescription(template.description || '');
      setParts(template.parts || '');
      setNotes(template.notes || '');
      setIsActive(template.isActive);
    }
  }, [template]);

  const fetchTemplate = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/job-templates/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch template');
      }
      const data = await response.json();
      setTemplate(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!name || !serviceType) {
        setError('Name and service type are required');
        return;
      }

      const response = await fetch(`/api/job-templates/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          serviceType,
          duration: duration ? parseInt(duration) : undefined,
          price: price ? parseFloat(price) : undefined,
          description: description || undefined,
          parts: parts || undefined,
          notes: notes || undefined,
          isActive,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update template');
      }

      const updated = await response.json();
      setTemplate(updated);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const response = await fetch(`/api/job-templates/${params.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete template');
      router.push('/job-templates');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleUseTemplate = () => {
    if (!template) return;
    const params = new URLSearchParams();
    params.append('templateId', template.id);
    window.location.href = `/jobs/new?${params.toString()}`;
  };

  if (loading && !template) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading template...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <p className="text-red-600 mb-4">{error || 'Template not found'}</p>
            <Link
              href="/job-templates"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Back to Job Templates
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-4 md:py-8 max-w-3xl">
        <div className="mb-4 md:mb-6">
          <Link
            href="/job-templates"
            className="text-blue-600 hover:text-blue-800 mb-2 inline-block text-sm"
          >
            ← Back to Job Templates
          </Link>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                {template.name}
              </h1>
              {!template.isActive && (
                <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                  Inactive
                </span>
              )}
            </div>
            <div className="flex gap-2">
              {!isEditing && (
                <>
                  <button
                    onClick={handleUseTemplate}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm font-medium"
                  >
                    Use Template
                  </button>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 text-sm font-medium"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {isEditing ? (
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Template Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service Type *
              </label>
              <input
                type="text"
                required
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Default Duration (minutes)
                </label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Default Price
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Common Parts Needed
              </label>
              <input
                type="text"
                value={parts}
                onChange={(e) => setParts(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Notes
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Active</span>
            </label>

            <div className="flex gap-4">
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 font-medium disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  fetchTemplate(params.id as string);
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Template Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Service Type:</span>
                  <p className="text-gray-900">{template.serviceType}</p>
                </div>
                {template.duration && (
                  <div>
                    <span className="font-medium text-gray-700">Duration:</span>
                    <p className="text-gray-900">{template.duration} minutes</p>
                  </div>
                )}
                {template.price && (
                  <div>
                    <span className="font-medium text-gray-700">Default Price:</span>
                    <p className="text-gray-900">${template.price.toFixed(2)}</p>
                  </div>
                )}
                <div>
                  <span className="font-medium text-gray-700">Status:</span>
                  <p className="text-gray-900">{template.isActive ? 'Active' : 'Inactive'}</p>
                </div>
              </div>
            </div>

            {template.description && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Description</h2>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{template.description}</p>
              </div>
            )}

            {template.parts && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Common Parts Needed</h2>
                <p className="text-sm text-gray-700">{template.parts}</p>
              </div>
            )}

            {template.notes && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Notes</h2>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{template.notes}</p>
              </div>
            )}

            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={handleUseTemplate}
                className="w-full bg-green-600 text-white py-3 px-6 rounded-md hover:bg-green-700 font-medium"
              >
                Use This Template to Create a Job
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

