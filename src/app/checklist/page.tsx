'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { Note, NoteCategory } from '@/lib/types';
import { format, isToday, isPast, startOfToday, endOfToday } from 'date-fns';

const categoryLabels: Record<NoteCategory, string> = {
  'parts-pickup': '📦 Parts to Pick Up',
  'callback': '📞 Jobs Waiting on Callbacks',
  'follow-up': '👤 Customers to Follow Up',
  'business-buy': '🛒 Things to Buy for Business',
  'tools': '🛠️ Tools Needed',
  'daily-task': '✅ Daily Task',
};

const categoryColors: Record<NoteCategory, string> = {
  'parts-pickup': 'bg-blue-100 text-blue-800 border-blue-300',
  'callback': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'follow-up': 'bg-green-100 text-green-800 border-green-300',
  'business-buy': 'bg-purple-100 text-purple-800 border-purple-300',
  'tools': 'bg-orange-100 text-orange-800 border-orange-300',
  'daily-task': 'bg-indigo-100 text-indigo-800 border-indigo-300',
};

const dailyTaskTemplates = [
  { title: 'Order parts', category: 'parts-pickup' as NoteCategory, content: 'Review parts inventory and place orders' },
  { title: 'Follow up with X customer', category: 'follow-up' as NoteCategory, content: 'Call or message customer about job status' },
  { title: 'Pick up supplies', category: 'business-buy' as NoteCategory, content: 'Get supplies needed for jobs' },
  { title: 'Complete invoices', category: 'daily-task' as NoteCategory, content: 'Finish and send pending invoices' },
];

export default function ChecklistPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showCompleted, setShowCompleted] = useState(false);

  useEffect(() => {
    fetchNotes();
  }, [filterCategory, showCompleted]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      params.append('isDailyTask', 'true');
      if (filterCategory !== 'all') {
        params.append('category', filterCategory);
      }
      if (!showCompleted) {
        params.append('isCompleted', 'false');
      }
      
      const response = await fetch(`/api/notes?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch notes');
      }
      const data = await response.json();
      setNotes(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (noteId: string, completed: boolean) => {
    try {
      const response = await fetch(`/api/notes/${noteId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: completed }),
      });

      if (!response.ok) {
        throw new Error('Failed to update note');
      }

      fetchNotes();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleQuickAdd = async (template: typeof dailyTaskTemplates[0]) => {
    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: template.title,
          content: template.content,
          category: template.category,
          isDailyTask: true,
          priority: 'normal',
          dueDate: new Date().toISOString().split('T')[0],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create note');
      }

      fetchNotes();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDelete = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete note');
      }

      fetchNotes();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const stats = {
    total: notes.length,
    completed: notes.filter(n => n.isCompleted).length,
    pending: notes.filter(n => !n.isCompleted).length,
    overdue: notes.filter(n => {
      if (n.isCompleted || !n.dueDate) return false;
      try {
        return isPast(new Date(n.dueDate)) && !isToday(new Date(n.dueDate));
      } catch {
        return false;
      }
    }).length,
    today: notes.filter(n => {
      if (!n.dueDate) return false;
      try {
        return isToday(new Date(n.dueDate));
      } catch {
        return false;
      }
    }).length,
  };

  const pendingNotes = notes.filter(n => !n.isCompleted);
  const completedNotes = notes.filter(n => n.isCompleted);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-4 md:py-8">
        <div className="mb-4 md:mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              ✅ Daily Checklist
            </h1>
            <p className="text-sm md:text-base text-gray-600">
              Track your daily tasks and stay organized
            </p>
          </div>
          <Link
            href="/notes/new"
            className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors text-sm md:text-base text-center"
          >
            + Add Task
          </Link>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">Total Tasks</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">Pending</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">Completed</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold text-red-600">{stats.overdue}</div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">Overdue</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold text-purple-600">{stats.today}</div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">Due Today</div>
          </div>
        </div>

        {/* Quick Add Templates */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Quick Add Daily Tasks</h2>
          <div className="flex flex-wrap gap-2">
            {dailyTaskTemplates.map((template, index) => (
              <button
                key={index}
                onClick={() => handleQuickAdd(template)}
                className="px-3 py-2 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 text-sm font-medium transition-colors border border-blue-200"
              >
                + {template.title}
              </button>
            ))}
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
              {Object.entries(categoryLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showCompleted}
              onChange={(e) => setShowCompleted(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Show Completed</span>
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
            <p className="mt-4 text-gray-600">Loading checklist...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Pending Tasks */}
            {pendingNotes.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Pending Tasks ({pendingNotes.length})
                </h2>
                <div className="space-y-3">
                  {pendingNotes.map((note) => {
                    const isOverdue = note.dueDate && (() => {
                      try {
                        return isPast(new Date(note.dueDate!)) && !isToday(new Date(note.dueDate!));
                      } catch {
                        return false;
                      }
                    })();
                    const isDueToday = note.dueDate && (() => {
                      try {
                        return isToday(new Date(note.dueDate!));
                      } catch {
                        return false;
                      }
                    })();

                    return (
                      <div
                        key={note.id}
                        className={`bg-white rounded-lg shadow-md p-4 md:p-6 ${
                          isOverdue ? 'border-l-4 border-red-500' : isDueToday ? 'border-l-4 border-yellow-500' : ''
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <input
                            type="checkbox"
                            checked={note.isCompleted}
                            onChange={(e) => handleComplete(note.id, e.target.checked)}
                            className="mt-1 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <h3 className={`text-lg font-semibold ${note.isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                {note.title}
                              </h3>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium border ${
                                  categoryColors[note.category as NoteCategory]
                                }`}
                              >
                                {categoryLabels[note.category as NoteCategory]}
                              </span>
                              {isOverdue && (
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-300">
                                  ⚠️ Overdue
                                </span>
                              )}
                              {isDueToday && (
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-300">
                                  📅 Due Today
                                </span>
                              )}
                            </div>
                            {note.content && (
                              <p className="text-sm text-gray-600 mb-2">{note.content}</p>
                            )}
                            <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                              {note.dueDate && (
                                <span>
                                  Due: {(() => {
                                    try {
                                      return format(new Date(note.dueDate), 'MMM d, yyyy');
                                    } catch {
                                      return 'Invalid date';
                                    }
                                  })()}
                                </span>
                              )}
                              <span>
                                Created: {(() => {
                                  try {
                                    return format(new Date(note.createdAt), 'MMM d, yyyy');
                                  } catch {
                                    return 'Invalid date';
                                  }
                                })()}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDelete(note.id)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Completed Tasks */}
            {showCompleted && completedNotes.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Completed Tasks ({completedNotes.length})
                </h2>
                <div className="space-y-3">
                  {completedNotes.map((note) => (
                    <div
                      key={note.id}
                      className="bg-gray-50 rounded-lg shadow-md p-4 md:p-6 opacity-75"
                    >
                      <div className="flex items-start gap-4">
                        <input
                          type="checkbox"
                          checked={note.isCompleted}
                          onChange={(e) => handleComplete(note.id, e.target.checked)}
                          className="mt-1 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold line-through text-gray-500">
                              {note.title}
                            </h3>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium border ${
                                categoryColors[note.category as NoteCategory]
                              }`}
                            >
                              {categoryLabels[note.category as NoteCategory]}
                            </span>
                            {note.completedAt && (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-300">
                                ✓ Completed {(() => {
                                  try {
                                    return format(new Date(note.completedAt!), 'MMM d');
                                  } catch {
                                    return '';
                                  }
                                })()}
                              </span>
                            )}
                          </div>
                          {note.content && (
                            <p className="text-sm text-gray-600 mb-2">{note.content}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDelete(note.id)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pendingNotes.length === 0 && (!showCompleted || completedNotes.length === 0) && (
              <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                <p className="text-gray-600 mb-4">No tasks found.</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {dailyTaskTemplates.map((template, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickAdd(template)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
                    >
                      + {template.title}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

