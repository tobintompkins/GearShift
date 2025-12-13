import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { format } from 'date-fns';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import JobCard from '@/components/JobCard';

export default async function CustomerDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const customer = await prisma.customer.findUnique({
    where: { id: params.id },
    include: {
      vehicles: {
        orderBy: { createdAt: 'desc' },
      },
      jobs: {
        include: {
          employee: true,
          vehicle: true,
        },
        orderBy: [
          { date: 'desc' },
          { startTime: 'desc' },
        ],
      },
    },
  });

  if (!customer) {
    notFound();
  }

  const upcomingJobs = customer.jobs.filter(
    (job) => new Date(job.date) >= new Date()
  );
  const pastJobs = customer.jobs.filter(
    (job) => new Date(job.date) < new Date()
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-4 md:py-8">
        <div className="mb-4 md:mb-6">
          <Link
            href="/customers"
            className="text-blue-600 hover:text-blue-800 mb-4 inline-block text-sm md:text-base"
          >
            ← Back to Customers
          </Link>
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-4 md:mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              {customer.firstName} {customer.lastName}
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm md:text-base text-gray-700">
              <div>
                <p><strong>Phone:</strong> {customer.phone}</p>
                {customer.email && <p className="mt-1"><strong>Email:</strong> {customer.email}</p>}
              </div>
              <div>
                {customer.address && (
                  <p><strong>Address:</strong> {customer.address}</p>
                )}
                <p className="text-xs md:text-sm text-gray-500 mt-2">
                  Customer since: {format(new Date(customer.createdAt), 'MMM d, yyyy')}
                </p>
              </div>
            </div>
            {customer.notes && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="font-medium mb-2"><strong>Notes:</strong></p>
                <p className="text-sm md:text-base text-gray-700 whitespace-pre-wrap">{customer.notes}</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
                Vehicles ({customer.vehicles.length})
              </h2>
              <Link
                href={`/customers/${customer.id}/vehicles/new`}
                className="bg-blue-600 text-white px-3 md:px-4 py-1.5 md:py-2 rounded-md text-xs md:text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                + Add Vehicle
              </Link>
            </div>
            {customer.vehicles.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <p className="text-gray-600 mb-4">No vehicles registered yet.</p>
                <Link
                  href={`/customers/${customer.id}/vehicles/new`}
                  className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors"
                >
                  Add Vehicle
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {customer.vehicles.map((vehicle) => (
                  <Link
                    key={vehicle.id}
                    href={`/vehicles/${vehicle.id}`}
                    className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow block"
                  >
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {vehicle.year && `${vehicle.year} `}
                      {vehicle.make} {vehicle.model}
                    </h3>
                    <div className="space-y-1 text-sm text-gray-700">
                      {vehicle.engine && (
                        <p><strong>Engine:</strong> {vehicle.engine}</p>
                      )}
                      {vehicle.mileage && (
                        <p><strong>Mileage:</strong> {vehicle.mileage.toLocaleString()} mi</p>
                      )}
                      {vehicle.licensePlate && (
                        <p><strong>License Plate:</strong> {vehicle.licensePlate}</p>
                      )}
                      {vehicle.vin && (
                        <p><strong>VIN:</strong> <span className="font-mono text-xs">{vehicle.vin}</span></p>
                      )}
                      {vehicle.color && <p><strong>Color:</strong> {vehicle.color}</p>}
                      {vehicle.notes && (
                        <p className="text-xs text-gray-600 mt-2 line-clamp-2">{vehicle.notes}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
                Job History ({customer.jobs.length})
              </h2>
              <Link
                href={`/jobs/new?customerId=${customer.id}`}
                className="bg-blue-600 text-white px-3 md:px-4 py-1.5 md:py-2 rounded-md text-xs md:text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                + New Job
              </Link>
            </div>
            {customer.jobs.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <p className="text-gray-600 mb-4">No jobs yet for this customer.</p>
                <Link
                  href={`/jobs/new?customerId=${customer.id}`}
                  className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors"
                >
                  Create Job
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {customer.jobs.slice(0, 5).map((job) => (
                  <JobCard key={job.id} job={job as any} />
                ))}
                {customer.jobs.length > 5 && (
                  <Link
                    href={`/customers/${customer.id}/jobs`}
                    className="block text-center text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View all {customer.jobs.length} jobs →
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        {upcomingJobs.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Upcoming Jobs ({upcomingJobs.length})
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
              Past Jobs ({pastJobs.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pastJobs.map((job) => (
                <JobCard key={job.id} job={job as any} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}


