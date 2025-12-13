'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { CustomerMessage, MessageType, MessageChannel, MessageStatus } from '@/lib/types';
import { format, isPast } from 'date-fns';

export default function MessagesPage() {
  const [messages, setMessages] = useState<CustomerMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterChannel, setFilterChannel] = useState<string>('all');
  const [showWaitingReply, setShowWaitingReply] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);

  const messageTypes: MessageType[] = ['quote', 'approval', 'note', 'follow-up', 'waiting-reply', 'general'];
  const channels: MessageChannel[] = ['sms', 'email', 'phone', 'facebook', 'in-person', 'app'];
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
    fetchMessages();
    fetchCustomers();
  }, [filterType, filterStatus, filterChannel, showWaitingReply]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (filterType !== 'all') {
        params.append('messageType', filterType);
      }
      if (filterStatus !== 'all') {
        params.append('status', filterStatus);
      }
      if (filterChannel !== 'all') {
        params.append('channel', filterChannel);
      }
      if (showWaitingReply) {
        params.append('waitingReply', 'true');
      }
      
      const response = await fetch(`/api/messages?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch messages');
      }
      const data = await response.json();
      setMessages(Array.isArray(data) ? data : []);
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

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this message?')) {
      return;
    }

    try {
      const response = await fetch(`/api/messages/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete message');
      }

      fetchMessages();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const stats = {
    total: messages.length,
    waitingReply: messages.filter(m => m.isWaitingReply).length,
    byType: messageTypes.reduce((acc, type) => {
      acc[type] = messages.filter(m => m.messageType === type).length;
      return acc;
    }, {} as Record<MessageType, number>),
    overdueFollowUps: messages.filter(m => {
      if (!m.followUpDate || m.messageType !== 'follow-up') return false;
      return isPast(new Date(m.followUpDate));
    }).length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-4 md:py-8">
        <div className="mb-4 md:mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Customer Messaging Log
            </h1>
            <p className="text-sm md:text-base text-gray-600">
              Track all customer conversations, quotes, approvals, and follow-ups
            </p>
          </div>
          <Link
            href="/messages/new"
            className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors text-sm md:text-base text-center"
          >
            + New Message
          </Link>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">Total Messages</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold text-yellow-600">{stats.waitingReply}</div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">Waiting Reply</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold text-red-600">{stats.overdueFollowUps}</div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">Overdue Follow-ups</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold text-green-600">
              {messages.filter(m => m.status === 'read' || m.status === 'completed').length}
            </div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">Read/Completed</div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Type:</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="all">All Types</option>
              {messageTypes.map(type => (
                <option key={type} value={type}>{messageTypeLabels[type]}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Status:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="all">All Statuses</option>
              {statuses.map(status => (
                <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Channel:</label>
            <select
              value={filterChannel}
              onChange={(e) => setFilterChannel(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="all">All Channels</option>
              {channels.map(channel => (
                <option key={channel} value={channel}>{channelLabels[channel]}</option>
              ))}
            </select>
          </div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showWaitingReply}
              onChange={(e) => setShowWaitingReply(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Show Waiting Reply Only</span>
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
            <p className="mt-4 text-gray-600">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <p className="text-gray-600 mb-4">No messages found.</p>
            <Link
              href="/messages/new"
              className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors"
            >
              Create Your First Message
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              const isOverdueFollowUp = message.followUpDate && message.messageType === 'follow-up' && isPast(new Date(message.followUpDate));
              
              return (
                <div
                  key={message.id}
                  className={`bg-white rounded-lg shadow-md p-4 md:p-6 ${
                    message.isWaitingReply ? 'border-l-4 border-yellow-500' : ''
                  } ${isOverdueFollowUp ? 'border-r-4 border-red-500' : ''}`}
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="text-lg md:text-xl font-semibold text-gray-900">
                          {message.subject || 'No Subject'}
                        </h3>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {messageTypeLabels[message.messageType as MessageType]}
                        </span>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {channelLabels[message.channel as MessageChannel]}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            statusColors[message.status as MessageStatus] || statusColors.sent
                          }`}
                        >
                          {message.status.charAt(0).toUpperCase() + message.status.slice(1).replace('-', ' ')}
                        </span>
                        {message.isWaitingReply && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            ⏳ Waiting Reply
                          </span>
                        )}
                        {isOverdueFollowUp && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            ⚠️ Overdue Follow-up
                          </span>
                        )}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          message.direction === 'inbound' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {message.direction === 'inbound' ? '📥 Inbound' : '📤 Outbound'}
                        </span>
                      </div>

                      <div className="text-sm text-gray-700 mb-3">
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm text-gray-600">
                        {message.customer && (
                          <div>
                            <span className="font-medium">Customer:</span>{' '}
                            <Link
                              href={`/customers/${message.customer.id}`}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              {message.customer.firstName} {message.customer.lastName}
                            </Link>
                          </div>
                        )}
                        {message.job && (
                          <div>
                            <span className="font-medium">Job:</span>{' '}
                            <Link
                              href={`/jobs/${message.job.id}`}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              {message.job.serviceType}
                            </Link>
                          </div>
                        )}
                        {message.quote && (
                          <div>
                            <span className="font-medium">Quote:</span>{' '}
                            <Link
                              href={`/quotes/${message.quote.id}`}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              {message.quote.quoteNumber}
                            </Link>
                          </div>
                        )}
                        <div>
                          <span className="font-medium">Sent:</span>{' '}
                          {(() => {
                            try {
                              return format(new Date(message.sentAt), 'MMM d, yyyy h:mm a');
                            } catch {
                              return 'Invalid date';
                            }
                          })()}
                        </div>
                        {message.followUpDate && (
                          <div className={isOverdueFollowUp ? 'text-red-600 font-semibold' : ''}>
                            <span className="font-medium">Follow-up:</span>{' '}
                            {(() => {
                              try {
                                return format(new Date(message.followUpDate!), 'MMM d, yyyy');
                              } catch {
                                return 'Invalid date';
                              }
                            })()}
                            {isOverdueFollowUp && ' ⚠️ Overdue'}
                          </div>
                        )}
                        {message.createdBy && (
                          <div>
                            <span className="font-medium">Created by:</span> {message.createdBy}
                          </div>
                        )}
                      </div>

                      {message.notes && (
                        <div className="mt-3 text-sm text-gray-600">
                          <span className="font-medium">Internal Notes:</span> {message.notes}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 md:min-w-[150px]">
                      <Link
                        href={`/messages/${message.id}`}
                        className="bg-blue-100 text-blue-700 px-3 py-2 rounded-md text-xs font-medium hover:bg-blue-200 transition-colors text-center"
                      >
                        View/Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(message.id)}
                        className="bg-red-100 text-red-700 px-3 py-2 rounded-md text-xs font-medium hover:bg-red-200 transition-colors"
                      >
                        Delete
                      </button>
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


