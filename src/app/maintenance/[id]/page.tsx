'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { VehicleMaintenanceHistory, Vehicle, Job } from '@/lib/types';
import { format } from 'date-fns';

export default function MaintenanceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [maintenance, setMaintenance] = useState<VehicleMaintenanceHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);

  // Form state
  const [vehicleId, setVehicleId] = useState<string>('');
  const [jobId, setJobId] = useState<string>('');
  const [serviceType, setServiceType] = useState<string>('');
  const [serviceDate, setServiceDate] = useState<string>('');
  const [mileage, setMileage] = useState<string>('');
  const [description, setDescription] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoInput, setPhotoInput] = useState('');
  const [cost, setCost] = useState<string>('');
  const [technician, setTechnician] = useState('');
  const [notes, setNotes] = useState('');
  const [nextServiceDate, setNextServiceDate] = useState('');
  const [nextServiceMileage, setNextServiceMileage] = useState<string>('');

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
    if (params.id) {
      fetchMaintenance(params.id as string);
      fetchVehicles();
      fetchJobs();
    }
  }, [params.id]);

  useEffect(() => {
    if (maintenance) {
      setVehicleId(maintenance.vehicleId);
      setJobId(maintenance.jobId || '');
      setServiceType(maintenance.serviceType);
      setServiceDate(format(new Date(maintenance.serviceDate), 'yyyy-MM-dd'));
      setMileage(maintenance.mileage.toString());
      setDescription(maintenance.description || '');
      setRecommendations(maintenance.recommendations || '');
      setPhotos(maintenance.photos ? (() => {
        try {
          return JSON.parse(maintenance.photos);
        } catch {
          return [];
        }
      })() : []);
      setCost(maintenance.cost?.toString() || '');
      setTechnician(maintenance.technician || '');
      setNotes(maintenance.notes || '');
      setNextServiceDate(maintenance.nextServiceDate ? format(new Date(maintenance.nextServiceDate), 'yyyy-MM-dd') : '');
      setNextServiceMileage(maintenance.nextServiceMileage?.toString() || '');
    }
  }, [maintenance]);

  const fetchMaintenance = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/maintenance/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch maintenance record');
      }
      const data = await response.json();
      setMaintenance(data);
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

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/jobs');
      if (response.ok) {
        const data = await response.json();
        setJobs(data);
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
    }
  };

  const handleAddPhoto = () => {
    if (photoInput.trim() && !photos.includes(photoInput.trim())) {
      setPhotos([...photos, photoInput.trim()]);
      setPhotoInput('');
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!serviceType || !serviceDate || !mileage) {
        setError('Service type, date, and mileage are required');
        return;
      }

      const response = await fetch(`/api/maintenance/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId,
          jobId: jobId || undefined,
          serviceType,
          serviceDate,
          mileage: parseInt(mileage),
          description: description || undefined,
          recommendations: recommendations || undefined,
          photos: photos.length > 0 ? photos : undefined,
          cost: cost ? parseFloat(cost) : undefined,
          technician: technician || undefined,
          notes: notes || undefined,
          nextServiceDate: nextServiceDate || undefined,
          nextServiceMileage: nextServiceMileage ? parseInt(nextServiceMileage) : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update maintenance record');
      }

      const updated = await response.json();
      setMaintenance(updated);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this maintenance record?')) return;

    try {
      const response = await fetch(`/api/maintenance/${params.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete maintenance record');
      router.push('/maintenance');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  if (loading && !maintenance) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading maintenance record...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !maintenance) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <p className="text-red-600 mb-4">{error || 'Maintenance record not found'}</p>
            <Link
              href="/maintenance"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Back to Maintenance History
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const getServiceTypeIcon = (type: string) => {
    if (type.toLowerCase().includes('oil')) return '🛢️';
    if (type.toLowerCase().includes('brake')) return '🛑';
    if (type.toLowerCase().includes('tire')) return '🛞';
    if (type.toLowerCase().includes('battery')) return '🔋';
    if (type.toLowerCase().includes('transmission')) return '⚙️';
    return '🔧';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-4 md:py-8 max-w-3xl">
        <div className="mb-4 md:mb-6">
          <Link
            href="/maintenance"
            className="text-blue-600 hover:text-blue-800 mb-2 inline-block text-sm"
          >
            ← Back to Maintenance History
          </Link>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                {getServiceTypeIcon(maintenance.serviceType)} {maintenance.serviceType}
              </h1>
              {maintenance.vehicle && (
                <p className="text-sm md:text-base text-gray-600">
                  {maintenance.vehicle.year} {maintenance.vehicle.make} {maintenance.vehicle.model}
                  {maintenance.vehicle.licensePlate && ` (${maintenance.vehicle.licensePlate})`}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              {!isEditing && (
                <>
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
            {/* Similar form fields as new page */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vehicle *
              </label>
              <select
                required
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {vehicles.map(vehicle => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.licensePlate ? `(${vehicle.licensePlate})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service Type *
              </label>
              <select
                required
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {commonServiceTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service Date *
                </label>
                <input
                  type="date"
                  required
                  value={serviceDate}
                  onChange={(e) => setServiceDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mileage *
                </label>
                <input
                  type="number"
                  required
                  value={mileage}
                  onChange={(e) => setMileage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recommendations
              </label>
              <textarea
                rows={3}
                value={recommendations}
                onChange={(e) => setRecommendations(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cost
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Technician
                </label>
                <input
                  type="text"
                  value={technician}
                  onChange={(e) => setTechnician(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Photos
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={photoInput}
                  onChange={(e) => setPhotoInput(e.target.value)}
                  placeholder="Enter photo URL"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddPhoto();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddPhoto}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
                >
                  Add
                </button>
              </div>
              {photos.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative aspect-square rounded-md overflow-hidden border border-gray-300">
                      <img
                        src={photo}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder-image.png';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(index)}
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-700"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Next Service Date
                </label>
                <input
                  type="date"
                  value={nextServiceDate}
                  onChange={(e) => setNextServiceDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Next Service Mileage
                </label>
                <input
                  type="number"
                  value={nextServiceMileage}
                  onChange={(e) => setNextServiceMileage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

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
                  fetchMaintenance(params.id as string);
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
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Service Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Service Date:</span>
                  <p className="text-gray-900">{format(new Date(maintenance.serviceDate), 'MMMM d, yyyy')}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Mileage:</span>
                  <p className="text-gray-900 font-semibold">{maintenance.mileage.toLocaleString()} miles</p>
                </div>
                {maintenance.cost && (
                  <div>
                    <span className="font-medium text-gray-700">Cost:</span>
                    <p className="text-gray-900 font-semibold text-green-600">${maintenance.cost.toFixed(2)}</p>
                  </div>
                )}
                {maintenance.technician && (
                  <div>
                    <span className="font-medium text-gray-700">Technician:</span>
                    <p className="text-gray-900">{maintenance.technician}</p>
                  </div>
                )}
                {maintenance.nextServiceDate && (
                  <div>
                    <span className="font-medium text-gray-700">Next Service Date:</span>
                    <p className="text-gray-900">{format(new Date(maintenance.nextServiceDate), 'MMMM d, yyyy')}</p>
                  </div>
                )}
                {maintenance.nextServiceMileage && (
                  <div>
                    <span className="font-medium text-gray-700">Next Service Mileage:</span>
                    <p className="text-gray-900 font-semibold">{maintenance.nextServiceMileage.toLocaleString()} miles</p>
                  </div>
                )}
                {maintenance.job && (
                  <div>
                    <span className="font-medium text-gray-700">Related Job:</span>
                    <p className="text-gray-900">
                      <Link
                        href={`/jobs/${maintenance.job.id}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {maintenance.job.serviceType}
                      </Link>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {maintenance.description && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Description</h2>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{maintenance.description}</p>
              </div>
            )}

            {maintenance.recommendations && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <h2 className="text-lg font-semibold text-yellow-800 mb-2">Recommendations</h2>
                <p className="text-sm text-yellow-700 whitespace-pre-wrap">{maintenance.recommendations}</p>
              </div>
            )}

            {photos.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Photos</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative aspect-square rounded-md overflow-hidden border border-gray-300">
                      <img
                        src={photo}
                        alt={`Maintenance photo ${index + 1}`}
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

            {maintenance.notes && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Notes</h2>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{maintenance.notes}</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}


