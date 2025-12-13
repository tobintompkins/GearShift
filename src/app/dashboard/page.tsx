import { prisma } from '@/lib/db';
import Navigation from '@/components/Navigation';
import Link from 'next/link';
import { format, startOfToday, endOfToday, isAfter, isBefore, startOfWeek, endOfWeek } from 'date-fns';
import { Job } from '@/lib/types';

export default async function DashboardPage() {
  const today = startOfToday();
  const todayEnd = endOfToday();
  const weekStart = startOfWeek(today, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 0 });

  // Fetch all necessary data
  const [
    todaysJobs,
    upcomingJobs,
    awaitingPartsJobs,
    urgentJobs,
    completedJobsThisMonth,
    employees,
  ] = await Promise.all([
    // Today's jobs
    prisma.job.findMany({
      where: {
        date: {
          gte: today,
          lte: todayEnd,
        },
        status: {
          not: 'cancelled',
        },
      },
      include: {
        employee: true,
        customer: true,
      },
      orderBy: { startTime: 'asc' },
    }),
    // Upcoming jobs (next 7 days, excluding today)
    prisma.job.findMany({
      where: {
        date: {
          gt: todayEnd,
          lte: weekEnd,
        },
        status: {
          not: 'cancelled',
        },
      },
      include: {
        employee: true,
        customer: true,
      },
      orderBy: { date: 'asc' },
      take: 10,
    }),
    // Jobs waiting for parts
    prisma.job.findMany({
      where: {
        status: 'awaiting-parts',
      },
      include: {
        employee: true,
        customer: true,
      },
      orderBy: { date: 'asc' },
    }),
    // Urgent jobs
    prisma.job.findMany({
      where: {
        urgent: true,
        status: {
          not: 'cancelled',
        },
      },
      include: {
        employee: true,
        customer: true,
      },
      orderBy: { date: 'asc' },
    }),
    // Completed jobs this month for revenue
    prisma.job.findMany({
      where: {
        status: 'completed',
        date: {
          gte: new Date(today.getFullYear(), today.getMonth(), 1),
        },
        price: {
          not: null,
        },
      },
      select: {
        price: true,
      },
    }),
    // All active employees
    prisma.employee.findMany({
      where: {
        isActive: true,
      },
      include: {
        jobs: {
          where: {
            status: {
              in: ['pending', 'in-progress'],
            },
            date: {
              gte: today,
            },
          },
          orderBy: { date: 'asc' },
          take: 5,
        },
      },
    }),
  ]);

  // Calculate revenue
  const totalRevenue = completedJobsThisMonth.reduce((sum, job) => sum + (job.price || 0), 0);
  const completedCount = completedJobsThisMonth.length;
  const averageRevenue = completedCount > 0 ? totalRevenue / completedCount : 0;

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
      <main className="container mx-auto px-4 py-4 md:py-8">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-sm md:text-base text-gray-600">Overview of your mobile mechanic business</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-sm text-gray-600 mb-1">Today's Jobs</div>
            <div className="text-2xl font-bold text-gray-900">{todaysJobs.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-sm text-gray-600 mb-1">Upcoming (7 days)</div>
            <div className="text-2xl font-bold text-gray-900">{upcomingJobs.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-sm text-gray-600 mb-1">Awaiting Parts</div>
            <div className="text-2xl font-bold text-orange-600">{awaitingPartsJobs.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <Link href="/urgent-jobs" className="text-sm text-gray-600 mb-1 hover:text-red-600">Urgent Jobs</Link>
            <div className="text-2xl font-bold text-red-600">{urgentJobs.length}</div>
          </div>
        </div>

        {/* Revenue Summary */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Revenue Summary (This Month)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-600 mb-1">Total Revenue</div>
              <div className="text-2xl font-bold text-green-600">${totalRevenue.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Completed Jobs</div>
              <div className="text-2xl font-bold text-gray-900">{completedCount}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Average per Job</div>
              <div className="text-2xl font-bold text-gray-900">${averageRevenue.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            <Link
              href="/jobs/new"
              className="bg-blue-600 text-white px-4 py-3 rounded-md font-medium hover:bg-blue-700 transition-colors text-center text-sm md:text-base"
            >
              + New Job
            </Link>
            <Link
              href="/calendar"
              className="bg-gray-200 text-gray-700 px-4 py-3 rounded-md font-medium hover:bg-gray-300 transition-colors text-center text-sm md:text-base"
            >
              View Calendar
            </Link>
            <Link
              href="/map"
              className="bg-blue-100 text-blue-700 px-4 py-3 rounded-md font-medium hover:bg-blue-200 transition-colors text-center text-sm md:text-base border border-blue-300"
            >
              🗺️ Job Map
            </Link>
            <Link
              href="/customers"
              className="bg-gray-200 text-gray-700 px-4 py-3 rounded-md font-medium hover:bg-gray-300 transition-colors text-center text-sm md:text-base"
            >
              Customers
            </Link>
            <Link
              href="/services"
              className="bg-gray-200 text-gray-700 px-4 py-3 rounded-md font-medium hover:bg-gray-300 transition-colors text-center text-sm md:text-base"
            >
              Services
            </Link>
            <Link
              href="/part-orders"
              className="bg-orange-100 text-orange-700 px-4 py-3 rounded-md font-medium hover:bg-orange-200 transition-colors text-center text-sm md:text-base border border-orange-300"
            >
              📦 Part Orders
            </Link>
            <Link
              href="/tools"
              className="bg-purple-100 text-purple-700 px-4 py-3 rounded-md font-medium hover:bg-purple-200 transition-colors text-center text-sm md:text-base border border-purple-300"
            >
              🛠️ Tools
            </Link>
            <Link
              href="/messages"
              className="bg-green-100 text-green-700 px-4 py-3 rounded-md font-medium hover:bg-green-200 transition-colors text-center text-sm md:text-base border border-green-300"
            >
              💬 Messages
            </Link>
            <Link
              href="/maintenance"
              className="bg-indigo-100 text-indigo-700 px-4 py-3 rounded-md font-medium hover:bg-indigo-200 transition-colors text-center text-sm md:text-base border border-indigo-300"
            >
              🔧 Maintenance
            </Link>
            <Link
              href="/vin-lookup"
              className="bg-teal-100 text-teal-700 px-4 py-3 rounded-md font-medium hover:bg-teal-200 transition-colors text-center text-sm md:text-base border border-teal-300"
            >
              🔍 VIN Lookup
            </Link>
            <Link
              href="/photos"
              className="bg-pink-100 text-pink-700 px-4 py-3 rounded-md font-medium hover:bg-pink-200 transition-colors text-center text-sm md:text-base border border-pink-300"
            >
              📸 Photos
            </Link>
            <Link
              href="/checklist"
              className="bg-emerald-100 text-emerald-700 px-4 py-3 rounded-md font-medium hover:bg-emerald-200 transition-colors text-center text-sm md:text-base border border-emerald-300"
            >
              ✅ Checklist
            </Link>
            <Link
              href="/performance"
              className="bg-cyan-100 text-cyan-700 px-4 py-3 rounded-md font-medium hover:bg-cyan-200 transition-colors text-center text-sm md:text-base border border-cyan-300"
            >
              📊 Performance
            </Link>
            <Link
              href="/payroll"
              className="bg-teal-100 text-teal-700 px-4 py-3 rounded-md font-medium hover:bg-teal-200 transition-colors text-center text-sm md:text-base border border-teal-300"
            >
              ⏰ Payroll
            </Link>
            <Link
              href="/reminders-customers"
              className="bg-amber-100 text-amber-700 px-4 py-3 rounded-md font-medium hover:bg-amber-200 transition-colors text-center text-sm md:text-base border border-amber-300"
            >
              🔔 Reminders
            </Link>
            <Link
              href="/analytics"
              className="bg-indigo-100 text-indigo-700 px-4 py-3 rounded-md font-medium hover:bg-indigo-200 transition-colors text-center text-sm md:text-base border border-indigo-300"
            >
              📈 Analytics
            </Link>
            <Link
              href="/diagnostics"
              className="bg-violet-100 text-violet-700 px-4 py-3 rounded-md font-medium hover:bg-violet-200 transition-colors text-center text-sm md:text-base border border-violet-300"
            >
              🔌 Diagnostics
            </Link>
            <Link
              href="/torque-specs"
              className="bg-slate-100 text-slate-700 px-4 py-3 rounded-md font-medium hover:bg-slate-200 transition-colors text-center text-sm md:text-base border border-slate-300"
            >
              🔩 Torque Specs
            </Link>
            <Link
              href="/maintenance-intervals"
              className="bg-rose-100 text-rose-700 px-4 py-3 rounded-md font-medium hover:bg-rose-200 transition-colors text-center text-sm md:text-base border border-rose-300"
            >
              ⏱️ Intervals
            </Link>
            <Link
              href="/inspections"
              className="bg-blue-100 text-blue-700 px-4 py-3 rounded-md font-medium hover:bg-blue-200 transition-colors text-center text-sm md:text-base border border-blue-300"
            >
              📋 Inspections
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Jobs */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Today's Jobs</h2>
              <Link href="/calendar" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                View All
              </Link>
            </div>
            {todaysJobs.length === 0 ? (
              <p className="text-gray-500 text-sm">No jobs scheduled for today</p>
            ) : (
              <div className="space-y-3">
                {todaysJobs.map((job) => (
                  <Link
                    key={job.id}
                    href={`/jobs/${job.id}`}
                    className="block p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {job.customerFirstName} {job.customerLastName}
                        </div>
                        <div className="text-sm text-gray-600">
                          {job.startTime} {job.endTime && `- ${job.endTime}`}
                        </div>
                        <div className="text-sm text-gray-600 truncate">{job.serviceType}</div>
                        {job.employee && (
                          <div className="text-xs text-gray-500 mt-1">
                            👤 {job.employee.firstName} {job.employee.lastName}
                          </div>
                        )}
                      </div>
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${statusColors[job.status as keyof typeof statusColors]}`}>
                        {job.status.replace('-', ' ')}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Jobs */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Upcoming Jobs</h2>
              <Link href="/calendar" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                View All
              </Link>
            </div>
            {upcomingJobs.length === 0 ? (
              <p className="text-gray-500 text-sm">No upcoming jobs</p>
            ) : (
              <div className="space-y-3">
                {upcomingJobs.map((job) => (
                  <Link
                    key={job.id}
                    href={`/jobs/${job.id}`}
                    className="block p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {job.customerFirstName} {job.customerLastName}
                        </div>
                        <div className="text-sm text-gray-600">
                          {format(new Date(job.date), 'MMM d')} at {job.startTime}
                        </div>
                        <div className="text-sm text-gray-600 truncate">{job.serviceType}</div>
                        {job.employee && (
                          <div className="text-xs text-gray-500 mt-1">
                            👤 {job.employee.firstName} {job.employee.lastName}
                          </div>
                        )}
                      </div>
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${statusColors[job.status as keyof typeof statusColors]}`}>
                        {job.status.replace('-', ' ')}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Jobs Waiting for Parts */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Awaiting Parts</h2>
              <Link href="/status" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                View All
              </Link>
            </div>
            {awaitingPartsJobs.length === 0 ? (
              <p className="text-gray-500 text-sm">No jobs waiting for parts</p>
            ) : (
              <div className="space-y-3">
                {awaitingPartsJobs.map((job) => (
                  <Link
                    key={job.id}
                    href={`/jobs/${job.id}`}
                    className="block p-3 border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {job.customerFirstName} {job.customerLastName}
                        </div>
                        <div className="text-sm text-gray-600">
                          {format(new Date(job.date), 'MMM d, yyyy')} at {job.startTime}
                        </div>
                        <div className="text-sm text-gray-600 truncate">{job.serviceType}</div>
                        {job.employee && (
                          <div className="text-xs text-gray-500 mt-1">
                            👤 {job.employee.firstName} {job.employee.lastName}
                          </div>
                        )}
                      </div>
                      <span className="ml-2 px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 bg-orange-100 text-orange-800">
                        Awaiting Parts
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Urgent Jobs */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <div className="flex justify-between items-center mb-4">
              <Link href="/urgent-jobs" className="text-xl font-semibold text-gray-900 hover:text-red-600">
                Urgent Jobs
              </Link>
              <Link href="/urgent-jobs" className="text-red-600 hover:text-red-800 text-sm font-medium">
                View All
              </Link>
            </div>
            {urgentJobs.length === 0 ? (
              <p className="text-gray-500 text-sm">No urgent jobs</p>
            ) : (
              <div className="space-y-3">
                {urgentJobs.map((job) => (
                  <Link
                    key={job.id}
                    href={`/jobs/${job.id}`}
                    className="block p-3 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate flex items-center gap-2">
                          <span className="text-red-600">⚠️</span>
                          {job.customerFirstName} {job.customerLastName}
                        </div>
                        <div className="text-sm text-gray-600">
                          {format(new Date(job.date), 'MMM d, yyyy')} at {job.startTime}
                        </div>
                        <div className="text-sm text-gray-600 truncate">{job.serviceType}</div>
                        {job.employee && (
                          <div className="text-xs text-gray-500 mt-1">
                            👤 {job.employee.firstName} {job.employee.lastName}
                          </div>
                        )}
                      </div>
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${statusColors[job.status as keyof typeof statusColors]}`}>
                        {job.status.replace('-', ' ')}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Employee Tasks */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mt-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Employee Tasks</h2>
          {employees.length === 0 ? (
            <p className="text-gray-500 text-sm">No active employees</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {employees.map((employee) => (
                <div key={employee.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {employee.firstName} {employee.lastName}
                      </h3>
                      <Link
                        href={`/employees/${employee.id}`}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        View Schedule →
                      </Link>
                    </div>
                  </div>
                  {employee.jobs.length === 0 ? (
                    <p className="text-sm text-gray-500">No upcoming tasks</p>
                  ) : (
                    <div className="space-y-2">
                      {employee.jobs.map((job) => (
                        <Link
                          key={job.id}
                          href={`/jobs/${job.id}`}
                          className="block text-sm p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                        >
                          <div className="font-medium text-gray-900 truncate">
                            {job.customerFirstName} {job.customerLastName}
                          </div>
                          <div className="text-xs text-gray-600">
                            {format(new Date(job.date), 'MMM d')} at {job.startTime}
                          </div>
                          <div className="text-xs text-gray-600 truncate">{job.serviceType}</div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}


