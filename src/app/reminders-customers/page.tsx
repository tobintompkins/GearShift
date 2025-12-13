'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { MaintenanceReminder, ReminderType, ReminderStatus } from '@/lib/types';
import { format, isPast, isToday, addDays, differenceInDays } from 'date-fns';

const reminderTypeLabels: Record<ReminderType, string> = {
  'oil-change': '🛢️ Oil Change Due',
  'inspection-6month': '🔍 6-Month Inspection',
  'brake-check': '🛑 Brake Check Follow-up',
  'custom': '📋 Custom Reminder',
};

const reminderTypeColors: Record<ReminderType, string> = {
  'oil-change': 'bg-blue-100 text-blue-800 border-blue-300',
  'inspection-6month': 'bg-purple-100 text-purple-800 border-purple-300',
  'brake-check': 'bg-red-100 text-red-800 border-red-300',
  'custom': 'bg-gray-100 text-gray-800 border-gray-300',
};

const statusColors: Record<ReminderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  sent: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

export default function CustomerRemindersPage() {
  const [reminders, setReminders] = useState<MaintenanceReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showOverdue, setShowOverdue] = useState(true);
  const [showUpcoming, setShowUpcoming] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchReminders();
  }, [filterType, filterStatus, showOverdue, showUpcoming]);

  const fetchReminders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (filterType !== 'all') {
        params.append('reminderType', filterType);
      }
      if (filterStatus !== 'all') {
        params.append('status', filterStatus);
      }
      if (showOverdue) {
        params.append('overdue', 'true');
      }
      if (showUpcoming) {
        params.append('upcoming', 'true');
      }

      const response = await fetch(`/api/maintenance-reminders?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch reminders');
      }
      const data = await response.json();
      setReminders(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReminders = async () => {
    if (!confirm('Generate automatic reminders from maintenance history? This will create reminders for oil changes, brake checks, and inspections.')) {
      return;
    }

    try {
      setGenerating(true);
      const response = await fetch('/api/maintenance-reminders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate-from-maintenance' }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate reminders');
      }

      const result = await response.json();
      alert(`Generated ${result.count} new reminders!`);
      fetchReminders();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setGenerating(false);
    }
  };

  const handleSendReminder = async (reminderId: string) => {
    if (!confirm('Mark this reminder as sent? (Email/SMS integration can be added later)')) {
      return;
    }

    try {
      const response = await fetch(`/api/maintenance-reminders/${reminderId}/send`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to send reminder');
      }

      fetchReminders();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleCompleteReminder = async (reminderId: string) => {
    if (!confirm('Mark this reminder as completed?')) {
      return;
    }

    try {
      const response = await fetch(`/api/maintenance-reminders/${reminderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update reminder');
      }

      fetchReminders();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDeleteReminder = async (reminderId: string) => {
    if (!confirm('Delete this reminder?')) {
      return;
    }

    try {
      const response = await fetch(`/api/maintenance-reminders/${reminderId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete reminder');
      }

      fetchReminders();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const stats = {
    total: reminders.length,
    overdue: reminders.filter((r) => {
      try {
        return isPast(new Date(r.dueDate)) && (r.status === 'pending' || r.status === 'sent');
      } catch {
        return false;
      }
    }).length,
    dueToday: reminders.filter((r) => {
      try {
        return isToday(new Date(r.dueDate)) && (r.status === 'pending' || r.status === 'sent');
      } catch {
        return false;
      }
    }).length,
    pending: reminders.filter((r) => r.status === 'pending').length,
    sent: reminders.filter((r) => r.status === 'sent').length,
    completed: reminders.filter((r) => r.status === 'completed').length,
  };

  const overdueReminders = reminders.filter((r) => {
    try {
      return isPast(new Date(r.dueDate)) && (r.status === 'pending' || r.status === 'sent');
    } catch {
      return false;
    }
  });

  const upcomingReminders = reminders.filter((r) => {
    try {
      const dueDate = new Date(r.dueDate);
      const daysUntil = differenceInDays(dueDate, new Date());
      return daysUntil >= 0 && daysUntil <= 7 && (r.status === 'pending' || r.status === 'sent');
    } catch {
      return false;
    }
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-4 md:py-8">
        <div className="mb-4 md:mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              🔔 Repeat Customers Reminder
            </h1>
            <p className="text-sm md:text-base text-gray-600">
              Automatic reminders for oil changes, inspections, and brake checks
            </p>
          </div>
          <button
            onClick={handleGenerateReminders}
            disabled={generating}
            className="w-full sm:w-auto bg-green-600 text-white px-4 py-2 rounded-md font-medium hover:bg-green-700 transition-colors text-sm md:text-base disabled:opacity-50"
          >
            {generating ? 'Generating...' : '🔄 Auto-Generate Reminders'}
          </button>
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
            <div className="text-2xl md:text-3xl font-bold text-yellow-600">{stats.dueToday}</div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">Due Today</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">Pending</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold text-blue-600">{stats.sent}</div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">Sent</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">Completed</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Type:</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="all">All Types</option>
                <option value="oil-change">Oil Change</option>
                <option value="inspection-6month">6-Month Inspection</option>
                <option value="brake-check">Brake Check</option>
                <option value="custom">Custom</option>
              </select>
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
                <option value="sent">Sent</option>
                <option value="completed">Completed</option>
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
                checked={showUpcoming}
                onChange={(e) => setShowUpcoming(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Show Upcoming (7 days)</span>
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
            <p className="mt-4 text-gray-600">Loading reminders...</p>
          </div>
        ) : reminders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <p className="text-gray-600 mb-4">No reminders found.</p>
            <button
              onClick={handleGenerateReminders}
              disabled={generating}
              className="bg-green-600 text-white px-4 py-2 rounded-md font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {generating ? 'Generating...' : 'Generate Reminders from Maintenance History'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {reminders.map((reminder) => {
              const isOverdue = (() => {
                try {
                  return isPast(new Date(reminder.dueDate)) && (reminder.status === 'pending' || reminder.status === 'sent');
                } catch {
                  return false;
                }
              })();
              const isDueToday = (() => {
                try {
                  return isToday(new Date(reminder.dueDate));
                } catch {
                  return false;
                }
              })();
              const daysUntil = (() => {
                try {
                  return differenceInDays(new Date(reminder.dueDate), new Date());
                } catch {
                  return null;
                }
              })();

              return (
                <div
                  key={reminder.id}
                  className={`bg-white rounded-lg shadow-md p-4 md:p-6 border-l-4 ${
                    isOverdue ? 'border-red-500' : isDueToday ? 'border-yellow-500' : 'border-blue-500'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <h3 className="text-lg md:text-xl font-semibold text-gray-900">
                          {reminder.title}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium border ${
                            reminderTypeColors[reminder.reminderType as ReminderType]
                          }`}
                        >
                          {reminderTypeLabels[reminder.reminderType as ReminderType]}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[reminder.status as ReminderStatus]}`}
                        >
                          {reminder.status.charAt(0).toUpperCase() + reminder.status.slice(1)}
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
                        {daysUntil !== null && daysUntil > 0 && daysUntil <= 7 && (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-300">
                            {daysUntil} day{daysUntil !== 1 ? 's' : ''} until due
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700 mb-3">
                        <div>
                          <span className="font-medium">Customer:</span>{' '}
                          <Link
                            href={`/customers/${reminder.customerId}`}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            {reminder.customer?.firstName} {reminder.customer?.lastName}
                          </Link>
                        </div>
                        <div>
                          <span className="font-medium">Vehicle:</span>{' '}
                          <Link
                            href={`/vehicles/${reminder.vehicleId}`}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            {reminder.vehicle?.year} {reminder.vehicle?.make} {reminder.vehicle?.model}
                          </Link>
                        </div>
                        <div>
                          <span className="font-medium">Due Date:</span>{' '}
                          <span className={isOverdue ? 'text-red-600 font-semibold' : ''}>
                            {format(new Date(reminder.dueDate), 'MMM d, yyyy')}
                          </span>
                        </div>
                        {reminder.dueMileage && (
                          <div>
                            <span className="font-medium">Due Mileage:</span>{' '}
                            {reminder.dueMileage.toLocaleString()} miles
                            {reminder.vehicle?.mileage && (
                              <span className="text-gray-500 ml-2">
                                (Current: {reminder.vehicle.mileage.toLocaleString()})
                              </span>
                            )}
                          </div>
                        )}
                        {reminder.customer?.phone && (
                          <div>
                            <span className="font-medium">Phone:</span>{' '}
                            <a href={`tel:${reminder.customer.phone}`} className="text-blue-600 hover:text-blue-800">
                              {reminder.customer.phone}
                            </a>
                          </div>
                        )}
                        {reminder.customer?.email && (
                          <div>
                            <span className="font-medium">Email:</span>{' '}
                            <a href={`mailto:${reminder.customer.email}`} className="text-blue-600 hover:text-blue-800">
                              {reminder.customer.email}
                            </a>
                          </div>
                        )}
                      </div>

                      {reminder.description && (
                        <p className="text-sm text-gray-600 mb-2">{reminder.description}</p>
                      )}

                      {reminder.lastSentAt && (
                        <p className="text-xs text-gray-500">
                          Last sent: {format(new Date(reminder.lastSentAt), 'MMM d, yyyy h:mm a')}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 md:min-w-[150px]">
                      {reminder.status !== 'completed' && (
                        <>
                          <button
                            onClick={() => handleSendReminder(reminder.id)}
                            className="bg-blue-600 text-white px-3 py-2 rounded-md text-xs font-medium hover:bg-blue-700 transition-colors"
                          >
                            📧 Mark as Sent
                          </button>
                          <button
                            onClick={() => handleCompleteReminder(reminder.id)}
                            className="bg-green-600 text-white px-3 py-2 rounded-md text-xs font-medium hover:bg-green-700 transition-colors"
                          >
                            ✓ Complete
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDeleteReminder(reminder.id)}
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

