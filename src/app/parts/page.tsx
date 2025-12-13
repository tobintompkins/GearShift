'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { Part } from '@/lib/types';

export default function PartsInventoryPage() {
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPart, setEditingPart] = useState<Part | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showLowStock, setShowLowStock] = useState(false);
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);

  const fetchParts = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (filterCategory !== 'all') {
        params.append('category', filterCategory);
      }
      if (showLowStock) {
        params.append('lowStock', 'true');
      }
      const response = await fetch(`/api/parts?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch parts');
      }
      const data = await response.json();
      setParts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParts();
  }, [filterCategory, showLowStock]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this part?')) {
      return;
    }

    try {
      const response = await fetch(`/api/parts/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete part');
      }

      fetchParts();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleFormSubmit = async (data: any) => {
    try {
      setError(null);
      const url = editingPart
        ? `/api/parts/${editingPart.id}`
        : '/api/parts';
      const method = editingPart ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to save part: ${response.status} ${response.statusText}`);
      }

      setShowForm(false);
      setEditingPart(null);
      fetchParts();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      console.error('Error saving part:', err);
    }
  };

  const handlePurchaseSubmit = async (data: any) => {
    if (!selectedPart) return;

    try {
      setError(null);
      const response = await fetch(`/api/parts/${selectedPart.id}/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to record purchase');
      }

      setShowPurchaseForm(false);
      setSelectedPart(null);
      fetchParts();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      console.error('Error recording purchase:', err);
    }
  };

  const categories = Array.from(new Set(parts.map(p => p.category).filter(Boolean))) as string[];
  const lowStockParts = parts.filter(p => p.quantity <= p.minQuantity);

  if (showForm) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="container mx-auto px-4 py-4 md:py-8 max-w-4xl">
          <div className="mb-4 md:mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              {editingPart ? 'Edit Part' : 'Add New Part'}
            </h1>
            <p className="text-sm md:text-base text-gray-600">
              {editingPart ? 'Update part information' : 'Add a new part to your inventory'}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            {error && (
              <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleFormSubmit({
                  name: formData.get('name')?.toString().trim(),
                  description: formData.get('description')?.toString().trim(),
                  partNumber: formData.get('partNumber')?.toString().trim(),
                  vendor: formData.get('vendor')?.toString().trim(),
                  quantity: parseInt(formData.get('quantity')?.toString() || '0'),
                  minQuantity: parseInt(formData.get('minQuantity')?.toString() || '0'),
                  unit: formData.get('unit')?.toString().trim(),
                  price: parseFloat(formData.get('price')?.toString() || '0') || null,
                  location: formData.get('location')?.toString().trim(),
                  category: formData.get('category')?.toString().trim(),
                  isActive: formData.get('isActive') === 'on',
                });
              }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Part Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    defaultValue={editingPart?.name || ''}
                    placeholder="e.g., Brake Pads, Oil Filter"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    rows={2}
                    defaultValue={editingPart?.description || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Part Number
                  </label>
                  <input
                    type="text"
                    name="partNumber"
                    defaultValue={editingPart?.partNumber || ''}
                    placeholder="Manufacturer part number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    name="category"
                    defaultValue={editingPart?.category || ''}
                    placeholder="e.g., Brakes, Engine, Fluids"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vendor
                  </label>
                  <input
                    type="text"
                    name="vendor"
                    defaultValue={editingPart?.vendor || ''}
                    placeholder="e.g., AutoZone, NAPA"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit
                  </label>
                  <input
                    type="text"
                    name="unit"
                    defaultValue={editingPart?.unit || ''}
                    placeholder="e.g., each, box, gallon"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Quantity *
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    required
                    min="0"
                    defaultValue={editingPart?.quantity || 0}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Quantity (Restock Alert) *
                  </label>
                  <input
                    type="number"
                    name="minQuantity"
                    required
                    min="0"
                    defaultValue={editingPart?.minQuantity || 0}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Alert when stock falls below this number
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price per Unit
                  </label>
                  <input
                    type="number"
                    name="price"
                    step="0.01"
                    min="0"
                    defaultValue={editingPart?.price || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Storage Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    defaultValue={editingPart?.location || ''}
                    placeholder="e.g., Shelf A-3, Bin 5"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="isActive"
                      defaultChecked={editingPart?.isActive !== false}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Active</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                >
                  {editingPart ? 'Update Part' : 'Add Part'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingPart(null);
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    );
  }

  if (showPurchaseForm && selectedPart) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="container mx-auto px-4 py-4 md:py-8 max-w-4xl">
          <div className="mb-4 md:mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Record Purchase: {selectedPart.name}
            </h1>
            <p className="text-sm md:text-base text-gray-600">
              Add new stock to inventory
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            {error && (
              <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handlePurchaseSubmit({
                  quantity: parseInt(formData.get('quantity')?.toString() || '0'),
                  unitPrice: parseFloat(formData.get('unitPrice')?.toString() || '0') || null,
                  totalPrice: parseFloat(formData.get('totalPrice')?.toString() || '0') || null,
                  vendor: formData.get('vendor')?.toString().trim(),
                  purchaseDate: formData.get('purchaseDate')?.toString(),
                  notes: formData.get('notes')?.toString().trim(),
                });
              }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity Purchased *
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    required
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit Price
                  </label>
                  <input
                    type="number"
                    name="unitPrice"
                    step="0.01"
                    min="0"
                    placeholder="Price per unit"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Price
                  </label>
                  <input
                    type="number"
                    name="totalPrice"
                    step="0.01"
                    min="0"
                    placeholder="Total purchase price"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vendor
                  </label>
                  <input
                    type="text"
                    name="vendor"
                    defaultValue={selectedPart.vendor || ''}
                    placeholder="e.g., AutoZone, NAPA"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    name="purchaseDate"
                    defaultValue={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
                >
                  Record Purchase
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPurchaseForm(false);
                    setSelectedPart(null);
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-4 md:py-8">
        <div className="mb-4 md:mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Parts Inventory
            </h1>
            <p className="text-sm md:text-base text-gray-600">
              Track parts, quantities, and restock alerts
            </p>
          </div>
          <button
            onClick={() => {
              setEditingPart(null);
              setShowForm(true);
            }}
            className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors text-sm md:text-base"
          >
            + Add Part
          </button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold text-blue-600">{parts.length}</div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">Total Parts</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold text-orange-600">{lowStockParts.length}</div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">Low Stock</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold text-green-600">
              {parts.reduce((sum, p) => sum + p.quantity, 0)}
            </div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">Total Units</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold text-purple-600">
              ${parts.reduce((sum, p) => sum + (p.price ? p.price * p.quantity : 0), 0).toFixed(2)}
            </div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">Inventory Value</div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Category:</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showLowStock}
              onChange={(e) => setShowLowStock(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Show Low Stock Only</span>
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
            <p className="mt-4 text-gray-600">Loading parts...</p>
          </div>
        ) : parts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <p className="text-gray-600 mb-4">No parts in inventory yet.</p>
            <button
              onClick={() => {
                setEditingPart(null);
                setShowForm(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors"
            >
              Add Your First Part
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-lg shadow-md">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Part Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Part #</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Min Qty</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {parts.map((part) => {
                  const isLowStock = part.quantity <= part.minQuantity;
                  return (
                    <tr
                      key={part.id}
                      className={`hover:bg-gray-50 ${isLowStock ? 'bg-orange-50' : ''}`}
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          {isLowStock && (
                            <span className="text-orange-500 mr-2" title="Low Stock">⚠️</span>
                          )}
                          <div>
                            <div className="font-medium text-gray-900">{part.name}</div>
                            {part.description && (
                              <div className="text-xs text-gray-500">{part.description}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                        {part.category || '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                        {part.partNumber || '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                        {part.vendor || '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`font-medium ${isLowStock ? 'text-orange-600' : 'text-gray-900'}`}>
                          {part.quantity} {part.unit || ''}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                        {part.minQuantity} {part.unit || ''}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                        {part.price ? `$${part.price.toFixed(2)}` : '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                        {part.location || '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedPart(part);
                              setShowPurchaseForm(true);
                            }}
                            className="text-green-600 hover:text-green-900 text-xs"
                            title="Record Purchase"
                          >
                            + Stock
                          </button>
                          <button
                            onClick={() => {
                              setEditingPart(part);
                              setShowForm(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 text-xs"
                            title="Edit"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(part.id)}
                            className="text-red-600 hover:text-red-900 text-xs"
                            title="Delete"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}


