import { prisma } from '@/lib/db';
import Navigation from '@/components/Navigation';
import Link from 'next/link';
import { format } from 'date-fns';

export default async function VehiclesPage() {
  const vehicles = await prisma.vehicle.findMany({
    include: {
      customer: true,
      _count: {
        select: {
          jobs: true,
        },
      },
    },
    orderBy: [
      { customer: { lastName: 'asc' } },
      { customer: { firstName: 'asc' } },
      { make: 'asc' },
      { model: 'asc' },
    ],
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-4 md:py-8">
        <div className="mb-4 md:mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Vehicle Tracking</h1>
          <p className="text-sm md:text-base text-gray-600">
            Track all vehicles for your customers with detailed information
          </p>
        </div>

        {vehicles.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <p className="text-gray-600 mb-4">No vehicles registered yet.</p>
            <Link
              href="/customers"
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors"
            >
              Add Customer & Vehicle
            </Link>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block bg-white rounded-lg shadow-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Year
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Make
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Model
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Engine
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mileage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      License Plate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      VIN
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Jobs
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {vehicles.map((vehicle) => (
                    <tr key={vehicle.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/customers/${vehicle.customerId}`}
                          className="text-sm font-medium text-blue-600 hover:text-blue-800"
                        >
                          {vehicle.customer.firstName} {vehicle.customer.lastName}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{vehicle.year || '—'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{vehicle.make}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{vehicle.model}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{vehicle.engine || '—'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {vehicle.mileage ? `${vehicle.mileage.toLocaleString()} mi` : '—'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{vehicle.licensePlate || '—'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 font-mono text-xs">
                          {vehicle.vin || '—'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{vehicle._count.jobs}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/vehicles/${vehicle.id}`}
                          className="text-blue-600 hover:text-blue-800 mr-4"
                        >
                          View
                        </Link>
                        <Link
                          href={`/customers/${vehicle.customerId}`}
                          className="text-gray-600 hover:text-gray-800"
                        >
                          Customer
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-4">
              {vehicles.map((vehicle) => (
                <div
                  key={vehicle.id}
                  className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
                >
                  <div className="mb-3">
                    <Link href={`/customers/${vehicle.customerId}`}>
                      <h3 className="text-sm font-medium text-blue-600 hover:text-blue-800 mb-2">
                        {vehicle.customer.firstName} {vehicle.customer.lastName}
                      </h3>
                    </Link>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      {vehicle.year && `${vehicle.year} `}
                      {vehicle.make} {vehicle.model}
                    </h4>
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
                      {vehicle.color && (
                        <p><strong>Color:</strong> {vehicle.color}</p>
                      )}
                      <p className="text-xs text-gray-500 pt-1">
                        {vehicle._count.jobs} job{vehicle._count.jobs !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-3 border-t border-gray-200">
                    <Link
                      href={`/vehicles/${vehicle.id}`}
                      className="flex-1 bg-blue-600 text-white text-center py-2 px-3 rounded-md hover:bg-blue-700 transition-colors text-xs font-medium"
                    >
                      View Details
                    </Link>
                    <Link
                      href={`/customers/${vehicle.customerId}`}
                      className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors text-xs font-medium"
                    >
                      Customer
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}


