'use client';

'use client';

import { useState, useEffect } from 'react';
import { useLoadScript, GoogleMap, Marker, InfoWindow, DirectionsRenderer } from '@react-google-maps/api';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { Job } from '@/lib/types';
import { format } from 'date-fns';

// Map container style
const mapContainerStyle = {
  width: '100%',
  height: '600px',
};

// Default center (can be customized)
const defaultCenter = {
  lat: 40.7128, // New York City default
  lng: -74.0060,
};

// Map options
const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
};

interface JobWithLocation extends Job {
  lat?: number;
  lng?: number;
  geocoded?: boolean;
}

export default function JobMapPage() {
  const [jobs, setJobs] = useState<JobWithLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<JobWithLocation | null>(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [mapZoom, setMapZoom] = useState(10);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [routeJobs, setRouteJobs] = useState<string[]>([]); // Selected job IDs for route
  const [routeLoading, setRouteLoading] = useState(false);
  const [filterDate, setFilterDate] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Load Google Maps script
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  });

  useEffect(() => {
    fetchJobs();
  }, [filterDate, filterStatus]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (filterDate) {
        params.append('date', filterDate);
      }
      if (filterStatus !== 'all') {
        params.append('status', filterStatus);
      }

      const response = await fetch(`/api/jobs?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }
      const data = await response.json();
      
      // Geocode jobs with addresses
      const jobsWithLocations = await Promise.all(
        data.map(async (job: Job) => {
          if (!job.customerAddress) {
            return { ...job, geocoded: false };
          }

          try {
            const geoResponse = await fetch(
              `/api/geocode?address=${encodeURIComponent(job.customerAddress)}`
            );
            if (geoResponse.ok) {
              const geoData = await geoResponse.json();
              return {
                ...job,
                lat: geoData.lat,
                lng: geoData.lng,
                geocoded: true,
              };
            }
          } catch (err) {
            console.error(`Failed to geocode job ${job.id}:`, err);
          }

          return { ...job, geocoded: false };
        })
      );

      setJobs(jobsWithLocations.filter((j: JobWithLocation) => j.geocoded));
      
      // Center map on first job or default
      if (jobsWithLocations.length > 0 && jobsWithLocations[0].lat && jobsWithLocations[0].lng) {
        setMapCenter({
          lat: jobsWithLocations[0].lat,
          lng: jobsWithLocations[0].lng,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkerClick = (job: JobWithLocation) => {
    setSelectedJob(job);
  };

  const handleMapClick = () => {
    setSelectedJob(null);
  };

  const calculateRoute = async () => {
    if (routeJobs.length < 2) {
      alert('Please select at least 2 jobs to create a route');
      return;
    }

    try {
      setRouteLoading(true);
      const selectedJobData = routeJobs
        .map(id => jobs.find(j => j.id === id))
        .filter(j => j && j.lat && j.lng) as JobWithLocation[];

      if (selectedJobData.length < 2) {
        alert('Selected jobs must have valid addresses');
        return;
      }

      const directionsService = new google.maps.DirectionsService();
      const waypoints = selectedJobData.slice(1, -1).map(job => ({
        location: { lat: job.lat!, lng: job.lng! },
        stopover: true,
      }));

      directionsService.route(
        {
          origin: { lat: selectedJobData[0].lat!, lng: selectedJobData[0].lng! },
          destination: {
            lat: selectedJobData[selectedJobData.length - 1].lat!,
            lng: selectedJobData[selectedJobData.length - 1].lng!,
          },
          waypoints: waypoints,
          travelMode: google.maps.TravelMode.DRIVING,
          optimizeWaypoints: true,
        },
        (result, status) => {
          if (status === 'OK' && result) {
            setDirections(result);
            
            // Update map to show route
            if (result.routes[0]?.bounds) {
              const bounds = result.routes[0].bounds;
              const center = {
                lat: (bounds.getNorthEast().lat() + bounds.getSouthWest().lat()) / 2,
                lng: (bounds.getNorthEast().lng() + bounds.getSouthWest().lng()) / 2,
              };
              setMapCenter(center);
            }
          } else {
            alert(`Route calculation failed: ${status}`);
          }
          setRouteLoading(false);
        }
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to calculate route');
      setRouteLoading(false);
    }
  };

  const clearRoute = () => {
    setDirections(null);
    setRouteJobs([]);
  };

  const toggleJobForRoute = (jobId: string) => {
    if (routeJobs.includes(jobId)) {
      setRouteJobs(routeJobs.filter(id => id !== jobId));
    } else {
      setRouteJobs([...routeJobs, jobId]);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'awaiting-parts':
        return 'bg-orange-100 text-orange-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loadError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p className="font-medium">Error loading Google Maps</p>
            <p className="text-sm mt-1">
              {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
                ? 'Please check your Google Maps API key configuration.'
                : 'Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your .env.local file'}
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading Google Maps...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-4 md:py-8">
        <div className="mb-4 md:mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Job Location Map
          </h1>
          <p className="text-sm md:text-base text-gray-600">
            View all job locations on a map and plan efficient routes
          </p>
        </div>

        {/* Filters and Controls */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Date:</label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Status:</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="awaiting-parts">Awaiting Parts</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="flex-1"></div>
            {routeJobs.length > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={calculateRoute}
                  disabled={routeLoading || routeJobs.length < 2}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium text-sm disabled:opacity-50"
                >
                  {routeLoading ? 'Calculating...' : `Plan Route (${routeJobs.length} jobs)`}
                </button>
                <button
                  onClick={clearRoute}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 font-medium text-sm"
                >
                  Clear Route
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600 text-sm">Loading jobs and geocoding addresses...</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-4 text-gray-600">
              No jobs with valid addresses found for the selected filters.
            </div>
          ) : (
            <div className="text-sm text-gray-600">
              Showing {jobs.length} job{jobs.length !== 1 ? 's' : ''} on map
            </div>
          )}
        </div>

        {/* Map and Job List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={mapCenter}
                zoom={mapZoom}
                options={mapOptions}
                onClick={handleMapClick}
              >
                {jobs.map((job) => (
                  <Marker
                    key={job.id}
                    position={{ lat: job.lat!, lng: job.lng! }}
                    onClick={() => handleMarkerClick(job)}
                    icon={{
                      url: job.urgent
                        ? 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
                        : job.status === 'completed'
                        ? 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
                        : 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                    }}
                  />
                ))}

                {selectedJob && (
                  <InfoWindow
                    position={{ lat: selectedJob.lat!, lng: selectedJob.lng! }}
                    onCloseClick={() => setSelectedJob(null)}
                  >
                    <div className="p-2 max-w-xs">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {selectedJob.customerFirstName} {selectedJob.customerLastName}
                      </h3>
                      <p className="text-sm text-gray-700 mb-1">
                        <strong>Service:</strong> {selectedJob.serviceType}
                      </p>
                      <p className="text-sm text-gray-700 mb-1">
                        <strong>Date:</strong> {format(new Date(selectedJob.date), 'MMM d, yyyy')}
                      </p>
                      <p className="text-sm text-gray-700 mb-1">
                        <strong>Time:</strong> {selectedJob.startTime}
                      </p>
                      <p className="text-sm text-gray-700 mb-2">
                        <strong>Address:</strong> {selectedJob.customerAddress}
                      </p>
                      <Link
                        href={`/jobs/${selectedJob.id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View Job Details →
                      </Link>
                    </div>
                  </InfoWindow>
                )}

                {directions && <DirectionsRenderer directions={directions} />}
              </GoogleMap>
            </div>
          </div>

          {/* Job List Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Jobs ({jobs.length})
              </h2>
              {jobs.length === 0 ? (
                <p className="text-gray-600 text-sm">No jobs to display</p>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {jobs.map((job) => (
                    <div
                      key={job.id}
                      className={`p-3 rounded-md border-2 cursor-pointer transition-colors ${
                        selectedJob?.id === job.id
                          ? 'border-blue-500 bg-blue-50'
                          : routeJobs.includes(job.id)
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => {
                        handleMarkerClick(job);
                        setMapCenter({ lat: job.lat!, lng: job.lng! });
                        setMapZoom(15);
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 text-sm">
                            {job.customerFirstName} {job.customerLastName}
                          </h3>
                          <p className="text-xs text-gray-600">{job.serviceType}</p>
                        </div>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={routeJobs.includes(job.id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              toggleJobForRoute(job.id);
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </label>
                      </div>
                      <div className="text-xs text-gray-600 space-y-1">
                        <p>
                          {format(new Date(job.date), 'MMM d')} at {job.startTime}
                        </p>
                        <p className="truncate">{job.customerAddress}</p>
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            job.status
                          )}`}
                        >
                          {job.status}
                        </span>
                        {job.urgent && (
                          <span className="ml-2 inline-block px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Urgent
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Route Information */}
        {directions && (
          <div className="mt-6 bg-white rounded-lg shadow-md p-4 md:p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Route Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-700">Total Distance:</span>
                <p className="text-lg font-semibold text-gray-900">
                  {directions.routes[0]?.legs.reduce(
                    (total, leg) => total + (leg.distance?.value || 0),
                    0
                  ) / 1609.34}{' '}
                  miles
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Total Time:</span>
                <p className="text-lg font-semibold text-gray-900">
                  {Math.round(
                    directions.routes[0]?.legs.reduce(
                      (total, leg) => total + (leg.duration?.value || 0),
                      0
                    ) / 60
                  )}{' '}
                  minutes
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Stops:</span>
                <p className="text-lg font-semibold text-gray-900">{routeJobs.length} jobs</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}


