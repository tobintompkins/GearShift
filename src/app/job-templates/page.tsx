'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { JobTemplate } from '@/lib/types';

export default function JobTemplatesPage() {
  const [templates, setTemplates] = useState<JobTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showActiveOnly, setShowActiveOnly] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, [showActiveOnly]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (showActiveOnly) {
        params.append('activeOnly', 'true');
      }
      
      const response = await fetch(`/api/job-templates?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch job templates');
      }
      const data = await response.json();
      setTemplates(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      const response = await fetch(`/api/job-templates/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete template');
      }

      fetchTemplates();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleToggleActive = async (template: JobTemplate) => {
    try {
      const response = await fetch(`/api/job-templates/${template.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...template,
          isActive: !template.isActive,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update template');
      }

      fetchTemplates();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleUseTemplate = (template: JobTemplate) => {
    // Build URL with template data
    const params = new URLSearchParams();
    params.append('templateId', template.id);
    params.append('serviceType', template.serviceType);
    if (template.duration) {
      params.append('duration', template.duration.toString());
    }
    if (template.price) {
      params.append('price', template.price.toString());
    }
    
    // Navigate to new job page with template data
    window.location.href = `/jobs/new?${params.toString()}`;
  };

  const stats = {
    total: templates.length,
    active: templates.filter(t => t.isActive).length,
    inactive: templates.filter(t => !t.isActive).length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-4 md:py-8">
        <div className="mb-4 md:mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Job Templates
            </h1>
            <p className="text-sm md:text-base text-gray-600">
              Create reusable job templates to quickly schedule common services
            </p>
          </div>
          <Link
            href="/job-templates/new"
            className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors text-sm md:text-base text-center"
          >
            + New Template
          </Link>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">Total Templates</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold text-green-600">{stats.active}</div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">Active</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold text-gray-600">{stats.inactive}</div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">Inactive</div>
          </div>
        </div>

        {/* Filter */}
        <div className="mb-6">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showActiveOnly}
              onChange={(e) => setShowActiveOnly(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Show active templates only</span>
          </label>
        </div>

        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading templates...</p>
          </div>
        ) : templates.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <p className="text-gray-600 mb-4">No job templates found.</p>
            <Link
              href="/job-templates/new"
              className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors"
            >
              Create Your First Template
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <div
                key={template.id}
                className={`bg-white rounded-lg shadow-md p-4 md:p-6 ${
                  !template.isActive ? 'opacity-60' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg md:text-xl font-semibold text-gray-900">
                      {template.name}
                    </h3>
                    {!template.isActive && (
                      <span className="inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Inactive
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Service Type:</span>
                    <p className="text-sm text-gray-900">{template.serviceType}</p>
                  </div>
                  {template.duration && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Duration:</span>
                      <p className="text-sm text-gray-900">{template.duration} minutes</p>
                    </div>
                  )}
                  {template.price && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Default Price:</span>
                      <p className="text-sm text-gray-900">${template.price.toFixed(2)}</p>
                    </div>
                  )}
                  {template.description && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Description:</span>
                      <p className="text-sm text-gray-600">{template.description}</p>
                    </div>
                  )}
                  {template.parts && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Common Parts:</span>
                      <p className="text-sm text-gray-600">{template.parts}</p>
                    </div>
                  )}
                  {template.notes && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Notes:</span>
                      <p className="text-sm text-gray-600">{template.notes}</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleUseTemplate(template)}
                    className="flex-1 bg-green-600 text-white px-3 py-2 rounded-md text-xs font-medium hover:bg-green-700 transition-colors"
                  >
                    Use Template
                  </button>
                  <Link
                    href={`/job-templates/${template.id}`}
                    className="bg-blue-100 text-blue-700 px-3 py-2 rounded-md text-xs font-medium hover:bg-blue-200 transition-colors"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleToggleActive(template)}
                    className={`px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                      template.isActive
                        ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {template.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="bg-red-100 text-red-700 px-3 py-2 rounded-md text-xs font-medium hover:bg-red-200 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}


