'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { VehicleMaintenanceHistory, Vehicle } from '@/lib/types';
import { format } from 'date-fns';

export default function MaintenanceHistoryPage() {
  const [maintenance, setMaintenance] = useState<VehicleMaintenanceHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterVehicle, setFilterVehicle] = useState<string>('all');
  const [filterServiceType, setFilterServiceType] = useState<string>('all');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  const commonServiceTypes = [
    'Oil Change',
    'Brake Service',
    'Tire Rotation',
    'Transmission Service',
    'Battery Replacement',
    'Air Filter Replacement',
    'Coolant Flush',
    'Spark Plug Replacement',
    'Timing Belt',
    'Wheel Alignment',
    'Other',
  ];

  useEffect(() => {
    fetchMaintenance();
    fetchVehicles();
  }, [filterVehicle, filterServiceType]);

  const fetchMaintenance = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (filterVehicle !== 'all') {
        params.append('vehicleId', filterVehicle);
      }
      if (filterServiceType !== 'all') {
        params.append('serviceType', filterServiceType);
      }
      
      const response = await fetch(`/api/maintenance?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch maintenance history');
      }
      const data = await response.json();
      setMaintenance(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      const response = await fetch('/api/vehicles');
      if (response.ok) {
        const data = await response.json();
        setVehicles(data);
      }
    } catch (err) {
      console.error('Error fetching vehicles:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this maintenance record?')) {
      return;
    }

    try {
      const response = await fetch(`/api/maintenance/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete maintenance record');
      }

      fetchMaintenance();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const getServiceTypeIcon = (type: string) => {
    if (type.toLowerCase().includes('oil')) return '🛢️';
    if (type.toLowerCase().includes('brake')) return '🛑';
    if (type.toLowerCase().includes('tire')) return '🛞';
    if (type.toLowerCase().includes('battery')) return '🔋';
    if (type.toLowerCase().includes('transmission')) return '⚙️';
    return '🔧';
  };

  const stats = {
    total: maintenance.length,
    oilChanges: maintenance.filter(m => m.serviceType.toLowerCase().includes('oil')).length,
    brakeServices: maintenance.filter(m => m.serviceType.toLowerCase().includes('brake')).length,
    totalCost: maintenance.reduce((sum, m) => sum + (m.cost || 0), 0),
  };

  // Get unique service types from maintenance records
  const serviceTypes = Array.from(new Set(maintenance.map(m => m.serviceType)));

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-4 md:py-8">
        <div className="mb-4 md:mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Vehicle Maintenance History
            </h1>
            <p className="text-sm md:text-base text-gray-600">
              Track all vehicle maintenance, service records, and recommendations
            </p>
          </div>
          <Link
            href="/maintenance/new"
            className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors text-sm md:text-base text-center"
          >
            + Add Maintenance Record
          </Link>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">Total Records</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold text-yellow-600">{stats.oilChanges}</div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">Oil Changes</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold text-red-600">{stats.brakeServices}</div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">Brake Services</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold text-green-600">
              ${stats.totalCost.toFixed(2)}
            </div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">Total Service Cost</div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Vehicle:</label>
            <select
              value={filterVehicle}
              onChange={(e) => setFilterVehicle(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="all">All Vehicles</option>
              {vehicles.map(vehicle => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.licensePlate ? `(${vehicle.licensePlate})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Service Type:</label>
            <select
              value={filterServiceType}
              onChange={(e) => setFilterServiceType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="all">All Services</option>
              {serviceTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
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
            <p className="mt-4 text-gray-600">Loading maintenance history...</p>
          </div>
        ) : maintenance.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <p className="text-gray-600 mb-4">No maintenance records found.</p>
            <Link
              href="/maintenance/new"
              className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors"
            >
              Add Your First Maintenance Record
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {maintenance.map((record) => {
              const photos = record.photos ? (() => {
                try {
                  return JSON.parse(record.photos);
                } catch {
                  return [];
                }
              })() : [];

              return (
                <div
                  key={record.id}
                  className="bg-white rounded-lg shadow-md p-4 md:p-6"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <h3 className="text-lg md:text-xl font-semibold text-gray-900">
                          {getServiceTypeIcon(record.serviceType)} {record.serviceType}
                        </h3>
                        {record.vehicle && (
                          <Link
                            href={`/vehicles/${record.vehicle.id}`}
                            className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 hover:bg-blue-200"
                          >
                            {record.vehicle.year} {record.vehicle.make} {record.vehicle.model}
                            {record.vehicle.licensePlate && ` (${record.vehicle.licensePlate})`}
                          </Link>
                        )}
                        {record.vehicle?.customer && (
                          <Link
                            href={`/customers/${record.vehicle.customer.id}`}
                            className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 hover:bg-green-200"
                          >
                            {record.vehicle.customer.firstName} {record.vehicle.customer.lastName}
                          </Link>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm text-gray-600 mb-3">
                        <div>
                          <span className="font-medium">Service Date:</span>{' '}
                          {(() => {
                            try {
                              return format(new Date(record.serviceDate), 'MMM d, yyyy');
                            } catch {
                              return 'Invalid date';
                            }
                          })()}
                        </div>
                        <div>
                          <span className="font-medium">Mileage:</span>{' '}
                          <span className="font-semibold text-gray-900">{record.mileage.toLocaleString()} miles</span>
                        </div>
                        {record.cost && (
                          <div>
                            <span className="font-medium">Cost:</span>{' '}
                            <span className="font-semibold text-green-600">${record.cost.toFixed(2)}</span>
                          </div>
                        )}
                        {record.technician && (
                          <div>
                            <span className="font-medium">Technician:</span> {record.technician}
                          </div>
                        )}
                        {record.nextServiceDate && (
                          <div>
                            <span className="font-medium">Next Service:</span>{' '}
                            {(() => {
                              try {
                                return format(new Date(record.nextServiceDate), 'MMM d, yyyy');
                              } catch {
                                return 'Invalid date';
                              }
                            })()}
                          </div>
                        )}
                        {record.nextServiceMileage && (
                          <div>
                            <span className="font-medium">Next Service Mileage:</span>{' '}
                            <span className="font-semibold">{record.nextServiceMileage.toLocaleString()} miles</span>
                          </div>
                        )}
                        {record.job && (
                          <div>
                            <span className="font-medium">Related Job:</span>{' '}
                            <Link
                              href={`/jobs/${record.job.id}`}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              {record.job.serviceType}
                            </Link>
                          </div>
                        )}
                      </div>

                      {record.description && (
                        <div className="mb-3">
                          <span className="font-medium text-gray-700 text-sm">Description:</span>
                          <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{record.description}</p>
                        </div>
                      )}

                      {record.recommendations && (
                        <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                          <span className="font-medium text-yellow-800 text-sm">Recommendations:</span>
                          <p className="text-sm text-yellow-700 mt-1 whitespace-pre-wrap">{record.recommendations}</p>
                        </div>
                      )}

                      {photos.length > 0 && (
                        <div className="mb-3">
                          <span className="font-medium text-gray-700 text-sm mb-2 block">Photos:</span>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {photos.map((photo: string, idx: number) => (
                              <div key={idx} className="relative aspect-square rounded-md overflow-hidden border border-gray-300">
                                <img
                                  src={photo}
                                  alt={`Maintenance photo ${idx + 1}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/placeholder-image.png';
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {record.notes && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Notes:</span> {record.notes}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 md:min-w-[150px]">
                      <Link
                        href={`/maintenance/${record.id}`}
                        className="bg-blue-100 text-blue-700 px-3 py-2 rounded-md text-xs font-medium hover:bg-blue-200 transition-colors text-center"
                      >
                        View/Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(record.id)}
                        className="bg-red-100 text-red-700 px-3 py-2 rounded-md text-xs font-medium hover:bg-red-200 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}


