'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { MessageType, MessageChannel, MessageDirection, MessageStatus, Customer, Job, Quote } from '@/lib/types';

export default function NewMessagePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerIdParam = searchParams?.get('customerId');
  const jobIdParam = searchParams?.get('jobId');
  const quoteIdParam = searchParams?.get('quoteId');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);

  // Form state
  const [customerId, setCustomerId] = useState<string>(customerIdParam || '');
  const [jobId, setJobId] = useState<string>(jobIdParam || '');
  const [quoteId, setQuoteId] = useState<string>(quoteIdParam || '');
  const [messageType, setMessageType] = useState<MessageType>('general');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [direction, setDirection] = useState<MessageDirection>('outbound');
  const [channel, setChannel] = useState<MessageChannel>('app');
  const [status, setStatus] = useState<MessageStatus>('sent');
  const [isWaitingReply, setIsWaitingReply] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');
  const [notes, setNotes] = useState('');

  const messageTypes: MessageType[] = ['quote', 'approval', 'note', 'follow-up', 'waiting-reply', 'general'];
  const channels: MessageChannel[] = ['sms', 'email', 'phone', 'facebook', 'in-person', 'app'];
  const directions: MessageDirection[] = ['inbound', 'outbound'];
  const statuses: MessageStatus[] = ['sent', 'delivered', 'read', 'waiting-reply', 'completed'];

  const messageTypeLabels: Record<MessageType, string> = {
    quote: '💰 Quote',
    approval: '✅ Approval',
    note: '📝 Note',
    'follow-up': '📞 Follow-up',
    'waiting-reply': '⏳ Waiting Reply',
    general: '💬 General',
  };

  useEffect(() => {
    fetchCustomers();
    fetchJobs();
    fetchQuotes();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers');
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
    }
  };

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/jobs');
      if (response.ok) {
        const data = await response.json();
        setJobs(data);
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
    }
  };

  const fetchQuotes = async () => {
    try {
      const response = await fetch('/api/quotes');
      if (response.ok) {
        const data = await response.json();
        setQuotes(data);
      }
    } catch (err) {
      console.error('Error fetching quotes:', err);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      if (!content.trim()) {
        setError('Message content is required');
        return;
      }

      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customerId || undefined,
          jobId: jobId || undefined,
          quoteId: quoteId || undefined,
          messageType,
          subject: subject || undefined,
          content: content.trim(),
          direction,
          channel,
          status,
          isWaitingReply,
          followUpDate: followUpDate || undefined,
          notes: notes || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create message');
      }

      const message = await response.json();
      router.push(`/messages/${message.id}`);
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
            href="/messages"
            className="text-blue-600 hover:text-blue-800 mb-2 inline-block text-sm"
          >
            ← Back to Messages
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Create New Message
          </h1>
          <p className="text-sm md:text-base text-gray-600">
            Log a customer conversation or message
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
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Message Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message Type *
                </label>
                <select
                  required
                  value={messageType}
                  onChange={(e) => setMessageType(e.target.value as MessageType)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {messageTypes.map(type => (
                    <option key={type} value={type}>{messageTypeLabels[type]}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Message subject or title"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message Content *
                </label>
                <textarea
                  required
                  rows={6}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Enter the message content..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Direction *
                  </label>
                  <select
                    required
                    value={direction}
                    onChange={(e) => setDirection(e.target.value as MessageDirection)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {directions.map(dir => (
                      <option key={dir} value={dir}>
                        {dir === 'inbound' ? '📥 Inbound' : '📤 Outbound'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Channel *
                  </label>
                  <select
                    required
                    value={channel}
                    onChange={(e) => setChannel(e.target.value as MessageChannel)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {channels.map(ch => (
                      <option key={ch} value={ch}>
                        {ch === 'sms' ? '📱 SMS' : ch === 'email' ? '📧 Email' : ch === 'phone' ? '☎️ Phone' : ch === 'facebook' ? '👤 Facebook' : ch === 'in-person' ? '👋 In-Person' : '💻 App'}
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
                    onChange={(e) => setStatus(e.target.value as MessageStatus)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {statuses.map(st => (
                      <option key={st} value={st}>
                        {st.charAt(0).toUpperCase() + st.slice(1).replace('-', ' ')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Links */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Related Items</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer
                </label>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Select Customer --</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.firstName} {customer.lastName} - {customer.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Related Job
                </label>
                <select
                  value={jobId}
                  onChange={(e) => setJobId(e.target.value)}
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
                  Related Quote
                </label>
                <select
                  value={quoteId}
                  onChange={(e) => setQuoteId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Select Quote --</option>
                  {quotes.map(quote => (
                    <option key={quote.id} value={quote.id}>
                      {quote.quoteNumber} - {quote.customerName} - ${quote.total.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Follow-up & Status */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Follow-up & Status</h2>
            
            <div className="space-y-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={isWaitingReply}
                  onChange={(e) => setIsWaitingReply(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Waiting on customer reply</span>
              </label>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Follow-up Date
                </label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Set a date to follow up on this message
                </p>
              </div>
            </div>
          </div>

          {/* Internal Notes */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Internal Notes</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Notes (Internal Only)
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional internal notes about this message..."
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
              {loading ? 'Creating...' : 'Create Message'}
            </button>
            <Link
              href="/messages"
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


