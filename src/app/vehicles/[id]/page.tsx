import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { format } from 'date-fns';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import JobCard from '@/components/JobCard';

export default async function VehicleDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: params.id },
    include: {
      customer: true,
      jobs: {
        include: {
          employee: true,
        },
        orderBy: { date: 'desc' },
      },
    },
  });

  if (!vehicle) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-4 md:py-8 max-w-6xl">
        <div className="mb-4 md:mb-6">
          <Link
            href="/vehicles"
            className="text-blue-600 hover:text-blue-800 mb-4 inline-block text-sm md:text-base"
          >
            ← Back to Vehicles
          </Link>
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-4 md:mb-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                  {vehicle.year && `${vehicle.year} `}
                  {vehicle.make} {vehicle.model}
                </h1>
                <Link
                  href={`/customers/${vehicle.customerId}`}
                  className="text-blue-600 hover:text-blue-800 text-sm md:text-base"
                >
                  Owner: {vehicle.customer.firstName} {vehicle.customer.lastName}
                </Link>
              </div>
              <Link
                href={`/vehicles/${vehicle.id}/edit`}
                className="bg-gray-200 text-gray-700 px-3 md:px-4 py-1.5 md:py-2 rounded-md text-xs md:text-sm font-medium hover:bg-gray-300 transition-colors"
              >
                Edit
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm md:text-base">
              <div>
                <p className="text-gray-600 mb-1"><strong>Year:</strong></p>
                <p className="text-gray-900">{vehicle.year || '—'}</p>
              </div>
              <div>
                <p className="text-gray-600 mb-1"><strong>Make:</strong></p>
                <p className="text-gray-900">{vehicle.make}</p>
              </div>
              <div>
                <p className="text-gray-600 mb-1"><strong>Model:</strong></p>
                <p className="text-gray-900">{vehicle.model}</p>
              </div>
              <div>
                <p className="text-gray-600 mb-1"><strong>Engine:</strong></p>
                <p className="text-gray-900">{vehicle.engine || '—'}</p>
              </div>
              <div>
                <p className="text-gray-600 mb-1"><strong>Mileage:</strong></p>
                <p className="text-gray-900">
                  {vehicle.mileage ? `${vehicle.mileage.toLocaleString()} mi` : '—'}
                </p>
              </div>
              <div>
                <p className="text-gray-600 mb-1"><strong>License Plate:</strong></p>
                <p className="text-gray-900">{vehicle.licensePlate || '—'}</p>
              </div>
              <div>
                <p className="text-gray-600 mb-1"><strong>VIN:</strong></p>
                <p className="text-gray-900 font-mono text-xs md:text-sm">
                  {vehicle.vin || '—'}
                </p>
              </div>
              {vehicle.color && (
                <div>
                  <p className="text-gray-600 mb-1"><strong>Color:</strong></p>
                  <p className="text-gray-900">{vehicle.color}</p>
                </div>
              )}
              <div>
                <p className="text-gray-600 mb-1"><strong>Jobs:</strong></p>
                <p className="text-gray-900">{vehicle.jobs.length}</p>
              </div>
            </div>

            {vehicle.notes && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="font-medium mb-2"><strong>Notes:</strong></p>
                <p className="text-sm md:text-base text-gray-700 whitespace-pre-wrap">{vehicle.notes}</p>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Added: {format(new Date(vehicle.createdAt), 'MMM d, yyyy')}
                {vehicle.updatedAt.getTime() !== vehicle.createdAt.getTime() && (
                  <> • Updated: {format(new Date(vehicle.updatedAt), 'MMM d, yyyy')}</>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-4 md:mb-6 flex justify-between items-center">
          <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
            Job History ({vehicle.jobs.length})
          </h2>
          <Link
            href={`/jobs/new?customerId=${vehicle.customerId}&vehicleId=${vehicle.id}`}
            className="bg-blue-600 text-white px-3 md:px-4 py-1.5 md:py-2 rounded-md text-xs md:text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            + New Job
          </Link>
        </div>

        {vehicle.jobs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6 md:p-12 text-center">
            <p className="text-gray-600 mb-4">No jobs yet for this vehicle.</p>
            <Link
              href={`/jobs/new?customerId=${vehicle.customerId}&vehicleId=${vehicle.id}`}
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors"
            >
              Create Job
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vehicle.jobs.map((job) => (
              <JobCard key={job.id} job={job as any} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}


