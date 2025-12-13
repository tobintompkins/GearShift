'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { Vehicle, Job } from '@/lib/types';

export default function NewMaintenancePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const vehicleIdParam = searchParams?.get('vehicleId');
  const jobIdParam = searchParams?.get('jobId');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);

  // Form state
  const [vehicleId, setVehicleId] = useState<string>(vehicleIdParam || '');
  const [jobId, setJobId] = useState<string>(jobIdParam || '');
  const [serviceType, setServiceType] = useState<string>('');
  const [serviceDate, setServiceDate] = useState<string>(new Date().toISOString().split('T')[0]);
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
    fetchVehicles();
    fetchJobs();
    
    // If vehicleId is provided, fetch vehicle details to pre-fill mileage
    if (vehicleIdParam) {
      fetchVehicleDetails(vehicleIdParam);
    }
  }, []);

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

  const fetchVehicleDetails = async (id: string) => {
    try {
      const response = await fetch(`/api/vehicles/${id}`);
      if (response.ok) {
        const vehicle = await response.json();
        if (vehicle.mileage) {
          setMileage(vehicle.mileage.toString());
        }
      }
    } catch (err) {
      console.error('Error fetching vehicle details:', err);
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

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      if (!vehicleId || !serviceType || !serviceDate || !mileage) {
        setError('Vehicle, service type, date, and mileage are required');
        return;
      }

      const response = await fetch('/api/maintenance', {
        method: 'POST',
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
        throw new Error(errorData.error || 'Failed to create maintenance record');
      }

      const record = await response.json();
      router.push(`/maintenance/${record.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
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
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Add Maintenance Record
          </h1>
          <p className="text-sm md:text-base text-gray-600">
            Record a service performed on a vehicle
          </p>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Service Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vehicle *
                </label>
                <select
                  required
                  value={vehicleId}
                  onChange={(e) => {
                    setVehicleId(e.target.value);
                    if (e.target.value) {
                      fetchVehicleDetails(e.target.value);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Select Vehicle --</option>
                  {vehicles.map(vehicle => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.licensePlate ? `(${vehicle.licensePlate})` : ''} - {vehicle.customer?.firstName} {vehicle.customer?.lastName}
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
                  <option value="">-- Select Service Type --</option>
                  {commonServiceTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                {serviceType === 'Other' && (
                  <input
                    type="text"
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value)}
                    placeholder="Enter service type"
                    className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
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
                    Mileage at Service *
                  </label>
                  <input
                    type="number"
                    required
                    value={mileage}
                    onChange={(e) => setMileage(e.target.value)}
                    placeholder="e.g., 50000"
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
                  placeholder="Describe the work performed..."
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
                    placeholder="0.00"
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
                    placeholder="Technician name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recommendations</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Future Repairs/Services Recommended
                </label>
                <textarea
                  rows={3}
                  value={recommendations}
                  onChange={(e) => setRecommendations(e.target.value)}
                  placeholder="List any future repairs or services the customer should consider..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
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
                    placeholder="e.g., 55000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Photos */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Photos</h2>
            
            <div className="space-y-4">
              <div className="flex gap-2">
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
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 font-medium"
                >
                  Add Photo
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
              <p className="text-xs text-gray-500">
                Note: Enter photo URLs for now. File upload functionality can be added later.
              </p>
            </div>
          </div>

          {/* Related Job */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Related Information</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Related Job (Optional)
              </label>
              <select
                value={jobId}
                onChange={(e) => setJobId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Select Job --</option>
                {jobs.map(job => (
                  <option key={job.id} value={job.id}>
                    {new Date(job.date).toLocaleDateString()} - {job.customerFirstName} {job.customerLastName} - {job.serviceType}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Additional Notes</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Internal Notes
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional notes about this maintenance..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 font-medium disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Maintenance Record'}
            </button>
            <Link
              href="/maintenance"
              className="flex-1 bg-gray-300 text-gray-700 py-3 px-6 rounded-md hover:bg-gray-400 font-medium text-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}


