'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { Quote } from '@/lib/types';
import { format } from 'date-fns';

export default function QuoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchQuote(params.id as string);
    }
  }, [params.id]);

  const fetchQuote = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/quotes/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch quote');
      }
      const data = await response.json();
      setQuote(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this quote?')) return;

    try {
      const response = await fetch(`/api/quotes/${quote?.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete quote');
      router.push('/quotes');
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
            <p className="mt-4 text-gray-600">Loading quote...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <p className="text-red-600 mb-4">{error || 'Quote not found'}</p>
            <Link
              href="/quotes"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Back to Quotes
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <>
      {/* Non-printable header */}
      <div className="min-h-screen bg-gray-50 print:hidden">
        <Navigation />
        <main className="container mx-auto px-4 py-4 md:py-8 max-w-5xl">
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <Link
                href="/quotes"
                className="text-blue-600 hover:text-blue-800 mb-2 inline-block text-sm"
              >
                ← Back to Quotes
              </Link>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Quote: {quote.quoteNumber}
              </h1>
              <p className="text-sm md:text-base text-gray-600 mt-1">
                Created: {format(new Date(quote.createdAt), 'MMMM d, yyyy')}
              </p>
            </div>
            <div className="flex gap-2">
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
              Status: {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
            </span>
          </div>
        </main>
      </div>

      {/* Printable Quote Document */}
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
                  QUOTE / ESTIMATE
                </h2>
                <p className="text-sm text-gray-600">
                  Quote #: <span className="font-semibold">{quote.quoteNumber}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Date: {format(new Date(quote.createdAt), 'MMMM d, yyyy')}
                </p>
                {quote.validUntil && (
                  <p className="text-sm text-gray-600">
                    Valid Until: {format(new Date(quote.validUntil), 'MMMM d, yyyy')}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Customer & Vehicle Info */}
          <div className="mb-8 print:mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 print:text-base border-b border-gray-200 pb-2">
              Customer Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:gap-3">
              <div>
                <p className="text-sm text-gray-600 mb-1">Customer Name:</p>
                <p className="font-semibold text-gray-900">{quote.customerName}</p>
              </div>
              {quote.customerPhone && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Phone:</p>
                  <p className="text-gray-900">{quote.customerPhone}</p>
                </div>
              )}
              {quote.customerEmail && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Email:</p>
                  <p className="text-gray-900">{quote.customerEmail}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600 mb-1">Vehicle:</p>
                <p className="font-semibold text-gray-900">{quote.vehicleInfo}</p>
              </div>
            </div>
          </div>

          {/* Labor Section */}
          {quote.laborHours > 0 && (
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
                        {quote.laborHours.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right print:px-2 print:py-2 print:text-xs">
                        ${quote.laborRate.toFixed(2)}/hr
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right print:px-2 print:py-2 print:text-xs">
                        ${quote.laborTotal.toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Parts Section */}
          {quote.lineItems && quote.lineItems.length > 0 && (
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
                    {quote.lineItems.map((item, index) => (
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
                    {quote.laborHours > 0 && (
                      <div className="flex justify-between text-sm print:text-xs">
                        <span className="text-gray-700">Labor:</span>
                        <span className="text-gray-900">${quote.laborTotal.toFixed(2)}</span>
                      </div>
                    )}
                    {quote.partsTotal > 0 && (
                      <div className="flex justify-between text-sm print:text-xs">
                        <span className="text-gray-700">Parts:</span>
                        <span className="text-gray-900">${quote.partsTotal.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-semibold print:text-xs border-t border-gray-300 pt-2 print:pt-1 mt-2 print:mt-1">
                      <span className="text-gray-900">Subtotal:</span>
                      <span className="text-gray-900">${quote.subtotal.toFixed(2)}</span>
                    </div>
                    {quote.taxAmount > 0 && (
                      <>
                        <div className="flex justify-between text-sm print:text-xs">
                          <span className="text-gray-700">
                            Tax ({(quote.taxRate * 100).toFixed(2)}%):
                          </span>
                          <span className="text-gray-900">${quote.taxAmount.toFixed(2)}</span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between text-lg font-bold print:text-base border-t-2 border-gray-400 pt-2 print:pt-1 mt-2 print:mt-1">
                      <span className="text-gray-900">Total:</span>
                      <span className="text-blue-600">${quote.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {quote.notes && (
            <div className="mb-8 print:mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 print:text-base border-b border-gray-200 pb-2">
                Notes
              </h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap print:text-xs">
                {quote.notes}
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-12 print:mt-8 pt-6 print:pt-4 border-t-2 border-gray-300">
            <div className="text-center text-sm text-gray-600 print:text-xs">
              <p className="font-semibold mb-2">Thank you for choosing TNT Apex Elite AutoCare!</p>
              <p>This quote is valid until {quote.validUntil ? format(new Date(quote.validUntil), 'MMMM d, yyyy') : 'further notice'}.</p>
              <p className="mt-2">Please contact us with any questions or to schedule service.</p>
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
        }
      `}</style>
    </>
  );
}


