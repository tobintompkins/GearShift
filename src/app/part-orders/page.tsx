'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { PartOrder, PartOrderStatus, PartOrderVendor } from '@/lib/types';
import { format, isPast } from 'date-fns';

export default function PartOrdersPage() {
  const [partOrders, setPartOrders] = useState<PartOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterVendor, setFilterVendor] = useState<string>('all');
  const [showOverdue, setShowOverdue] = useState(false);

  useEffect(() => {
    fetchPartOrders();
  }, [filterStatus, filterVendor, showOverdue]);

  const fetchPartOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (filterStatus !== 'all') {
        params.append('status', filterStatus);
      }
      if (filterVendor !== 'all') {
        params.append('vendor', filterVendor);
      }
      if (showOverdue) {
        params.append('overdue', 'true');
      }
      const response = await fetch(`/api/part-orders?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch part orders');
      }
      const data = await response.json();
      setPartOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this part order?')) {
      return;
    }

    try {
      const response = await fetch(`/api/part-orders/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete part order');
      }

      fetchPartOrders();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleStatusChange = async (id: string, newStatus: PartOrderStatus) => {
    try {
      const response = await fetch(`/api/part-orders/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      fetchPartOrders();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const statusColors: Record<PartOrderStatus, string> = {
    needed: 'bg-yellow-100 text-yellow-800',
    ordered: 'bg-blue-100 text-blue-800',
    arrived: 'bg-green-100 text-green-800',
    installed: 'bg-gray-100 text-gray-800',
  };

  const vendors: PartOrderVendor[] = ["AutoZone", "O'Reilly", "Napa", "RockAuto"];

  const stats = {
    total: partOrders.length,
    needed: partOrders.filter(o => o.status === 'needed').length,
    ordered: partOrders.filter(o => o.status === 'ordered').length,
    arrived: partOrders.filter(o => o.status === 'arrived').length,
    installed: partOrders.filter(o => o.status === 'installed').length,
    overdue: partOrders.filter(o => {
      if (!o.deliveryETA) return false;
      return isPast(new Date(o.deliveryETA)) && o.status !== 'arrived' && o.status !== 'installed';
    }).length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-4 md:py-8">
        <div className="mb-4 md:mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Parts Ordering & Vendor Tracking
            </h1>
            <p className="text-sm md:text-base text-gray-600">
              Track parts you need to order from vendors
            </p>
          </div>
          <Link
            href="/part-orders/new"
            className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors text-sm md:text-base text-center"
          >
            + New Part Order
          </Link>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">Total</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold text-yellow-600">{stats.needed}</div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">Needed</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold text-blue-600">{stats.ordered}</div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">Ordered</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold text-green-600">{stats.arrived}</div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">Arrived</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold text-gray-600">{stats.installed}</div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">Installed</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold text-red-600">{stats.overdue}</div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">Overdue</div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Status:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="needed">Needed</option>
              <option value="ordered">Ordered</option>
              <option value="arrived">Arrived</option>
              <option value="installed">Installed</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Vendor:</label>
            <select
              value={filterVendor}
              onChange={(e) => setFilterVendor(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="all">All Vendors</option>
              {vendors.map(vendor => (
                <option key={vendor} value={vendor}>{vendor}</option>
              ))}
            </select>
          </div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showOverdue}
              onChange={(e) => setShowOverdue(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Show Overdue Only</span>
          </label>
        </div>

        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading part orders...</p>
          </div>
        ) : partOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <p className="text-gray-600 mb-4">No part orders found.</p>
            <Link
              href="/part-orders/new"
              className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors"
            >
              Create Your First Part Order
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {partOrders.map((order) => {
              const isOverdue = order.deliveryETA && isPast(new Date(order.deliveryETA)) && order.status !== 'arrived' && order.status !== 'installed';
              return (
                <div
                  key={order.id}
                  className={`bg-white rounded-lg shadow-md p-4 md:p-6 ${
                    isOverdue ? 'border-l-4 border-red-500' : ''
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="text-lg md:text-xl font-semibold text-gray-900">
                          {order.partName}
                        </h3>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            statusColors[order.status as PartOrderStatus] || statusColors.needed
                          }`}
                        >
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                        {isOverdue && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Overdue
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm text-gray-700">
                        <div>
                          <span className="font-medium">Vendor:</span> {order.vendor}
                        </div>
                        {order.sku && (
                          <div>
                            <span className="font-medium">SKU:</span> {order.sku}
                          </div>
                        )}
                        {order.price && (
                          <div>
                            <span className="font-medium">Price:</span> ${order.price.toFixed(2)}
                          </div>
                        )}
                        <div>
                          <span className="font-medium">Quantity:</span> {order.quantity}
                        </div>
                        {order.deliveryETA && (
                          <div className={isOverdue ? 'text-red-600 font-semibold' : ''}>
                            <span className="font-medium">ETA:</span>{' '}
                            {format(new Date(order.deliveryETA), 'MMM d, yyyy')}
                          </div>
                        )}
                        {order.job && (
                          <div>
                            <span className="font-medium">Job:</span>{' '}
                            <Link
                              href={`/jobs/${order.job.id}`}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              {order.job.serviceType}
                            </Link>
                          </div>
                        )}
                        {order.part && (
                          <div>
                            <span className="font-medium">Inventory Part:</span>{' '}
                            <Link
                              href={`/parts`}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              {order.part.name}
                            </Link>
                          </div>
                        )}
                      </div>

                      {order.notes && (
                        <div className="mt-2 text-sm text-gray-600">
                          <span className="font-medium">Notes:</span> {order.notes}
                        </div>
                      )}

                      {/* Date Timeline */}
                      <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500">
                        {order.orderedDate && (
                          <span>
                            Ordered: {format(new Date(order.orderedDate), 'MMM d, yyyy')}
                          </span>
                        )}
                        {order.arrivedDate && (
                          <span>
                            Arrived: {format(new Date(order.arrivedDate), 'MMM d, yyyy')}
                          </span>
                        )}
                        {order.installedDate && (
                          <span>
                            Installed: {format(new Date(order.installedDate), 'MMM d, yyyy')}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 md:min-w-[200px]">
                      {/* Status Quick Actions */}
                      <div className="flex flex-wrap gap-2">
                        {order.status === 'needed' && (
                          <button
                            onClick={() => handleStatusChange(order.id, 'ordered')}
                            className="flex-1 bg-blue-600 text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-blue-700 transition-colors"
                          >
                            Mark Ordered
                          </button>
                        )}
                        {order.status === 'ordered' && (
                          <button
                            onClick={() => handleStatusChange(order.id, 'arrived')}
                            className="flex-1 bg-green-600 text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-green-700 transition-colors"
                          >
                            Mark Arrived
                          </button>
                        )}
                        {order.status === 'arrived' && (
                          <button
                            onClick={() => handleStatusChange(order.id, 'installed')}
                            className="flex-1 bg-gray-600 text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-gray-700 transition-colors"
                          >
                            Mark Installed
                          </button>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Link
                          href={`/part-orders/${order.id}`}
                          className="flex-1 bg-blue-100 text-blue-700 px-3 py-1.5 rounded-md text-xs font-medium hover:bg-blue-200 transition-colors text-center"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(order.id)}
                          className="flex-1 bg-red-100 text-red-700 px-3 py-1.5 rounded-md text-xs font-medium hover:bg-red-200 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}


