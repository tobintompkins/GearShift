'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { Quote, Customer, Vehicle, Part, QuoteLineItemFormData } from '@/lib/types';
import { format } from 'date-fns';

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [customerVehicles, setCustomerVehicles] = useState<Vehicle[]>([]);

  // Form state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [vehicleInfo, setVehicleInfo] = useState('');
  const [laborHours, setLaborHours] = useState<number>(0);
  const [laborRate, setLaborRate] = useState<number>(75); // Default $75/hour
  const [lineItems, setLineItems] = useState<QuoteLineItemFormData[]>([]);
  const [taxRate, setTaxRate] = useState<number>(0.08); // Default 8%
  const [notes, setNotes] = useState('');
  const [validUntil, setValidUntil] = useState('');

  useEffect(() => {
    fetchQuotes();
    fetchCustomers();
    fetchVehicles();
    fetchParts();
  }, []);

  useEffect(() => {
    if (selectedCustomerId) {
      const customer = customers.find(c => c.id === selectedCustomerId);
      if (customer) {
        setCustomerName(`${customer.firstName} ${customer.lastName}`);
        setCustomerPhone(customer.phone);
        setCustomerEmail(customer.email || '');
        
        // Load customer's vehicles
        const customerVehs = vehicles.filter(v => v.customerId === selectedCustomerId);
        setCustomerVehicles(customerVehs);
      }
    } else {
      setCustomerVehicles([]);
    }
  }, [selectedCustomerId, customers, vehicles]);

  useEffect(() => {
    if (selectedVehicleId) {
      const vehicle = customerVehicles.find(v => v.id === selectedVehicleId) || vehicles.find(v => v.id === selectedVehicleId);
      if (vehicle) {
        const year = vehicle.year || '';
        const make = vehicle.make || '';
        const model = vehicle.model || '';
        setVehicleInfo(`${year} ${make} ${model}`.trim());
      }
    }
  }, [selectedVehicleId, customerVehicles, vehicles]);

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/quotes');
      if (!response.ok) throw new Error('Failed to fetch quotes');
      const data = await response.json();
      setQuotes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers');
      if (!response.ok) throw new Error('Failed to fetch customers');
      const data = await response.json();
      setCustomers(data);
    } catch (err) {
      console.error('Error fetching customers:', err);
    }
  };

  const fetchVehicles = async () => {
    try {
      const response = await fetch('/api/vehicles');
      if (!response.ok) throw new Error('Failed to fetch vehicles');
      const data = await response.json();
      setVehicles(data);
    } catch (err) {
      console.error('Error fetching vehicles:', err);
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

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this quote?')) return;

    try {
      const response = await fetch(`/api/quotes/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete quote');
      fetchQuotes();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const addLineItem = () => {
    setLineItems([...lineItems, { description: '', quantity: 1, unitPrice: 0 }]);
  };

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const updateLineItem = (index: number, field: keyof QuoteLineItemFormData, value: any) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    
    // If part is selected, auto-fill description and price
    if (field === 'partId' && value) {
      const part = parts.find(p => p.id === value);
      if (part) {
        updated[index].description = part.name;
        updated[index].unitPrice = part.price || 0;
      }
    }
    
    setLineItems(updated);
  };

  const calculateTotals = () => {
    const laborTotal = laborHours * laborRate;
    const partsTotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const subtotal = laborTotal + partsTotal;
    const taxAmount = subtotal * taxRate;
    const total = subtotal + taxAmount;
    return { laborTotal, partsTotal, subtotal, taxAmount, total };
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      
      if (!customerName || !vehicleInfo) {
        setError('Customer name and vehicle info are required');
        return;
      }

      const url = editingQuote ? `/api/quotes/${editingQuote.id}` : '/api/quotes';
      const method = editingQuote ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomerId || undefined,
          vehicleId: selectedVehicleId || undefined,
          customerName,
          customerPhone: customerPhone || undefined,
          customerEmail: customerEmail || undefined,
          vehicleInfo,
          laborHours,
          laborRate,
          lineItems: lineItems.filter(item => item.description.trim() && item.quantity > 0),
          taxRate,
          notes: notes || undefined,
          validUntil: validUntil || undefined,
          status: editingQuote?.status || 'draft',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save quote');
      }

      setShowForm(false);
      setEditingQuote(null);
      resetForm();
      fetchQuotes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const resetForm = () => {
    setSelectedCustomerId('');
    setSelectedVehicleId('');
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setVehicleInfo('');
    setLaborHours(0);
    setLaborRate(75);
    setLineItems([]);
    setTaxRate(0.08);
    setNotes('');
    setValidUntil('');
  };

  const { laborTotal, partsTotal, subtotal, taxAmount, total } = calculateTotals();

  if (showForm) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="container mx-auto px-4 py-4 md:py-8 max-w-5xl">
          <div className="mb-4 md:mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              {editingQuote ? 'Edit Quote' : 'Create New Quote'}
            </h1>
            <p className="text-sm md:text-base text-gray-600">
              {editingQuote ? 'Update quote information' : 'Build an estimate for your customer'}
            </p>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Customer & Vehicle Section */}
            <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Customer & Vehicle Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Customer (Optional)
                  </label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Select Customer --</option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id}>
                        {customer.firstName} {customer.lastName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Vehicle (Optional)
                  </label>
                  <select
                    value={selectedVehicleId}
                    onChange={(e) => setSelectedVehicleId(e.target.value)}
                    disabled={!selectedCustomerId && customerVehicles.length === 0}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  >
                    <option value="">-- Select Vehicle --</option>
                    {customerVehicles.map(vehicle => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Phone
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Email
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vehicle Info *
                  </label>
                  <input
                    type="text"
                    required
                    value={vehicleInfo}
                    onChange={(e) => setVehicleInfo(e.target.value)}
                    placeholder="e.g., 2020 Toyota Camry"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Labor Section */}
            <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Labor</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Labor Hours
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    value={laborHours}
                    onChange={(e) => setLaborHours(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Labor Rate ($/hour)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={laborRate}
                    onChange={(e) => setLaborRate(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <div className="bg-gray-50 p-3 rounded-md">
                    <strong>Labor Total: ${laborTotal.toFixed(2)}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Parts Section */}
            <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Parts</h2>
                <button
                  type="button"
                  onClick={addLineItem}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
                >
                  + Add Part
                </button>
              </div>

              {lineItems.length === 0 ? (
                <p className="text-gray-500 text-sm">No parts added yet. Click "+ Add Part" to add parts.</p>
              ) : (
                <div className="space-y-4">
                  {lineItems.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-12 md:col-span-4">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Part</label>
                        <select
                          value={item.partId || ''}
                          onChange={(e) => updateLineItem(index, 'partId', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                          <option value="">-- Select from Inventory --</option>
                          {parts.map(part => (
                            <option key={part.id} value={part.id}>
                              {part.name} {part.price ? `($${part.price.toFixed(2)})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-12 md:col-span-4">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                        <input
                          type="text"
                          required
                          value={item.description}
                          onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                          placeholder="Part description"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>
                      <div className="col-span-4 md:col-span-1">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Qty</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateLineItem(index, 'quantity', parseInt(e.target.value) || 1)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>
                      <div className="col-span-4 md:col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Unit Price</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) => updateLineItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>
                      <div className="col-span-4 md:col-span-1">
                        <button
                          type="button"
                          onClick={() => removeLineItem(index)}
                          className="w-full bg-red-100 text-red-700 px-3 py-2 rounded-md hover:bg-red-200 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 bg-gray-50 p-3 rounded-md">
                <strong>Parts Total: ${partsTotal.toFixed(2)}</strong>
              </div>
            </div>

            {/* Totals Section */}
            <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Totals</h2>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Labor:</span>
                  <span>${laborTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Parts:</span>
                  <span>${partsTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold border-t pt-2">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tax Rate (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={taxRate * 100}
                      onChange={(e) => setTaxRate((parseFloat(e.target.value) || 0) / 100)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-end">
                    <div className="w-full">
                      <div className="text-sm text-gray-600">Tax Amount:</div>
                      <div className="text-lg font-semibold">${taxAmount.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between text-2xl font-bold border-t pt-2">
                  <span>Total:</span>
                  <span className="text-blue-600">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Additional Information</h2>
              
              <div className="space-y-4">
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valid Until (Optional)
                  </label>
                  <input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 font-medium"
              >
                {editingQuote ? 'Update Quote' : 'Save Quote'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingQuote(null);
                  resetForm();
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-3 px-6 rounded-md hover:bg-gray-400 font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
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
              Quotes & Estimates
            </h1>
            <p className="text-sm md:text-base text-gray-600">
              Create and manage customer quotes
            </p>
          </div>
          <button
            onClick={() => {
              setEditingQuote(null);
              resetForm();
              setShowForm(true);
            }}
            className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors text-sm md:text-base"
          >
            + New Quote
          </button>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading quotes...</p>
          </div>
        ) : quotes.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <p className="text-gray-600 mb-4">No quotes created yet.</p>
            <button
              onClick={() => {
                setEditingQuote(null);
                resetForm();
                setShowForm(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors"
            >
              Create Your First Quote
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-lg shadow-md">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quote #</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {quotes.map((quote) => (
                  <tr key={quote.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900">
                      {quote.quoteNumber}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{quote.customerName}</div>
                      {quote.customerPhone && (
                        <div className="text-xs text-gray-500">{quote.customerPhone}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                      {quote.vehicleInfo}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">
                      ${quote.total.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          quote.status === 'accepted'
                            ? 'bg-green-100 text-green-800'
                            : quote.status === 'sent'
                            ? 'bg-blue-100 text-blue-800'
                            : quote.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : quote.status === 'expired'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {quote.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(quote.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <Link
                          href={`/quotes/${quote.id}`}
                          className="text-blue-600 hover:text-blue-900 text-xs font-medium"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => handleDelete(quote.id)}
                          className="text-red-600 hover:text-red-900 text-xs"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}


