import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { format, addDays } from 'date-fns';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import TorqueSpecsDisplay from '@/components/TorqueSpecsDisplay';

export default async function JobDetailPage({ params }: { params: { id: string } }) {
  const job = await prisma.job.findUnique({
    where: { id: params.id },
    include: {
      employee: true,
      reminders: {
        orderBy: { daysBefore: 'asc' },
      },
    },
  });

  if (!job) {
    notFound();
  }

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    'in-progress': 'bg-blue-100 text-blue-800',
    'awaiting-parts': 'bg-orange-100 text-orange-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-4 md:py-8 max-w-4xl">
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start mb-4 md:mb-6 gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                {job.customerFirstName} {job.customerLastName}
              </h1>
              <p className="text-sm md:text-base text-gray-600">Job ID: {job.id}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs md:text-sm font-medium ${statusColors[job.status]}`}>
              {job.status.replace('-', ' ')}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div>
              <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">Schedule</h2>
              <div className="space-y-2 text-sm md:text-base text-gray-700">
                <p><strong>Date:</strong> {format(new Date(job.date), 'MMMM dd, yyyy')}</p>
                <p><strong>Start Time:</strong> {job.startTime}</p>
                {job.endTime && <p><strong>End Time:</strong> {job.endTime}</p>}
                {job.duration && <p><strong>Duration:</strong> {job.duration} minutes</p>}
                {job.employee && (
                  <p>
                    <strong>Assigned to:</strong>{' '}
                    <Link
                      href={`/employees/${job.employee.id}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {job.employee.firstName} {job.employee.lastName}
                    </Link>
                  </p>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer</h2>
              <div className="space-y-2 text-gray-700">
                <p><strong>Name:</strong> {job.customerFirstName} {job.customerLastName}</p>
                <p><strong>Phone:</strong> {job.customerPhone}</p>
                <p><strong>Address:</strong> {job.customerAddress}</p>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Vehicle</h2>
              <p className="text-gray-700">{job.vehicleInfo}</p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Service</h2>
              <p className="text-gray-700">{job.serviceType}</p>
              {job.price && (
                <p className="text-gray-700 mt-2">
                  <strong>Price:</strong> ${job.price.toFixed(2)}
                </p>
              )}
              {job.urgent && (
                <p className="text-red-600 font-medium mt-2 flex items-center gap-2">
                  <span>⚠️</span> Urgent Job
                </p>
              )}
            </div>
          </div>

          {/* Torque Specifications Section */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <TorqueSpecsDisplay jobId={job.id} />
          </div>

          {/* Reminders Section */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Reminders</h2>
              <Link
                href={`/reminders?jobId=${job.id}`}
                className="text-blue-600 hover:text-blue-800 font-medium text-sm"
              >
                + Add Reminder
              </Link>
            </div>
            {job.reminders.length === 0 ? (
              <p className="text-gray-600 text-sm mb-4">No reminders set up for this job.</p>
            ) : (
              <div className="space-y-3">
                {job.reminders.map((reminder) => {
                  const reminderDate = addDays(new Date(job.date), -reminder.daysBefore);
                  const isPast = reminderDate < new Date();
                  
                  return (
                    <div
                      key={reminder.id}
                      className={`p-3 rounded-lg border ${
                        reminder.sent
                          ? 'bg-green-50 border-green-200'
                          : isPast
                          ? 'bg-yellow-50 border-yellow-200'
                          : 'bg-blue-50 border-blue-200'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900">
                              {reminder.type === 'customer' ? 'Customer' : 'Employee'} Reminder
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              reminder.sent
                                ? 'bg-green-100 text-green-800'
                                : isPast
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {reminder.sent ? 'Sent' : isPast ? 'Overdue' : 'Pending'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">
                            {reminder.daysBefore} day{reminder.daysBefore !== 1 ? 's' : ''} before appointment
                            {' • '}
                            {format(reminderDate, 'MMM d, yyyy')}
                            {' • '}
                            {reminder.method.toUpperCase()}
                          </p>
                          {reminder.message && (
                            <p className="text-xs text-gray-600 mt-1">{reminder.message}</p>
                          )}
                          {reminder.sent && reminder.sentAt && (
                            <p className="text-xs text-gray-500 mt-1">
                              Sent: {format(new Date(reminder.sentAt), 'MMM d, yyyy h:mm a')}
                            </p>
                          )}
                        </div>
                        <Link
                          href={`/reminders`}
                          className="text-blue-600 hover:text-blue-800 text-sm ml-2"
                        >
                          Manage
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="mt-4">
              <Link
                href={`/reminders?jobId=${job.id}`}
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Create Reminder
              </Link>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex flex-wrap gap-3">
              {job.status === 'completed' && (
                <Link
                  href={`/invoices/new?jobId=${job.id}`}
                  className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  Create Invoice
                </Link>
              )}
              <Link
                href="/jobs"
                className="text-blue-600 hover:text-blue-800 font-medium text-sm"
              >
                ← Back to Jobs
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}




