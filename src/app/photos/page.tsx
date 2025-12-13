'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { JobPhoto, PhotoType, Job } from '@/lib/types';
import { format } from 'date-fns';

export default function PhotosPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [photos, setPhotos] = useState<JobPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [uploading, setUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);

  const photoTypes: PhotoType[] = ['vehicle-damage', 'old-parts', 'finished-work', 'diagnostic', 'general'];

  const photoTypeLabels: Record<PhotoType, string> = {
    'vehicle-damage': '🚗 Vehicle Damage',
    'old-parts': '🔧 Old Parts',
    'finished-work': '✅ Finished Work',
    'diagnostic': '📊 Diagnostic',
    'general': '📷 General',
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    if (selectedJobId) {
      fetchPhotos(selectedJobId);
    } else {
      setPhotos([]);
    }
  }, [selectedJobId, filterType]);

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

  const fetchPhotos = async (jobId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/jobs/${jobId}/photos`);
      if (!response.ok) {
        throw new Error('Failed to fetch photos');
      }
      const data = await response.json();
      let filteredPhotos = Array.isArray(data) ? data : [];
      
      if (filterType !== 'all') {
        filteredPhotos = filteredPhotos.filter((p: JobPhoto) => p.photoType === filterType);
      }
      
      setPhotos(filteredPhotos);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedJobId) {
      alert('Please select a job first');
      return;
    }

    const formData = new FormData(e.currentTarget);
    const fileInput = e.currentTarget.querySelector('input[type="file"]') as HTMLInputElement;
    
    if (!fileInput?.files || fileInput.files.length === 0) {
      alert('Please select a file to upload');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const uploadFormData = new FormData();
      uploadFormData.append('file', fileInput.files[0]);
      uploadFormData.append('photoType', formData.get('photoType') as string);
      uploadFormData.append('description', formData.get('description') as string || '');
      uploadFormData.append('uploadedBy', formData.get('uploadedBy') as string || '');

      const response = await fetch(`/api/jobs/${selectedJobId}/photos`, {
        method: 'POST',
        body: uploadFormData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to upload photo');
      }

      // Reset form and refresh photos
      e.currentTarget.reset();
      setShowUploadForm(false);
      fetchPhotos(selectedJobId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (photoId: string) => {
    if (!confirm('Are you sure you want to delete this photo?')) {
      return;
    }

    try {
      const response = await fetch(`/api/photos/${photoId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete photo');
      }

      fetchPhotos(selectedJobId);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const stats = {
    total: photos.length,
    byType: photoTypes.reduce((acc, type) => {
      acc[type] = photos.filter(p => p.photoType === type).length;
      return acc;
    }, {} as Record<PhotoType, number>),
  };

  const selectedJob = jobs.find(j => j.id === selectedJobId);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-4 md:py-8">
        <div className="mb-4 md:mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              📸 Job Photos
            </h1>
            <p className="text-sm md:text-base text-gray-600">
              Upload and manage photos for jobs (vehicle damage, old parts, finished work, diagnostics)
            </p>
          </div>
          {selectedJobId && (
            <button
              onClick={() => setShowUploadForm(!showUploadForm)}
              className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors text-sm md:text-base"
            >
              {showUploadForm ? 'Cancel Upload' : '+ Upload Photo'}
            </button>
          )}
        </div>

        {/* Job Selection */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Job
          </label>
          <select
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Select a Job --</option>
            {jobs.map(job => (
              <option key={job.id} value={job.id}>
                {(() => {
                  try {
                    return format(new Date(job.date), 'MMM d, yyyy');
                  } catch {
                    return 'Invalid date';
                  }
                })()} - {job.customerFirstName} {job.customerLastName} - {job.serviceType}
              </option>
            ))}
          </select>
          {selectedJob && (
            <div className="mt-3 text-sm text-gray-600">
              <p><strong>Customer:</strong> {selectedJob.customerFirstName} {selectedJob.customerLastName}</p>
              <p><strong>Vehicle:</strong> {selectedJob.vehicleInfo}</p>
              <p><strong>Service:</strong> {selectedJob.serviceType}</p>
            </div>
          )}
        </div>

        {/* Upload Form */}
        {showUploadForm && selectedJobId && (
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Photo</h2>
            <form onSubmit={handleFileUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Photo File *
                </label>
                <input
                  type="file"
                  name="file"
                  accept="image/*"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Max file size: 10MB. Supported formats: JPEG, PNG, GIF, WebP</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Photo Type *
                </label>
                <select
                  name="photoType"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {photoTypes.map(type => (
                    <option key={type} value={type}>{photoTypeLabels[type]}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={2}
                  placeholder="Optional description of the photo..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Uploaded By
                </label>
                <input
                  type="text"
                  name="uploadedBy"
                  placeholder="Your name or employee name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 font-medium disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Upload Photo'}
              </button>
            </form>
          </div>
        )}

        {/* Statistics */}
        {selectedJobId && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-md p-4 text-center">
              <div className="text-2xl md:text-3xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-xs md:text-sm text-gray-600 mt-1">Total Photos</div>
            </div>
            {photoTypes.map(type => (
              <div key={type} className="bg-white rounded-lg shadow-md p-4 text-center">
                <div className="text-2xl md:text-3xl font-bold text-blue-600">{stats.byType[type]}</div>
                <div className="text-xs md:text-sm text-gray-600 mt-1">{photoTypeLabels[type]}</div>
              </div>
            ))}
          </div>
        )}

        {/* Filter */}
        {selectedJobId && (
          <div className="mb-6">
            <label className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Filter by Type:</span>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="all">All Types</option>
                {photoTypes.map(type => (
                  <option key={type} value={type}>{photoTypeLabels[type]}</option>
                ))}
              </select>
            </label>
          </div>
        )}

        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {!selectedJobId ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <p className="text-gray-600 mb-4">Please select a job to view and upload photos.</p>
          </div>
        ) : loading ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading photos...</p>
          </div>
        ) : photos.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <p className="text-gray-600 mb-4">No photos found for this job.</p>
            <button
              onClick={() => setShowUploadForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors"
            >
              Upload First Photo
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="bg-white rounded-lg shadow-md overflow-hidden"
              >
                <div className="relative aspect-square bg-gray-100">
                  <img
                    src={photo.filepath}
                    alt={photo.description || photo.filename}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder-image.png';
                    }}
                  />
                </div>
                <div className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {photoTypeLabels[photo.photoType as PhotoType]}
                    </span>
                    <button
                      onClick={() => handleDelete(photo.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                  {photo.description && (
                    <p className="text-xs text-gray-600 mb-1">{photo.description}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    {format(new Date(photo.createdAt), 'MMM d, yyyy')}
                    {photo.uploadedBy && ` • ${photo.uploadedBy}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

