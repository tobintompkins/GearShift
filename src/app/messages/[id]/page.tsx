'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { CustomerMessage, MessageType, MessageChannel, MessageDirection, MessageStatus, Customer, Job, Quote } from '@/lib/types';
import { format, isPast } from 'date-fns';

export default function MessageDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [message, setMessage] = useState<CustomerMessage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);

  // Form state
  const [customerId, setCustomerId] = useState<string>('');
  const [jobId, setJobId] = useState<string>('');
  const [quoteId, setQuoteId] = useState<string>('');
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

  const channelLabels: Record<MessageChannel, string> = {
    sms: '📱 SMS',
    email: '📧 Email',
    phone: '☎️ Phone',
    facebook: '👤 Facebook',
    'in-person': '👋 In-Person',
    app: '💻 App',
  };

  const statusColors: Record<MessageStatus, string> = {
    sent: 'bg-blue-100 text-blue-800',
    delivered: 'bg-green-100 text-green-800',
    read: 'bg-purple-100 text-purple-800',
    'waiting-reply': 'bg-yellow-100 text-yellow-800',
    completed: 'bg-gray-100 text-gray-800',
  };

  useEffect(() => {
    if (params.id) {
      fetchMessage(params.id as string);
      fetchCustomers();
      fetchJobs();
      fetchQuotes();
    }
  }, [params.id]);

  useEffect(() => {
    if (message) {
      setCustomerId(message.customerId || '');
      setJobId(message.jobId || '');
      setQuoteId(message.quoteId || '');
      setMessageType(message.messageType);
      setSubject(message.subject || '');
      setContent(message.content);
      setDirection(message.direction);
      setChannel(message.channel);
      setStatus(message.status);
      setIsWaitingReply(message.isWaitingReply);
      setFollowUpDate(message.followUpDate ? format(new Date(message.followUpDate), 'yyyy-MM-dd') : '');
      setNotes(message.notes || '');
    }
  }, [message]);

  const fetchMessage = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/messages/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch message');
      }
      const data = await response.json();
      setMessage(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

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

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!content.trim()) {
        setError('Message content is required');
        return;
      }

      const response = await fetch(`/api/messages/${params.id}`, {
        method: 'PUT',
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
        throw new Error(errorData.error || 'Failed to update message');
      }

      const updated = await response.json();
      setMessage(updated);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
      const response = await fetch(`/api/messages/${params.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete message');
      router.push('/messages');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  if (loading && !message) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading message...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !message) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <p className="text-red-600 mb-4">{error || 'Message not found'}</p>
            <Link
              href="/messages"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Back to Messages
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const isOverdueFollowUp = message.followUpDate && message.messageType === 'follow-up' && isPast(new Date(message.followUpDate));

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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                {message.subject || 'Message Details'}
              </h1>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {messageTypeLabels[message.messageType as MessageType]}
                </span>
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                  {channelLabels[message.channel as MessageChannel]}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    statusColors[message.status as MessageStatus] || statusColors.sent
                  }`}
                >
                  {message.status.charAt(0).toUpperCase() + message.status.slice(1).replace('-', ' ')}
                </span>
                {message.isWaitingReply && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                    ⏳ Waiting Reply
                  </span>
                )}
                {isOverdueFollowUp && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                    ⚠️ Overdue Follow-up
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {!isEditing && (
                <>
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
            {/* Same form fields as new message page */}
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
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Internal Notes
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
                  fetchMessage(params.id as string);
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
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Message Content</h2>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{message.content}</p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Message Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Sent:</span>
                  <p className="text-gray-900">{format(new Date(message.sentAt), 'MMMM d, yyyy h:mm a')}</p>
                </div>
                {message.customer && (
                  <div>
                    <span className="font-medium text-gray-700">Customer:</span>
                    <p className="text-gray-900">
                      <Link
                        href={`/customers/${message.customer.id}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {message.customer.firstName} {message.customer.lastName}
                      </Link>
                    </p>
                  </div>
                )}
                {message.job && (
                  <div>
                    <span className="font-medium text-gray-700">Job:</span>
                    <p className="text-gray-900">
                      <Link
                        href={`/jobs/${message.job.id}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {message.job.serviceType}
                      </Link>
                    </p>
                  </div>
                )}
                {message.quote && (
                  <div>
                    <span className="font-medium text-gray-700">Quote:</span>
                    <p className="text-gray-900">
                      <Link
                        href={`/quotes/${message.quote.id}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {message.quote.quoteNumber}
                      </Link>
                    </p>
                  </div>
                )}
                {message.followUpDate && (
                  <div className={isOverdueFollowUp ? 'text-red-600 font-semibold' : ''}>
                    <span className="font-medium text-gray-700">Follow-up Date:</span>
                    <p>
                      {format(new Date(message.followUpDate), 'MMMM d, yyyy')}
                      {isOverdueFollowUp && ' ⚠️ Overdue'}
                    </p>
                  </div>
                )}
                {message.createdBy && (
                  <div>
                    <span className="font-medium text-gray-700">Created by:</span>
                    <p className="text-gray-900">{message.createdBy}</p>
                  </div>
                )}
              </div>
            </div>

            {message.notes && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Internal Notes</h2>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{message.notes}</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}


