'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { MaintenanceInterval, MaintenanceIntervalType, Vehicle } from '@/lib/types';
import { format, isPast, isToday, addDays, differenceInDays } from 'date-fns';

const intervalTypeLabels: Record<MaintenanceIntervalType, string> = {
  'oil-change': '🛢️ Oil Change',
  'transmission': '⚙️ Transmission Service',
  'coolant': '🌡️ Coolant Flush',
  'brake-fluid': '🛑 Brake Fluid Service',
  'differential': '🔧 Differential Service',
};

const intervalTypeColors: Record<MaintenanceIntervalType, string> = {
  'oil-change': 'bg-blue-100 text-blue-800 border-blue-300',
  'transmission': 'bg-purple-100 text-purple-800 border-purple-300',
  'coolant': 'bg-green-100 text-green-800 border-green-300',
  'brake-fluid': 'bg-red-100 text-red-800 border-red-300',
  'differential': 'bg-orange-100 text-orange-800 border-orange-300',
};

export default function MaintenanceIntervalsPage() {
  const [intervals, setIntervals] = useState<MaintenanceInterval[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterVehicle, setFilterVehicle] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [showOverdue, setShowOverdue] = useState(false);
  const [showDueSoon, setShowDueSoon] = useState(false);

  useEffect(() => {
    fetchVehicles();
    fetchIntervals();
  }, [filterVehicle, filterType, showOverdue, showDueSoon]);

  const fetchVehicles = async () => {
    try {
      const response = await fetch('/api/vehicles');
      if (response.ok) {
        const data = await response.json();
        setVehicles(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching vehicles:', err);
    }
  };

  const fetchIntervals = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (filterVehicle !== 'all') {
        params.append('vehicleId', filterVehicle);
      }
      if (filterType !== 'all') {
        params.append('intervalType', filterType);
      }
      if (showOverdue) {
        params.append('overdue', 'true');
      }
      if (showDueSoon) {
        params.append('dueSoon', 'true');
      }
      params.append('activeOnly', 'true');

      const response = await fetch(`/api/maintenance-intervals?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch maintenance intervals');
      }
      const data = await response.json();
      setIntervals(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkComplete = async (intervalId: string) => {
    const interval = intervals.find((i) => i.id === intervalId);
    if (!interval) return;

    const serviceDate = prompt('Enter service date (YYYY-MM-DD) or leave blank for today:', new Date().toISOString().split('T')[0]);
    if (serviceDate === null) return;

    const serviceMileage = prompt(`Enter service mileage (current: ${interval.vehicle?.mileage || 'N/A'}):`, interval.vehicle?.mileage?.toString() || '');
    if (serviceMileage === null) return;

    try {
      const response = await fetch(`/api/maintenance-intervals/${intervalId}/mark-complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceDate: serviceDate || new Date().toISOString().split('T')[0],
          serviceMileage: serviceMileage ? Number(serviceMileage) : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to mark as complete');
      }

      fetchIntervals();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this maintenance interval?')) {
      return;
    }

    try {
      const response = await fetch(`/api/maintenance-intervals/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete maintenance interval');
      }

      fetchIntervals();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const stats = {
    total: intervals.length,
    overdue: intervals.filter((i) => {
      if (i.nextDueDate) {
        try {
          return isPast(new Date(i.nextDueDate));
        } catch {
          return false;
        }
      }
      if (i.nextDueMileage && i.vehicle?.mileage) {
        return i.vehicle.mileage >= i.nextDueMileage;
      }
      return false;
    }).length,
    dueSoon: intervals.filter((i) => {
      if (i.nextDueDate) {
        try {
          const daysUntil = differenceInDays(new Date(i.nextDueDate), new Date());
          return daysUntil >= 0 && daysUntil <= 7;
        } catch {
          return false;
        }
      }
      return false;
    }).length,
    byType: {
      'oil-change': intervals.filter((i) => i.intervalType === 'oil-change').length,
      'transmission': intervals.filter((i) => i.intervalType === 'transmission').length,
      'coolant': intervals.filter((i) => i.intervalType === 'coolant').length,
      'brake-fluid': intervals.filter((i) => i.intervalType === 'brake-fluid').length,
      'differential': intervals.filter((i) => i.intervalType === 'differential').length,
    },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-4 md:py-8">
        <div className="mb-4 md:mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              ⏱️ Maintenance Interval Tracker
            </h1>
            <p className="text-sm md:text-base text-gray-600">
              Track maintenance intervals and auto-calculate next due dates/mileage
            </p>
          </div>
          <Link
            href="/maintenance-intervals/new"
            className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors text-sm md:text-base text-center"
          >
            + New Interval
          </Link>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">Total</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center border-l-4 border-red-500">
            <div className="text-2xl md:text-3xl font-bold text-red-600">{stats.overdue}</div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">Overdue</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center border-l-4 border-yellow-500">
            <div className="text-2xl md:text-3xl font-bold text-yellow-600">{stats.dueSoon}</div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">Due Soon</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold text-blue-600">{stats.byType['oil-change']}</div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">Oil Changes</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold text-purple-600">{stats.byType['transmission']}</div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">Transmission</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold text-green-600">{stats.byType['coolant']}</div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">Coolant</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Vehicle:</label>
              <select
                value={filterVehicle}
                onChange={(e) => setFilterVehicle(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="all">All Vehicles</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Type:</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="all">All Types</option>
                {Object.entries(intervalTypeLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showOverdue}
                onChange={(e) => setShowOverdue(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Show Overdue Only</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showDueSoon}
                onChange={(e) => setShowDueSoon(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Show Due Soon (7 days)</span>
            </label>
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
            <p className="mt-4 text-gray-600">Loading maintenance intervals...</p>
          </div>
        ) : intervals.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <p className="text-gray-600 mb-4">No maintenance intervals found.</p>
            <Link
              href="/maintenance-intervals/new"
              className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors"
            >
              Create First Interval
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {intervals.map((interval) => {
              const isOverdue = (() => {
                if (interval.nextDueDate) {
                  try {
                    return isPast(new Date(interval.nextDueDate));
                  } catch {
                    return false;
                  }
                }
                if (interval.nextDueMileage && interval.vehicle?.mileage) {
                  return interval.vehicle.mileage >= interval.nextDueMileage;
                }
                return false;
              })();
              const isDueToday = (() => {
                if (interval.nextDueDate) {
                  try {
                    return isToday(new Date(interval.nextDueDate));
                  } catch {
                    return false;
                  }
                }
                return false;
              })();
              const isDueSoon = (() => {
                if (interval.nextDueDate) {
                  try {
                    const daysUntil = differenceInDays(new Date(interval.nextDueDate), new Date());
                    return daysUntil >= 0 && daysUntil <= 7;
                  } catch {
                    return false;
                  }
                }
                return false;
              })();
              const milesUntil = interval.nextDueMileage && interval.vehicle?.mileage
                ? interval.nextDueMileage - interval.vehicle.mileage
                : null;

              return (
                <div
                  key={interval.id}
                  className={`bg-white rounded-lg shadow-md p-4 md:p-6 border-l-4 ${
                    isOverdue
                      ? 'border-red-500'
                      : isDueToday
                      ? 'border-yellow-500'
                      : isDueSoon
                      ? 'border-orange-500'
                      : 'border-blue-500'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <h3 className="text-lg md:text-xl font-semibold text-gray-900">
                          {interval.vehicle?.year} {interval.vehicle?.make} {interval.vehicle?.model}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium border ${
                            intervalTypeColors[interval.intervalType as MaintenanceIntervalType]
                          }`}
                        >
                          {intervalTypeLabels[interval.intervalType as MaintenanceIntervalType]}
                        </span>
                        {isOverdue && (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-300">
                            ⚠️ Overdue
                          </span>
                        )}
                        {isDueToday && (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-300">
                            📅 Due Today
                          </span>
                        )}
                        {isDueSoon && !isDueToday && (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-300">
                            ⏰ Due Soon
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm text-gray-700 mb-3">
                        <div>
                          <span className="font-medium">Interval:</span>{' '}
                          {interval.intervalMileage && (
                            <span className="text-gray-900">{interval.intervalMileage.toLocaleString()} miles</span>
                          )}
                          {interval.intervalMileage && interval.intervalMonths && ' or '}
                          {interval.intervalMonths && (
                            <span className="text-gray-900">{interval.intervalMonths} months</span>
                          )}
                        </div>
                        {interval.lastServiceDate && (
                          <div>
                            <span className="font-medium">Last Service:</span>{' '}
                            <span className="text-gray-900">
                              {format(new Date(interval.lastServiceDate), 'MMM d, yyyy')}
                            </span>
                            {interval.lastServiceMileage && (
                              <span className="text-gray-500 ml-2">
                                ({interval.lastServiceMileage.toLocaleString()} miles)
                              </span>
                            )}
                          </div>
                        )}
                        {interval.nextDueDate && (
                          <div>
                            <span className="font-medium">Next Due Date:</span>{' '}
                            <span className={isOverdue ? 'text-red-600 font-semibold' : 'text-gray-900'}>
                              {format(new Date(interval.nextDueDate), 'MMM d, yyyy')}
                            </span>
                          </div>
                        )}
                        {interval.nextDueMileage && (
                          <div>
                            <span className="font-medium">Next Due Mileage:</span>{' '}
                            <span className={isOverdue ? 'text-red-600 font-semibold' : 'text-gray-900'}>
                              {interval.nextDueMileage.toLocaleString()} miles
                            </span>
                            {milesUntil !== null && (
                              <span className="text-gray-500 ml-2">
                                ({milesUntil > 0 ? `${milesUntil.toLocaleString()} miles until` : 'Overdue'})
                              </span>
                            )}
                          </div>
                        )}
                        {interval.vehicle?.mileage && (
                          <div>
                            <span className="font-medium">Current Mileage:</span>{' '}
                            <span className="text-gray-900">{interval.vehicle.mileage.toLocaleString()} miles</span>
                          </div>
                        )}
                        {interval.vehicle?.customer && (
                          <div>
                            <span className="font-medium">Customer:</span>{' '}
                            <Link
                              href={`/customers/${interval.vehicle.customer.id}`}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              {interval.vehicle.customer.firstName} {interval.vehicle.customer.lastName}
                            </Link>
                          </div>
                        )}
                      </div>

                      {interval.notes && (
                        <p className="text-sm text-gray-600 mt-2">{interval.notes}</p>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 md:min-w-[150px]">
                      <button
                        onClick={() => handleMarkComplete(interval.id)}
                        className="bg-green-600 text-white px-3 py-2 rounded-md text-xs font-medium hover:bg-green-700 transition-colors"
                      >
                        ✓ Mark Complete
                      </button>
                      <Link
                        href={`/maintenance-intervals/${interval.id}/edit`}
                        className="bg-blue-600 text-white px-3 py-2 rounded-md text-xs font-medium hover:bg-blue-700 transition-colors text-center"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(interval.id)}
                        className="bg-red-600 text-white px-3 py-2 rounded-md text-xs font-medium hover:bg-red-700 transition-colors"
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

