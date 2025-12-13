import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { format } from 'date-fns';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import JobCard from '@/components/JobCard';

export default async function EmployeeSchedulePage({
  params,
}: {
  params: { id: string };
}) {
  const employee = await prisma.employee.findUnique({
    where: { id: params.id },
    include: {
      jobs: {
        include: {
          customer: true,
          vehicle: true,
        },
        orderBy: [
          { date: 'asc' },
          { startTime: 'asc' },
        ],
      },
    },
  });

  if (!employee) {
    notFound();
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const upcomingJobs = employee.jobs.filter(
    (job) => new Date(job.date) >= today
  );
  const pastJobs = employee.jobs.filter(
    (job) => new Date(job.date) < today
  );

  // Get jobs for the next 7 days for availability view
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const weekJobs = employee.jobs.filter(
    (job) => {
      const jobDate = new Date(job.date);
      return jobDate >= today && jobDate <= nextWeek;
    }
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-4 md:py-8">
        <div className="mb-6">
          <Link
            href="/employees"
            className="text-blue-600 hover:text-blue-800 mb-4 inline-block text-sm md:text-base"
          >
            ← Back to Employees
          </Link>
          
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Photo Section */}
              <div className="flex-shrink-0">
                {employee.photo ? (
                  <img
                    src={employee.photo}
                    alt={`${employee.firstName} ${employee.lastName}`}
                    className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-blue-200"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      const fallback = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div
                  className={`w-24 h-24 md:w-32 md:h-32 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-2xl md:text-3xl ${employee.photo ? 'hidden' : ''}`}
                >
                  {employee.firstName[0]}{employee.lastName[0]}
                </div>
              </div>

              {/* Employee Info */}
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                  {employee.firstName} {employee.lastName}
                </h1>
                
                <div className="space-y-2 text-sm md:text-base text-gray-700 mb-4">
                  {employee.email && (
                    <p>
                      <strong>Email:</strong>{' '}
                      <a href={`mailto:${employee.email}`} className="text-blue-600 hover:underline">
                        {employee.email}
                      </a>
                    </p>
                  )}
                  {employee.phone && (
                    <p>
                      <strong>Phone:</strong>{' '}
                      <a href={`tel:${employee.phone}`} className="text-blue-600 hover:underline">
                        {employee.phone}
                      </a>
                    </p>
                  )}
                  {employee.skills && (
                    <div>
                      <strong>Skills:</strong>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {employee.skills.split(',').map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs md:text-sm font-medium"
                          >
                            {skill.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs md:text-sm font-medium ${
                      employee.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {employee.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <Link
                    href="/employees"
                    className="text-blue-600 hover:text-blue-800 text-sm md:text-base font-medium"
                  >
                    Edit Profile
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-md p-4 text-center">
              <div className="text-2xl md:text-3xl font-bold text-blue-600">{upcomingJobs.length}</div>
              <div className="text-xs md:text-sm text-gray-600 mt-1">Upcoming Jobs</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4 text-center">
              <div className="text-2xl md:text-3xl font-bold text-green-600">{pastJobs.length}</div>
              <div className="text-xs md:text-sm text-gray-600 mt-1">Past Jobs</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4 text-center">
              <div className="text-2xl md:text-3xl font-bold text-purple-600">{weekJobs.length}</div>
              <div className="text-xs md:text-sm text-gray-600 mt-1">This Week</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4 text-center">
              <div className="text-2xl md:text-3xl font-bold text-orange-600">{employee.jobs.length}</div>
              <div className="text-xs md:text-sm text-gray-600 mt-1">Total Jobs</div>
            </div>
          </div>
        </div>

        {/* This Week's Schedule */}
        {weekJobs.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-4">
              This Week's Schedule ({weekJobs.length} jobs)
            </h2>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {weekJobs.map((job) => (
                      <tr key={job.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          {format(new Date(job.date), 'MMM d, yyyy')}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {job.startTime}
                          {job.endTime && ` - ${job.endTime}`}
                        </td>
                        <td className="px-4 py-3">
                          {job.customer ? (
                            <Link href={`/customers/${job.customer.id}`} className="text-blue-600 hover:underline">
                              {job.customerFirstName} {job.customerLastName}
                            </Link>
                          ) : (
                            `${job.customerFirstName} ${job.customerLastName}`
                          )}
                        </td>
                        <td className="px-4 py-3">{job.serviceType}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              job.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : job.status === 'in-progress'
                                ? 'bg-blue-100 text-blue-800'
                                : job.status === 'awaiting-parts'
                                ? 'bg-orange-100 text-orange-800'
                                : job.status === 'cancelled'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {job.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {upcomingJobs.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-4">
              All Upcoming Jobs ({upcomingJobs.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingJobs.map((job) => (
                <JobCard key={job.id} job={job as any} />
              ))}
            </div>
          </div>
        )}

        {pastJobs.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Recent Jobs ({pastJobs.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pastJobs.map((job) => (
                <JobCard key={job.id} job={job as any} />
              ))}
            </div>
          </div>
        )}

        {employee.jobs.length === 0 && (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <p className="text-gray-600">
              No jobs assigned to {employee.firstName} {employee.lastName} yet.
            </p>
            <Link
              href="/jobs/new"
              className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors"
            >
              Create a Job
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}


