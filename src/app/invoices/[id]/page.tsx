'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { Invoice } from '@/lib/types';
import { format, isPast } from 'date-fns';

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('');

  useEffect(() => {
    if (params.id) {
      fetchInvoice(params.id as string);
    }
  }, [params.id]);

  const fetchInvoice = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/invoices/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch invoice');
      }
      const data = await response.json();
      setInvoice(data);
      setPaymentAmount(data.balanceDue);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice) return;

    try {
      const response = await fetch(`/api/invoices/${invoice.id}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountPaid: invoice.amountPaid + paymentAmount,
          paymentMethod: paymentMethod || invoice.paymentMethod,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to record payment');
      }

      setShowPaymentForm(false);
      setPaymentAmount(0);
      setPaymentMethod('');
      fetchInvoice(invoice.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;

    try {
      const response = await fetch(`/api/invoices/${invoice?.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete invoice');
      router.push('/invoices');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading invoice...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <p className="text-red-600 mb-4">{error || 'Invoice not found'}</p>
            <Link
              href="/invoices"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Back to Invoices
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const isOverdue = invoice.dueDate && isPast(new Date(invoice.dueDate)) && invoice.status !== 'paid';
  const discountTotal = invoice.discountAmount + (invoice.subtotal * invoice.discountPercent / 100);
  const afterDiscount = Math.max(0, invoice.subtotal - discountTotal);

  return (
    <>
      {/* Non-printable header */}
      <div className="min-h-screen bg-gray-50 print:hidden">
        <Navigation />
        <main className="container mx-auto px-4 py-4 md:py-8 max-w-5xl">
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <Link
                href="/invoices"
                className="text-blue-600 hover:text-blue-800 mb-2 inline-block text-sm"
              >
                ← Back to Invoices
              </Link>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Invoice: {invoice.invoiceNumber}
              </h1>
              <p className="text-sm md:text-base text-gray-600 mt-1">
                Issued: {format(new Date(invoice.issueDate), 'MMMM d, yyyy')}
              </p>
            </div>
            <div className="flex gap-2">
              {invoice.status !== 'paid' && (
                <button
                  onClick={() => setShowPaymentForm(!showPaymentForm)}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  Record Payment
                </button>
              )}
              <button
                onClick={handlePrint}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                🖨️ Print / PDF
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
              >
                Delete
              </button>
            </div>
          </div>

          {/* Status Badge */}
          <div className="mb-6">
            <span
              className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                invoice.status === 'paid'
                  ? 'bg-green-100 text-green-800'
                  : invoice.status === 'partial'
                  ? 'bg-blue-100 text-blue-800'
                  : isOverdue
                  ? 'bg-red-100 text-red-800'
                  : invoice.status === 'cancelled'
                  ? 'bg-gray-100 text-gray-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              Status: {isOverdue ? 'Overdue' : invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
            </span>
          </div>

          {/* Payment Form */}
          {showPaymentForm && invoice.status !== 'paid' && (
            <div className="mb-6 bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Record Payment</h2>
              <form onSubmit={handlePayment} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Amount *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max={invoice.balanceDue}
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Balance Due: ${invoice.balanceDue.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Method
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select method</option>
                      <option value="cash">Cash</option>
                      <option value="check">Check</option>
                      <option value="card">Card</option>
                      <option value="transfer">Bank Transfer</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 font-medium"
                  >
                    Record Payment
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPaymentForm(false);
                      setPaymentAmount(0);
                      setPaymentMethod('');
                    }}
                    className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400 font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>

      {/* Printable Invoice Document */}
      <div className="bg-white print:bg-white print:shadow-none">
        <div className="container mx-auto px-4 py-8 max-w-4xl print:max-w-full print:px-8">
          {/* Header */}
          <div className="mb-8 print:mb-6 border-b-2 border-gray-300 pb-6 print:pb-4">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2 print:text-2xl">
                  TNT Apex Elite AutoCare
                </h1>
                <p className="text-gray-600 text-sm">
                  Mobile Mechanic Services
                </p>
              </div>
              <div className="text-right">
                <h2 className="text-2xl font-bold text-blue-600 mb-2 print:text-xl">
                  INVOICE
                </h2>
                <p className="text-sm text-gray-600">
                  Invoice #: <span className="font-semibold">{invoice.invoiceNumber}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Issue Date: {format(new Date(invoice.issueDate), 'MMMM d, yyyy')}
                </p>
                {invoice.dueDate && (
                  <p className={`text-sm ${isOverdue ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                    Due Date: {format(new Date(invoice.dueDate), 'MMMM d, yyyy')}
                  </p>
                )}
                {invoice.job && (
                  <p className="text-sm text-gray-600">
                    Job: {invoice.job.serviceType}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Customer & Vehicle Info */}
          <div className="mb-8 print:mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 print:text-base border-b border-gray-200 pb-2">
              Bill To
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:gap-3">
              <div>
                <p className="text-sm text-gray-600 mb-1">Customer Name:</p>
                <p className="font-semibold text-gray-900">{invoice.customerName}</p>
              </div>
              {invoice.customerPhone && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Phone:</p>
                  <p className="text-gray-900">{invoice.customerPhone}</p>
                </div>
              )}
              {invoice.customerEmail && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Email:</p>
                  <p className="text-gray-900">{invoice.customerEmail}</p>
                </div>
              )}
              {invoice.customerAddress && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Address:</p>
                  <p className="text-gray-900">{invoice.customerAddress}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600 mb-1">Vehicle:</p>
                <p className="font-semibold text-gray-900">{invoice.vehicleInfo}</p>
              </div>
            </div>
          </div>

          {/* Labor Section */}
          {invoice.laborHours > 0 && (
            <div className="mb-8 print:mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 print:text-base border-b border-gray-200 pb-2">
                Labor
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 print:bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 print:px-2 print:py-2 print:text-xs">
                        Description
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 print:px-2 print:py-2 print:text-xs">
                        Hours
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 print:px-2 print:py-2 print:text-xs">
                        Rate
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 print:px-2 print:py-2 print:text-xs">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-200">
                      <td className="px-4 py-3 text-sm text-gray-900 print:px-2 print:py-2 print:text-xs">
                        Labor
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right print:px-2 print:py-2 print:text-xs">
                        {invoice.laborHours.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right print:px-2 print:py-2 print:text-xs">
                        ${invoice.laborRate.toFixed(2)}/hr
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right print:px-2 print:py-2 print:text-xs">
                        ${invoice.laborTotal.toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Parts Section */}
          {invoice.lineItems && invoice.lineItems.length > 0 && (
            <div className="mb-8 print:mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 print:text-base border-b border-gray-200 pb-2">
                Parts & Materials
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 print:bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 print:px-2 print:py-2 print:text-xs">
                        Description
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 print:px-2 print:py-2 print:text-xs">
                        Quantity
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 print:px-2 print:py-2 print:text-xs">
                        Unit Price
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 print:px-2 print:py-2 print:text-xs">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.lineItems.map((item, index) => (
                      <tr key={item.id || index} className="border-b border-gray-200">
                        <td className="px-4 py-3 text-sm text-gray-900 print:px-2 print:py-2 print:text-xs">
                          {item.description}
                          {item.part?.partNumber && (
                            <span className="text-gray-500 text-xs block print:hidden">
                              Part #: {item.part.partNumber}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right print:px-2 print:py-2 print:text-xs">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right print:px-2 print:py-2 print:text-xs">
                          ${item.unitPrice.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right print:px-2 print:py-2 print:text-xs">
                          ${item.total.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Totals Section */}
          <div className="mb-8 print:mb-6">
            <div className="flex justify-end">
              <div className="w-full md:w-96 print:w-80">
                <div className="bg-gray-50 print:bg-gray-100 p-4 print:p-3 rounded-lg print:rounded">
                  <div className="space-y-2 print:space-y-1">
                    {invoice.laborHours > 0 && (
                      <div className="flex justify-between text-sm print:text-xs">
                        <span className="text-gray-700">Labor:</span>
                        <span className="text-gray-900">${invoice.laborTotal.toFixed(2)}</span>
                      </div>
                    )}
                    {invoice.partsTotal > 0 && (
                      <div className="flex justify-between text-sm print:text-xs">
                        <span className="text-gray-700">Parts:</span>
                        <span className="text-gray-900">${invoice.partsTotal.toFixed(2)}</span>
                      </div>
                    )}
                    {invoice.shopSupplies > 0 && (
                      <div className="flex justify-between text-sm print:text-xs">
                        <span className="text-gray-700">Shop Supplies:</span>
                        <span className="text-gray-900">${invoice.shopSupplies.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-semibold print:text-xs border-t border-gray-300 pt-2 print:pt-1 mt-2 print:mt-1">
                      <span className="text-gray-900">Subtotal:</span>
                      <span className="text-gray-900">${invoice.subtotal.toFixed(2)}</span>
                    </div>
                    {discountTotal > 0 && (
                      <>
                        {invoice.discountAmount > 0 && (
                          <div className="flex justify-between text-sm print:text-xs text-green-600">
                            <span>Discount (Amount):</span>
                            <span>-${invoice.discountAmount.toFixed(2)}</span>
                          </div>
                        )}
                        {invoice.discountPercent > 0 && (
                          <div className="flex justify-between text-sm print:text-xs text-green-600">
                            <span>Discount ({(invoice.discountPercent).toFixed(0)}%):</span>
                            <span>-${(invoice.subtotal * invoice.discountPercent / 100).toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm font-semibold print:text-xs text-green-600 border-t border-gray-300 pt-1">
                          <span>Total Discount:</span>
                          <span>-${discountTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm print:text-xs">
                          <span className="text-gray-700">After Discount:</span>
                          <span className="text-gray-900">${afterDiscount.toFixed(2)}</span>
                        </div>
                      </>
                    )}
                    {invoice.taxAmount > 0 && (
                      <div className="flex justify-between text-sm print:text-xs">
                        <span className="text-gray-700">
                          Tax ({(invoice.taxRate * 100).toFixed(2)}%):
                        </span>
                        <span className="text-gray-900">${invoice.taxAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold print:text-base border-t-2 border-gray-400 pt-2 print:pt-1 mt-2 print:mt-1">
                      <span className="text-gray-900">Total:</span>
                      <span className="text-blue-600">${invoice.total.toFixed(2)}</span>
                    </div>
                    {invoice.amountPaid > 0 && (
                      <>
                        <div className="flex justify-between text-sm print:text-xs border-t border-gray-300 pt-2 print:pt-1 mt-2 print:mt-1">
                          <span className="text-gray-700">Amount Paid:</span>
                          <span className="text-green-600">${invoice.amountPaid.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm font-semibold print:text-xs">
                          <span className="text-gray-900">Balance Due:</span>
                          <span className={invoice.balanceDue > 0 ? 'text-red-600' : 'text-green-600'}>
                            ${invoice.balanceDue.toFixed(2)}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          {invoice.status === 'paid' && invoice.paidDate && (
            <div className="mb-8 print:mb-6 bg-green-50 print:bg-green-100 p-4 print:p-3 rounded-lg print:rounded">
              <p className="text-sm print:text-xs text-green-800 font-semibold mb-2">
                ✓ Payment Received
              </p>
              <p className="text-sm print:text-xs text-green-700">
                Paid: {format(new Date(invoice.paidDate), 'MMMM d, yyyy')}
                {invoice.paymentMethod && ` • Method: ${invoice.paymentMethod.charAt(0).toUpperCase() + invoice.paymentMethod.slice(1)}`}
              </p>
            </div>
          )}

          {/* Notes */}
          {invoice.notes && (
            <div className="mb-8 print:mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 print:text-base border-b border-gray-200 pb-2">
                Notes
              </h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap print:text-xs">
                {invoice.notes}
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-12 print:mt-8 pt-6 print:pt-4 border-t-2 border-gray-300">
            <div className="text-center text-sm text-gray-600 print:text-xs">
              <p className="font-semibold mb-2">Thank you for your business!</p>
              {invoice.balanceDue > 0 && (
                <p className="text-red-600 font-semibold">
                  Please remit payment of ${invoice.balanceDue.toFixed(2)} by {invoice.dueDate ? format(new Date(invoice.dueDate), 'MMMM d, yyyy') : 'the due date'}.
                </p>
              )}
              <p className="mt-2">Questions? Please contact us.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            background: white;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:bg-white {
            background: white !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:max-w-full {
            max-width: 100% !important;
          }
          .print\\:px-8 {
            padding-left: 2rem !important;
            padding-right: 2rem !important;
          }
          .print\\:mb-6 {
            margin-bottom: 1.5rem !important;
          }
          .print\\:mb-4 {
            margin-bottom: 1rem !important;
          }
          .print\\:pb-4 {
            padding-bottom: 1rem !important;
          }
          .print\\:pb-2 {
            padding-bottom: 0.5rem !important;
          }
          .print\\:text-2xl {
            font-size: 1.5rem !important;
          }
          .print\\:text-xl {
            font-size: 1.25rem !important;
          }
          .print\\:text-base {
            font-size: 1rem !important;
          }
          .print\\:text-xs {
            font-size: 0.75rem !important;
          }
          .print\\:px-2 {
            padding-left: 0.5rem !important;
            padding-right: 0.5rem !important;
          }
          .print\\:py-2 {
            padding-top: 0.5rem !important;
            padding-bottom: 0.5rem !important;
          }
          .print\\:gap-3 {
            gap: 0.75rem !important;
          }
          .print\\:w-80 {
            width: 20rem !important;
          }
          .print\\:p-3 {
            padding: 0.75rem !important;
          }
          .print\\:space-y-1 {
            gap: 0.25rem !important;
          }
          .print\\:pt-1 {
            padding-top: 0.25rem !important;
          }
          .print\\:mt-1 {
            margin-top: 0.25rem !important;
          }
          .print\\:mt-2 {
            margin-top: 0.5rem !important;
          }
          .print\\:mt-8 {
            margin-top: 2rem !important;
          }
          .print\\:pt-4 {
            padding-top: 1rem !important;
          }
          .print\\:rounded {
            border-radius: 0.25rem !important;
          }
          .print\\:bg-gray-100 {
            background-color: #f3f4f6 !important;
          }
          .print\\:bg-green-100 {
            background-color: #d1fae5 !important;
          }
        }
      `}</style>
    </>
  );
}


