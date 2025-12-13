'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { Job, Customer, Vehicle, Part, InvoiceLineItemFormData } from '@/lib/types';
import { format } from 'date-fns';

export default function NewInvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobIdParam = searchParams?.get('jobId');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [customerVehicles, setCustomerVehicles] = useState<Vehicle[]>([]);

  // Form state
  const [selectedJobId, setSelectedJobId] = useState<string>(jobIdParam || '');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [vehicleInfo, setVehicleInfo] = useState('');
  const [laborHours, setLaborHours] = useState<number>(0);
  const [laborRate, setLaborRate] = useState<number>(75);
  const [shopSupplies, setShopSupplies] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [lineItems, setLineItems] = useState<InvoiceLineItemFormData[]>([]);
  const [taxRate, setTaxRate] = useState<number>(0.08);
  const [dueDate, setDueDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchJobs();
    fetchCustomers();
    fetchVehicles();
    fetchParts();
  }, []);

  useEffect(() => {
    if (selectedJobId) {
      const job = jobs.find(j => j.id === selectedJobId);
      if (job) {
        setSelectedJob(job);
        setCustomerName(`${job.customerFirstName} ${job.customerLastName}`);
        setCustomerPhone(job.customerPhone);
        setVehicleInfo(job.vehicleInfo);
        setLaborHours((job.duration || 0) / 60); // Convert minutes to hours
        if (job.price) {
          // Estimate labor rate from job price
          const estimatedRate = job.price / ((job.duration || 60) / 60);
          setLaborRate(estimatedRate);
        }
        if (job.customerId) {
          setSelectedCustomerId(job.customerId);
          const customer = customers.find(c => c.id === job.customerId);
          if (customer) {
            setCustomerEmail(customer.email || '');
            setCustomerAddress(customer.address || '');
          }
        }
        if (job.vehicleId) {
          setSelectedVehicleId(job.vehicleId);
        }
      }
    }
  }, [selectedJobId, jobs, customers]);

  useEffect(() => {
    if (selectedCustomerId) {
      const customer = customers.find(c => c.id === selectedCustomerId);
      if (customer) {
        setCustomerName(`${customer.firstName} ${customer.lastName}`);
        setCustomerPhone(customer.phone);
        setCustomerEmail(customer.email || '');
        setCustomerAddress(customer.address || '');
        
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

  const addLineItem = () => {
    setLineItems([...lineItems, { description: '', quantity: 1, unitPrice: 0 }]);
  };

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const updateLineItem = (index: number, field: keyof InvoiceLineItemFormData, value: any) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    
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
    const subtotal = laborTotal + partsTotal + shopSupplies;
    const discountTotal = discountAmount + (subtotal * discountPercent / 100);
    const afterDiscount = Math.max(0, subtotal - discountTotal);
    const taxAmount = afterDiscount * taxRate;
    const total = afterDiscount + taxAmount;
    return { laborTotal, partsTotal, subtotal, discountTotal, afterDiscount, taxAmount, total };
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      
      if (!customerName || !vehicleInfo) {
        setError('Customer name and vehicle info are required');
        return;
      }

      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: selectedJobId || undefined,
          customerId: selectedCustomerId || undefined,
          vehicleId: selectedVehicleId || undefined,
          customerName,
          customerPhone: customerPhone || undefined,
          customerEmail: customerEmail || undefined,
          customerAddress: customerAddress || undefined,
          vehicleInfo,
          laborHours,
          laborRate,
          shopSupplies,
          discountAmount,
          discountPercent,
          lineItems: lineItems.filter(item => item.description.trim() && item.quantity > 0),
          taxRate,
          dueDate: dueDate || undefined,
          paymentMethod: paymentMethod || undefined,
          notes: notes || undefined,
          status: 'pending',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create invoice');
      }

      const invoice = await response.json();
      router.push(`/invoices/${invoice.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const { laborTotal, partsTotal, subtotal, discountTotal, afterDiscount, taxAmount, total } = calculateTotals();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-4 md:py-8 max-w-5xl">
        <div className="mb-4 md:mb-6">
          <Link
            href="/invoices"
            className="text-blue-600 hover:text-blue-800 mb-2 inline-block text-sm"
          >
            ← Back to Invoices
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Create New Invoice
          </h1>
          <p className="text-sm md:text-base text-gray-600">
            Generate an invoice from a job or create a new invoice
          </p>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Job Selection */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Create From Job (Optional)</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Job
              </label>
              <select
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Select Job (Optional) --</option>
                {jobs.filter(j => j.status === 'completed').map(job => (
                  <option key={job.id} value={job.id}>
                    {format(new Date(job.date), 'MMM d, yyyy')} - {job.customerFirstName} {job.customerLastName} - {job.serviceType}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Select a completed job to auto-fill invoice details
              </p>
            </div>
          </div>

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
                  Customer Address
                </label>
                <input
                  type="text"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
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
              <h2 className="text-xl font-semibold text-gray-900">Parts & Materials</h2>
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

          {/* Additional Charges & Discounts */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Additional Charges & Discounts</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Shop Supplies Fee
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={shopSupplies}
                  onChange={(e) => setShopSupplies(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount Amount ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount Percentage (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
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
              {shopSupplies > 0 && (
                <div className="flex justify-between">
                  <span>Shop Supplies:</span>
                  <span>${shopSupplies.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold border-t pt-2">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {discountTotal > 0 && (
                <>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount (Amount):</span>
                      <span>-${discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {discountPercent > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount ({discountPercent.toFixed(0)}%):</span>
                      <span>-${(subtotal * discountPercent / 100).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-green-600 border-t pt-1">
                    <span>Total Discount:</span>
                    <span>-${discountTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>After Discount:</span>
                    <span>${afterDiscount.toFixed(2)}</span>
                  </div>
                </>
              )}
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
              <div className="flex justify-between text-2xl font-bold border-t-2 pt-2 mt-2">
                <span>Total:</span>
                <span className="text-blue-600">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Additional Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method (if paid)
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Not paid yet</option>
                  <option value="cash">Cash</option>
                  <option value="check">Check</option>
                  <option value="card">Card</option>
                  <option value="transfer">Bank Transfer</option>
                </select>
              </div>

              <div className="md:col-span-2">
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
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 font-medium disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Invoice'}
            </button>
            <Link
              href="/invoices"
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


