'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { Reminder, ReminderFormData, ReminderType, ReminderMethod } from '@/lib/types';
import { format, addDays } from 'date-fns';

function RemindersContent() {
  const searchParams = useSearchParams();
  const jobIdParam = searchParams?.get('jobId');
  
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(!!jobIdParam);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [filterSent, setFilterSent] = useState<string>('all'); // 'all', 'sent', 'pending'

  const fetchReminders = async () => {
    try {
      setLoading(true);
      setError(null);
      const url = filterSent === 'all' 
        ? '/api/reminders'
        : `/api/reminders?sent=${filterSent === 'sent'}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch reminders');
      }
      const data = await response.json();
      setReminders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, [filterSent, jobIdParam]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this reminder?')) {
      return;
    }

    try {
      const response = await fetch(`/api/reminders/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete reminder');
      }

      fetchReminders();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleFormSubmit = async (data: ReminderFormData) => {
    try {
      setError(null);
      const url = editingReminder
        ? `/api/reminders/${editingReminder.id}`
        : '/api/reminders';
      const method = editingReminder ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to save reminder: ${response.status} ${response.statusText}`);
      }

      setShowForm(false);
      setEditingReminder(null);
      fetchReminders();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      console.error('Error saving reminder:', err);
    }
  };

  const calculateReminderDate = (jobDate: Date, daysBefore: number) => {
    return addDays(new Date(jobDate), -daysBefore);
  };

  if (showForm) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="container mx-auto px-4 py-4 md:py-8 max-w-4xl">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {editingReminder ? 'Edit Reminder' : 'Create Reminder'}
            </h1>
            <p className="text-gray-600">
              {editingReminder
                ? 'Update reminder settings'
                : 'Set up automated reminders for appointments'}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            {error && (
              <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const messageValue = formData.get('message')?.toString().trim();
                handleFormSubmit({
                  jobId: formData.get('jobId')?.toString() || '',
                  type: formData.get('type')?.toString() as ReminderType || 'customer',
                  method: formData.get('method')?.toString() as ReminderMethod || 'email',
                  daysBefore: parseInt(formData.get('daysBefore')?.toString() || '1'),
                  message: messageValue && messageValue.length > 0 ? messageValue : undefined,
                });
              }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Job ID *
                  </label>
                  <input
                    type="text"
                    name="jobId"
                    required
                    defaultValue={editingReminder?.jobId || jobIdParam || ''}
                    placeholder="Enter job ID"
                    disabled={!!jobIdParam}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Remind Who? *
                  </label>
                  <select
                    name="type"
                    required
                    defaultValue={editingReminder?.type || 'customer'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="customer">Customer</option>
                    <option value="employee">Employee</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Method *
                  </label>
                  <select
                    name="method"
                    required
                    defaultValue={editingReminder?.method || 'email'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                    <option value="app">App Notification</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Days Before Appointment *
                  </label>
                  <input
                    type="number"
                    name="daysBefore"
                    required
                    min="0"
                    max="30"
                    defaultValue={editingReminder?.daysBefore || 1}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter 1 for day before, 0 for same day, etc.
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Custom Message (optional)
                  </label>
                  <textarea
                    name="message"
                    rows={3}
                    defaultValue={editingReminder?.message || ''}
                    placeholder="Leave blank for default message..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                >
                  {editingReminder ? 'Update Reminder' : 'Create Reminder'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingReminder(null);
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
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Notifications & Reminders
            </h1>
            <p className="text-sm md:text-base text-gray-600">
              Manage automated reminders for appointments
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/reminders/setup"
              className="bg-green-600 text-white px-4 py-2 rounded-md font-medium hover:bg-green-700 transition-colors"
            >
              Setup Guide
            </Link>
            <button
              onClick={() => {
                setEditingReminder(null);
                setShowForm(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors"
            >
              + Create Reminder
            </button>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setFilterSent('all')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                filterSent === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterSent('pending')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                filterSent === 'pending'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilterSent('sent')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                filterSent === 'sent'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Sent
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
            <p className="mt-4 text-gray-600">Loading reminders...</p>
          </div>
        ) : reminders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <p className="text-gray-600 mb-4">
              {filterSent === 'all' 
                ? 'No reminders set up yet.'
                : filterSent === 'pending'
                ? 'No pending reminders.'
                : 'No sent reminders.'}
            </p>
            <button
              onClick={() => {
                setEditingReminder(null);
                setShowForm(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors"
            >
              Create Your First Reminder
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {reminders.map((reminder: any) => {
              const job = reminder.job;
              const reminderDate = job ? calculateReminderDate(new Date(job.date), reminder.daysBefore) : null;
              const isPast = reminderDate ? reminderDate < new Date() : false;

              return (
                <div
                  key={reminder.id}
                  className={`bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow ${
                    reminder.sent ? 'opacity-75' : ''
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {reminder.type === 'customer' ? 'Customer' : 'Employee'} Reminder
                      </h3>
                      {job && (
                        <p className="text-sm text-gray-600 mt-1">
                          Job: {job.customerFirstName} {job.customerLastName} - {format(new Date(job.date), 'MMM d, yyyy')} at {job.startTime}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          reminder.sent
                            ? 'bg-green-100 text-green-800'
                            : isPast
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {reminder.sent ? 'Sent' : isPast ? 'Overdue' : 'Pending'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700 mb-4">
                    <div>
                      <p><strong>Method:</strong> {reminder.method.toUpperCase()}</p>
                      <p><strong>Type:</strong> {reminder.type === 'customer' ? 'Customer' : 'Employee'}</p>
                    </div>
                    <div>
                      <p><strong>Days Before:</strong> {reminder.daysBefore} day{reminder.daysBefore !== 1 ? 's' : ''}</p>
                      {reminderDate && (
                        <p><strong>Reminder Date:</strong> {format(reminderDate, 'MMM d, yyyy')}</p>
                      )}
                    </div>
                    {reminder.message && (
                      <div className="md:col-span-2">
                        <p><strong>Message:</strong></p>
                        <p className="text-gray-600">{reminder.message}</p>
                      </div>
                    )}
                    {reminder.sent && reminder.sentAt && (
                      <div className="md:col-span-2">
                        <p className="text-xs text-gray-500">
                          Sent: {format(new Date(reminder.sentAt), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {job && (
                      <Link
                        href={`/jobs/${job.id}`}
                        className="flex-1 bg-blue-600 text-white text-center py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        View Job
                      </Link>
                    )}
                    {!reminder.sent && (
                      <>
                        <button
                          onClick={() => {
                            setEditingReminder(reminder);
                            setShowForm(true);
                          }}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(reminder.id)}
                          className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors text-sm font-medium"
                        >
                          Delete
                        </button>
                      </>
                    )}
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

export default function RemindersPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <RemindersContent />
    </Suspense>
  );
}


