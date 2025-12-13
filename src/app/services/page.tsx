'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { ServiceTemplate, ServiceTemplateFormData } from '@/lib/types';
import { format } from 'date-fns';

export default function ServicesPage() {
  const [services, setServices] = useState<ServiceTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<ServiceTemplate | null>(null);
  const [filterActive, setFilterActive] = useState<string>('all'); // 'all', 'active', 'inactive'

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/services');
      if (!response.ok) {
        throw new Error('Failed to fetch services');
      }
      const data = await response.json();
      setServices(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const filteredServices = services.filter((service) => {
    if (filterActive === 'active') return service.isActive;
    if (filterActive === 'inactive') return !service.isActive;
    return true;
  });

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service template?')) {
      return;
    }

    try {
      const response = await fetch(`/api/services/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete service');
      }

      fetchServices();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleFormSubmit = async (data: ServiceTemplateFormData) => {
    try {
      setError(null);
      const url = editingService
        ? `/api/services/${editingService.id}`
        : '/api/services';
      const method = editingService ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to save service: ${response.status} ${response.statusText}`);
      }

      setShowForm(false);
      setEditingService(null);
      fetchServices();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      console.error('Error saving service:', err);
    }
  };

  if (showForm) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="container mx-auto px-4 py-4 md:py-8 max-w-4xl">
          <div className="mb-4 md:mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              {editingService ? 'Edit Service Template' : 'Add Service Template'}
            </h1>
            <p className="text-sm md:text-base text-gray-600">
              {editingService
                ? 'Update service template information'
                : 'Create a reusable service template for quick job creation'}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            {error && (
              <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const descriptionValue = formData.get('description')?.toString().trim();
                handleFormSubmit({
                  name: formData.get('name')?.toString().trim() || '',
                  description: descriptionValue && descriptionValue.length > 0 ? descriptionValue : undefined,
                  duration: formData.get('duration')?.toString() ? parseInt(formData.get('duration')!.toString()) : undefined,
                  price: formData.get('price')?.toString() ? parseFloat(formData.get('price')!.toString()) : undefined,
                  isActive: formData.get('isActive') === 'on',
                });
              }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Service Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    defaultValue={editingService?.name || ''}
                    placeholder="e.g., Oil Change, Brake Repair"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    rows={3}
                    defaultValue={editingService?.description || ''}
                    placeholder="Optional description of the service..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Default Duration (minutes)
                  </label>
                  <input
                    type="number"
                    name="duration"
                    min="0"
                    defaultValue={editingService?.duration || ''}
                    placeholder="e.g., 30, 60"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price ($)
                  </label>
                  <input
                    type="number"
                    name="price"
                    min="0"
                    step="0.01"
                    defaultValue={editingService?.price || ''}
                    placeholder="e.g., 49.99"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="isActive"
                      defaultChecked={editingService?.isActive !== false}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Active</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                >
                  {editingService ? 'Update Service' : 'Add Service'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingService(null);
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-4 md:py-8">
        <div className="mb-4 md:mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Service Templates
            </h1>
            <p className="text-sm md:text-base text-gray-600">
              Create and manage reusable service templates for quick job booking
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/services/menu"
              className="w-full sm:w-auto bg-green-600 text-white px-4 py-2 rounded-md font-medium hover:bg-green-700 transition-colors text-sm md:text-base text-center"
            >
              View Service Menu
            </Link>
            <button
              onClick={() => {
                setEditingService(null);
                setShowForm(true);
              }}
              className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors text-sm md:text-base"
            >
              + Add Service
            </button>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setFilterActive('all')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                filterActive === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterActive('active')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                filterActive === 'active'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilterActive('inactive')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                filterActive === 'inactive'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Inactive
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading services...</p>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <p className="text-gray-600 mb-4">
              {filterActive === 'all'
                ? 'No service templates yet.'
                : filterActive === 'active'
                ? 'No active services.'
                : 'No inactive services.'}
            </p>
            <button
              onClick={() => {
                setEditingService(null);
                setShowForm(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors"
            >
              Create Your First Service Template
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <div
                key={service.id}
                className={`bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow ${
                  !service.isActive ? 'opacity-75' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {service.name}
                    </h3>
                    <span
                      className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium ${
                        service.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {service.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-700 mb-4">
                  {service.description && (
                    <p className="text-gray-600">{service.description}</p>
                  )}
                  <div className="flex gap-4">
                    {service.duration && (
                      <p>
                        <strong>Duration:</strong> {service.duration} min
                      </p>
                    )}
                    {service.price && (
                      <p>
                        <strong>Price:</strong> ${service.price.toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingService(service);
                      setShowForm(true);
                    }}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors text-sm font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(service.id)}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors text-sm font-medium"
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


