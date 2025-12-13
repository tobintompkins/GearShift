'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { ServiceTemplate } from '@/lib/types';

export default function ServiceMenuPage() {
  const [services, setServices] = useState<ServiceTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/services');
      if (!response.ok) {
        throw new Error('Failed to fetch services');
      }
      const data = await response.json();
      // Filter to only show active services
      const activeServices = data.filter((service: ServiceTemplate) => service.isActive);
      setServices(activeServices);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Convert minutes to hours for display
  const formatDuration = (minutes: number | null): string => {
    if (!minutes) return 'Varies';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) return `${hours} hr${hours > 1 ? 's' : ''}`;
    return `${hours} hr ${mins} min`;
  };

  // Group services by common categories (based on name)
  const categorizeService = (name: string): string => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('brake')) return 'Brakes';
    if (lowerName.includes('oil') || lowerName.includes('filter')) return 'Maintenance';
    if (lowerName.includes('tune') || lowerName.includes('spark')) return 'Engine';
    if (lowerName.includes('ac') || lowerName.includes('air conditioning') || lowerName.includes('a/c')) return 'AC & Climate';
    if (lowerName.includes('diagnostic') || lowerName.includes('scan')) return 'Diagnostics';
    if (lowerName.includes('suspension') || lowerName.includes('shock') || lowerName.includes('strut')) return 'Suspension';
    if (lowerName.includes('electrical') || lowerName.includes('battery') || lowerName.includes('alternator')) return 'Electrical';
    if (lowerName.includes('transmission')) return 'Transmission';
    if (lowerName.includes('exhaust')) return 'Exhaust';
    return 'Other';
  };

  const categorizedServices = services.reduce((acc, service) => {
    const category = categorizeService(service.name);
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(service);
    return acc;
  }, {} as Record<string, ServiceTemplate[]>);

  const categories = Object.keys(categorizedServices).sort();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading services...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-4 md:py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-6 md:mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Our Services
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Professional mobile mechanic services. All work performed at your location with quality parts and expert technicians.
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {services.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <p className="text-gray-600 mb-4">No services available at this time.</p>
            <Link
              href="/services"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Manage Services →
            </Link>
          </div>
        ) : (
          <div className="space-y-8 md:space-y-12">
            {categories.map((category) => (
              <div key={category} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="bg-blue-600 text-white px-6 py-4">
                  <h2 className="text-2xl font-bold">{category}</h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categorizedServices[category].map((service) => (
                      <div
                        key={service.id}
                        className="border border-gray-200 rounded-lg p-5 hover:shadow-lg transition-shadow bg-gray-50"
                      >
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">
                          {service.name}
                        </h3>
                        
                        {service.description && (
                          <p className="text-gray-600 text-sm mb-4 min-h-[3rem]">
                            {service.description}
                          </p>
                        )}

                        <div className="space-y-2 pt-4 border-t border-gray-200">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Estimated Time:</span>
                            <span className="text-sm font-medium text-gray-900">
                              {formatDuration(service.duration)}
                            </span>
                          </div>
                          
                          {service.price && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Starting at:</span>
                              <span className="text-lg font-bold text-blue-600">
                                ${service.price.toFixed(2)}
                              </span>
                            </div>
                          )}
                          
                          {!service.price && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Pricing:</span>
                              <span className="text-sm font-medium text-gray-500 italic">
                                Call for quote
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <Link
                            href={`/jobs/new?service=${encodeURIComponent(service.name)}`}
                            className="block w-full text-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                          >
                            Request This Service
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-12 bg-blue-600 text-white rounded-lg shadow-lg p-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Need Something Not Listed?
          </h2>
          <p className="text-lg mb-6 text-blue-100">
            We offer a wide range of automotive services. Contact us to discuss your specific needs.
          </p>
          <Link
            href="/jobs/new"
            className="inline-block bg-white text-blue-600 px-6 py-3 rounded-md font-semibold hover:bg-blue-50 transition-colors"
          >
            Schedule a Service
          </Link>
        </div>

        {/* Additional Info */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl mb-3">🚗</div>
            <h3 className="font-semibold text-gray-900 mb-2">Mobile Service</h3>
            <p className="text-sm text-gray-600">
              We come to you! No need to leave your home or office.
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="font-semibold text-gray-900 mb-2">Fast & Efficient</h3>
            <p className="text-sm text-gray-600">
              Quality work performed quickly by experienced technicians.
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl mb-3">✅</div>
            <h3 className="font-semibold text-gray-900 mb-2">Quality Guaranteed</h3>
            <p className="text-sm text-gray-600">
              Professional service with quality parts and expert care.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}


