'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { Job, Part, PartOrderVendor } from '@/lib/types';

export default function NewPartOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobIdParam = searchParams?.get('jobId');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [parts, setParts] = useState<Part[]>([]);

  // Form state
  const [partName, setPartName] = useState('');
  const [vendor, setVendor] = useState<PartOrderVendor>('AutoZone');
  const [price, setPrice] = useState<number | ''>('');
  const [sku, setSku] = useState('');
  const [deliveryETA, setDeliveryETA] = useState('');
  const [selectedJobId, setSelectedJobId] = useState<string>(jobIdParam || '');
  const [selectedPartId, setSelectedPartId] = useState<string>('');
  const [status, setStatus] = useState<'needed' | 'ordered' | 'arrived' | 'installed'>('needed');
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState('');
  const [orderedDate, setOrderedDate] = useState('');
  const [arrivedDate, setArrivedDate] = useState('');
  const [installedDate, setInstalledDate] = useState('');

  const vendors: PartOrderVendor[] = ["AutoZone", "O'Reilly", "Napa", "RockAuto"];

  useEffect(() => {
    fetchJobs();
    fetchParts();
  }, []);

  useEffect(() => {
    if (selectedPartId) {
      const part = parts.find(p => p.id === selectedPartId);
      if (part) {
        setPartName(part.name);
        if (part.partNumber) setSku(part.partNumber);
        if (part.vendor) setVendor(part.vendor as PartOrderVendor);
        if (part.price) setPrice(part.price);
      }
    }
  }, [selectedPartId, parts]);

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/jobs');
      if (!response.ok) throw new Error('Failed to fetch jobs');
      const data = await response.json();
      setJobs(data);
    } catch (err) {
      console.error('Error fetching jobs:', err);
    }
  };

  const fetchParts = async () => {
    try {
      const response = await fetch('/api/parts?activeOnly=true');
      if (!response.ok) throw new Error('Failed to fetch parts');
      const data = await response.json();
      setParts(data);
    } catch (err) {
      console.error('Error fetching parts:', err);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      if (!partName || !vendor) {
        setError('Part name and vendor are required');
        return;
      }

      const response = await fetch('/api/part-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partName,
          vendor,
          price: price !== '' ? price : undefined,
          sku: sku || undefined,
          deliveryETA: deliveryETA || undefined,
          jobId: selectedJobId || undefined,
          partId: selectedPartId || undefined,
          status,
          quantity,
          notes: notes || undefined,
          orderedDate: orderedDate || undefined,
          arrivedDate: arrivedDate || undefined,
          installedDate: installedDate || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create part order');
      }

      const partOrder = await response.json();
      router.push(`/part-orders/${partOrder.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-4 md:py-8 max-w-3xl">
        <div className="mb-4 md:mb-6">
          <Link
            href="/part-orders"
            className="text-blue-600 hover:text-blue-800 mb-2 inline-block text-sm"
          >
            ← Back to Part Orders
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Create New Part Order
          </h1>
          <p className="text-sm md:text-base text-gray-600">
            Track a part you need to order from a vendor
          </p>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Part Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select from Inventory (Optional)
                </label>
                <select
                  value={selectedPartId}
                  onChange={(e) => setSelectedPartId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Select from Inventory --</option>
                  {parts.map(part => (
                    <option key={part.id} value={part.id}>
                      {part.name} {part.partNumber ? `(${part.partNumber})` : ''}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Select a part from inventory to auto-fill details
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Part Name *
                </label>
                <input
                  type="text"
                  required
                  value={partName}
                  onChange={(e) => setPartName(e.target.value)}
                  placeholder="e.g., Brake Pads, Oil Filter"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vendor *
                  </label>
                  <select
                    required
                    value={vendor}
                    onChange={(e) => setVendor(e.target.value as PartOrderVendor)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {vendors.map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SKU / Part Number
                  </label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="e.g., BP12345"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value ? parseFloat(e.target.value) : '')}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Job & Status */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Job & Status</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Link to Job (Optional)
                </label>
                <select
                  value={selectedJobId}
                  onChange={(e) => setSelectedJobId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Select Job --</option>
                  {jobs.map(job => (
                    <option key={job.id} value={job.id}>
                      {new Date(job.date).toLocaleDateString()} - {job.customerFirstName} {job.customerLastName} - {job.serviceType}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status *
                </label>
                <select
                  required
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="needed">Needed</option>
                  <option value="ordered">Ordered</option>
                  <option value="arrived">Arrived</option>
                  <option value="installed">Installed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery ETA
                </label>
                <input
                  type="date"
                  value={deliveryETA}
                  onChange={(e) => setDeliveryETA(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Dates (Optional)</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ordered Date
                </label>
                <input
                  type="date"
                  value={orderedDate}
                  onChange={(e) => setOrderedDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Arrived Date
                </label>
                <input
                  type="date"
                  value={arrivedDate}
                  onChange={(e) => setArrivedDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Installed Date
                </label>
                <input
                  type="date"
                  value={installedDate}
                  onChange={(e) => setInstalledDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Notes</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Notes
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional information about this order..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 font-medium disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Part Order'}
            </button>
            <Link
              href="/part-orders"
              className="flex-1 bg-gray-300 text-gray-700 py-3 px-6 rounded-md hover:bg-gray-400 font-medium text-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}


