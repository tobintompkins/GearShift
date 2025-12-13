'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { PartOrder, PartOrderStatus, PartOrderVendor, Job, Part } from '@/lib/types';
import { format, isPast } from 'date-fns';

export default function PartOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [partOrder, setPartOrder] = useState<PartOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [partName, setPartName] = useState('');
  const [vendor, setVendor] = useState<PartOrderVendor>('AutoZone');
  const [price, setPrice] = useState<number | ''>('');
  const [sku, setSku] = useState('');
  const [deliveryETA, setDeliveryETA] = useState('');
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [selectedPartId, setSelectedPartId] = useState<string>('');
  const [status, setStatus] = useState<PartOrderStatus>('needed');
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState('');
  const [orderedDate, setOrderedDate] = useState('');
  const [arrivedDate, setArrivedDate] = useState('');
  const [installedDate, setInstalledDate] = useState('');

  const vendors: PartOrderVendor[] = ["AutoZone", "O'Reilly", "Napa", "RockAuto"];

  useEffect(() => {
    if (params.id) {
      fetchPartOrder(params.id as string);
      fetchJobs();
      fetchParts();
    }
  }, [params.id]);

  useEffect(() => {
    if (partOrder) {
      setPartName(partOrder.partName);
      setVendor(partOrder.vendor as PartOrderVendor);
      setPrice(partOrder.price || '');
      setSku(partOrder.sku || '');
      setDeliveryETA(partOrder.deliveryETA ? format(new Date(partOrder.deliveryETA), 'yyyy-MM-dd') : '');
      setSelectedJobId(partOrder.jobId || '');
      setSelectedPartId(partOrder.partId || '');
      setStatus(partOrder.status);
      setQuantity(partOrder.quantity);
      setNotes(partOrder.notes || '');
      setOrderedDate(partOrder.orderedDate ? format(new Date(partOrder.orderedDate), 'yyyy-MM-dd') : '');
      setArrivedDate(partOrder.arrivedDate ? format(new Date(partOrder.arrivedDate), 'yyyy-MM-dd') : '');
      setInstalledDate(partOrder.installedDate ? format(new Date(partOrder.installedDate), 'yyyy-MM-dd') : '');
    }
  }, [partOrder]);

  const fetchPartOrder = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/part-orders/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch part order');
      }
      const data = await response.json();
      setPartOrder(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

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

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!partName || !vendor) {
        setError('Part name and vendor are required');
        return;
      }

      const response = await fetch(`/api/part-orders/${params.id}`, {
        method: 'PUT',
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
        throw new Error(errorData.error || 'Failed to update part order');
      }

      const updated = await response.json();
      setPartOrder(updated);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this part order?')) return;

    try {
      const response = await fetch(`/api/part-orders/${params.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete part order');
      router.push('/part-orders');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleStatusChange = async (newStatus: PartOrderStatus) => {
    try {
      const response = await fetch(`/api/part-orders/${params.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      const updated = await response.json();
      setPartOrder(updated);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  if (loading && !partOrder) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading part order...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !partOrder) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <p className="text-red-600 mb-4">{error || 'Part order not found'}</p>
            <Link
              href="/part-orders"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Back to Part Orders
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const isOverdue = partOrder.deliveryETA && isPast(new Date(partOrder.deliveryETA)) && partOrder.status !== 'arrived' && partOrder.status !== 'installed';
  const statusColors: Record<PartOrderStatus, string> = {
    needed: 'bg-yellow-100 text-yellow-800',
    ordered: 'bg-blue-100 text-blue-800',
    arrived: 'bg-green-100 text-green-800',
    installed: 'bg-gray-100 text-gray-800',
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                Part Order Details
              </h1>
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    statusColors[partOrder.status] || statusColors.needed
                  }`}
                >
                  {partOrder.status.charAt(0).toUpperCase() + partOrder.status.slice(1)}
                </span>
                {isOverdue && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                    Overdue
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {!isEditing && (
                <>
                  {partOrder.status === 'needed' && (
                    <button
                      onClick={() => handleStatusChange('ordered')}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium"
                    >
                      Mark Ordered
                    </button>
                  )}
                  {partOrder.status === 'ordered' && (
                    <button
                      onClick={() => handleStatusChange('arrived')}
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm font-medium"
                    >
                      Mark Arrived
                    </button>
                  )}
                  {partOrder.status === 'arrived' && (
                    <button
                      onClick={() => handleStatusChange('installed')}
                      className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 text-sm font-medium"
                    >
                      Mark Installed
                    </button>
                  )}
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 text-sm font-medium"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {isEditing ? (
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Part Name *
              </label>
              <input
                type="text"
                required
                value={partName}
                onChange={(e) => setPartName(e.target.value)}
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
                  Status *
                </label>
                <select
                  required
                  value={status}
                  onChange={(e) => setStatus(e.target.value as PartOrderStatus)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="needed">Needed</option>
                  <option value="ordered">Ordered</option>
                  <option value="arrived">Arrived</option>
                  <option value="installed">Installed</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SKU / Part Number
                </label>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Link to Job
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
                Link to Inventory Part
              </label>
              <select
                value={selectedPartId}
                onChange={(e) => setSelectedPartId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Select Part --</option>
                {parts.map(part => (
                  <option key={part.id} value={part.id}>
                    {part.name} {part.partNumber ? `(${part.partNumber})` : ''}
                  </option>
                ))}
              </select>
            </div>

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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 font-medium disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  fetchPartOrder(params.id as string);
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Part Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Part Name:</span>
                  <p className="text-gray-900">{partOrder.partName}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Vendor:</span>
                  <p className="text-gray-900">{partOrder.vendor}</p>
                </div>
                {partOrder.sku && (
                  <div>
                    <span className="font-medium text-gray-700">SKU / Part Number:</span>
                    <p className="text-gray-900">{partOrder.sku}</p>
                  </div>
                )}
                {partOrder.price && (
                  <div>
                    <span className="font-medium text-gray-700">Price:</span>
                    <p className="text-gray-900">${partOrder.price.toFixed(2)}</p>
                  </div>
                )}
                <div>
                  <span className="font-medium text-gray-700">Quantity:</span>
                  <p className="text-gray-900">{partOrder.quantity}</p>
                </div>
                {partOrder.deliveryETA && (
                  <div className={isOverdue ? 'text-red-600' : ''}>
                    <span className="font-medium text-gray-700">Delivery ETA:</span>
                    <p className={isOverdue ? 'font-semibold' : ''}>
                      {format(new Date(partOrder.deliveryETA), 'MMMM d, yyyy')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {(partOrder.job || partOrder.part) && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Links</h2>
                <div className="space-y-2 text-sm">
                  {partOrder.job && (
                    <div>
                      <span className="font-medium text-gray-700">Job:</span>{' '}
                      <Link
                        href={`/jobs/${partOrder.job.id}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {partOrder.job.serviceType} - {partOrder.job.customerFirstName} {partOrder.job.customerLastName}
                      </Link>
                    </div>
                  )}
                  {partOrder.part && (
                    <div>
                      <span className="font-medium text-gray-700">Inventory Part:</span>{' '}
                      <Link
                        href="/parts"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {partOrder.part.name}
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Timeline</h2>
              <div className="space-y-2 text-sm text-gray-700">
                {partOrder.orderedDate && (
                  <div>
                    <span className="font-medium">Ordered:</span>{' '}
                    {format(new Date(partOrder.orderedDate), 'MMMM d, yyyy')}
                  </div>
                )}
                {partOrder.arrivedDate && (
                  <div>
                    <span className="font-medium">Arrived:</span>{' '}
                    {format(new Date(partOrder.arrivedDate), 'MMMM d, yyyy')}
                  </div>
                )}
                {partOrder.installedDate && (
                  <div>
                    <span className="font-medium">Installed:</span>{' '}
                    {format(new Date(partOrder.installedDate), 'MMMM d, yyyy')}
                  </div>
                )}
              </div>
            </div>

            {partOrder.notes && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Notes</h2>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{partOrder.notes}</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}


