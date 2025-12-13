import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { prisma } from '@/lib/db';
import JobCard from '@/components/JobCard';
import { JobStatus } from '@/lib/types';
import { format } from 'date-fns';

const statusConfig: Record<JobStatus, { label: string; color: string; bgColor: string; textColor: string }> = {
  pending: {
    label: 'Pending',
    color: 'yellow',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-800',
  },
  'in-progress': {
    label: 'In Progress',
    color: 'blue',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-800',
  },
  'awaiting-parts': {
    label: 'Awaiting Parts',
    color: 'orange',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-800',
  },
  completed: {
    label: 'Completed',
    color: 'green',
    bgColor: 'bg-green-50',
    textColor: 'text-green-800',
  },
  cancelled: {
    label: 'Cancelled',
    color: 'red',
    bgColor: 'bg-red-50',
    textColor: 'text-red-800',
  },
};

export default async function StatusTrackingPage() {
  const allJobs = await prisma.job.findMany({
    include: {
      employee: true,
      customer: true,
      vehicle: true,
    },
    orderBy: [
      { date: 'asc' },
      { startTime: 'asc' },
    ],
  });

  // Group jobs by status
  const jobsByStatus = allJobs.reduce((acc, job) => {
    const status = job.status as JobStatus;
    if (!acc[status]) {
      acc[status] = [];
    }
    acc[status].push(job);
    return acc;
  }, {} as Record<JobStatus, typeof allJobs>);

  // Calculate statistics
  const stats = {
    total: allJobs.length,
    pending: jobsByStatus.pending?.length || 0,
    inProgress: jobsByStatus['in-progress']?.length || 0,
    awaitingParts: jobsByStatus['awaiting-parts']?.length || 0,
    completed: jobsByStatus.completed?.length || 0,
    cancelled: jobsByStatus.cancelled?.length || 0,
  };

  const statusOrder: JobStatus[] = ['pending', 'in-progress', 'awaiting-parts', 'completed', 'cancelled'];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-4 md:py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Job Status Tracking
          </h1>
          <p className="text-gray-600">
            Track and manage jobs by their current status
          </p>
        </div>

        {/* Statistics Overview */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Jobs</div>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow-md p-4 border-l-4 border-yellow-500">
            <div className="text-2xl font-bold text-yellow-800">{stats.pending}</div>
            <div className="text-sm text-yellow-600">Pending</div>
          </div>
          <div className="bg-blue-50 rounded-lg shadow-md p-4 border-l-4 border-blue-500">
            <div className="text-2xl font-bold text-blue-800">{stats.inProgress}</div>
            <div className="text-sm text-blue-600">In Progress</div>
          </div>
          <div className="bg-orange-50 rounded-lg shadow-md p-4 border-l-4 border-orange-500">
            <div className="text-2xl font-bold text-orange-800">{stats.awaitingParts}</div>
            <div className="text-sm text-orange-600">Awaiting Parts</div>
          </div>
          <div className="bg-green-50 rounded-lg shadow-md p-4 border-l-4 border-green-500">
            <div className="text-2xl font-bold text-green-800">{stats.completed}</div>
            <div className="text-sm text-green-600">Completed</div>
          </div>
          <div className="bg-red-50 rounded-lg shadow-md p-4 border-l-4 border-red-500">
            <div className="text-2xl font-bold text-red-800">{stats.cancelled}</div>
            <div className="text-sm text-red-600">Cancelled</div>
          </div>
        </div>

        {/* Jobs by Status */}
        <div className="space-y-8">
          {statusOrder.map((status) => {
            const jobs = jobsByStatus[status] || [];
            const config = statusConfig[status];

            if (jobs.length === 0) {
              return null;
            }

            return (
              <div key={status} className={`${config.bgColor} rounded-lg shadow-md p-6`}>
                <div className="flex justify-between items-center mb-4">
                  <h2 className={`text-2xl font-semibold ${config.textColor}`}>
                    {config.label}
                    <span className="ml-2 text-lg font-normal">
                      ({jobs.length})
                    </span>
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {jobs.map((job) => (
                    <div key={job.id} className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
                      <JobCard job={job as any} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {allJobs.length === 0 && (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <p className="text-gray-600 mb-4">No jobs found.</p>
            <Link
              href="/jobs/new"
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors"
            >
              Create Your First Job
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}


