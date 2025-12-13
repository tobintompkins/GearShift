'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { Note, NoteCategory, NotePriority } from '@/lib/types';
import { format, isPast, isToday, isTomorrow } from 'date-fns';

const categoryLabels: Record<NoteCategory, string> = {
  'parts-pickup': 'Parts to Pick Up',
  'callback': 'Jobs Waiting on Callbacks',
  'follow-up': 'Customers to Follow Up',
  'business-buy': 'Things to Buy for Business',
  'tools': 'Tools Needed',
  'daily-task': 'Daily Task',
};

const categoryColors: Record<NoteCategory, string> = {
  'parts-pickup': 'bg-blue-100 text-blue-800 border-blue-300',
  'callback': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'follow-up': 'bg-green-100 text-green-800 border-green-300',
  'business-buy': 'bg-purple-100 text-purple-800 border-purple-300',
  'tools': 'bg-orange-100 text-orange-800 border-orange-300',
  'daily-task': 'bg-indigo-100 text-indigo-800 border-indigo-300',
};

const priorityColors: Record<NotePriority, string> = {
  low: 'bg-gray-100 text-gray-700',
  normal: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
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
      if (filterCategory !== 'all') {
        params.append('category', filterCategory);
      }
      params.append('completed', showCompleted.toString());
      const response = await fetch(`/api/notes?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch notes');
      }
      const data = await response.json();
      setNotes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this note?')) {
      return;
    }

    try {
      const response = await fetch(`/api/notes/${id}`, {
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

  const handleToggleComplete = async (note: Note) => {
    try {
      const response = await fetch(`/api/notes/${note.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !note.isCompleted }),
      });

      if (!response.ok) {
        throw new Error('Failed to update note');
      }

      fetchNotes();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleFormSubmit = async (data: any) => {
    try {
      setError(null);
      const url = editingNote
        ? `/api/notes/${editingNote.id}`
        : '/api/notes';
      const method = editingNote ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          title: data.title || editingNote?.title || '',
          category: data.category || editingNote?.category || 'daily-task',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to save note: ${response.status} ${response.statusText}`);
      }

      setShowForm(false);
      setEditingNote(null);
      fetchNotes();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      console.error('Error saving note:', err);
    }
  };

  const formatDueDate = (date: Date | null): string => {
    if (!date) return '';
    if (isPast(date) && !isToday(date)) return `Overdue: ${format(date, 'MMM d, yyyy')}`;
    if (isToday(date)) return 'Due Today';
    if (isTomorrow(date)) return 'Due Tomorrow';
    return `Due: ${format(date, 'MMM d, yyyy')}`;
  };

  const getDueDateClass = (date: Date | null): string => {
    if (!date) return '';
    if (isPast(date) && !isToday(date)) return 'text-red-600 font-semibold';
    if (isToday(date)) return 'text-orange-600 font-semibold';
    return 'text-gray-600';
  };

  const categories: NoteCategory[] = ['parts-pickup', 'callback', 'follow-up', 'business-buy', 'tools', 'daily-task'];
  const priorities: NotePriority[] = ['low', 'normal', 'high', 'urgent'];

  const activeNotes = notes.filter(n => !n.isCompleted);
  const completedNotes = notes.filter(n => n.isCompleted);

  if (showForm) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="container mx-auto px-4 py-4 md:py-8 max-w-4xl">
          <div className="mb-4 md:mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              {editingNote ? 'Edit Note' : 'Add New Note'}
            </h1>
            <p className="text-sm md:text-base text-gray-600">
              {editingNote ? 'Update note information' : 'Create a new note or to-do item'}
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
                  title: formData.get('title')?.toString().trim(),
                  content: formData.get('content')?.toString().trim(),
                  category: formData.get('category')?.toString() as NoteCategory,
                  priority: formData.get('priority')?.toString() as NotePriority || 'normal',
                  isDailyTask: formData.get('isDailyTask') === 'on',
                  dueDate: formData.get('dueDate')?.toString(),
                });
              }}
              className="space-y-6"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  defaultValue={editingNote?.title || ''}
                  placeholder="e.g., Pick up brake pads from AutoZone"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  name="category"
                  required
                  defaultValue={editingNote?.category || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Select Category --</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{categoryLabels[cat]}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    name="priority"
                    defaultValue={editingNote?.priority || 'normal'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {priorities.map(pri => (
                      <option key={pri} value={pri}>
                        {pri.charAt(0).toUpperCase() + pri.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date (Optional)
                  </label>
                  <input
                    type="date"
                    name="dueDate"
                    defaultValue={editingNote?.dueDate ? format(new Date(editingNote.dueDate), 'yyyy-MM-dd') : ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="isDailyTask"
                    defaultChecked={editingNote?.isDailyTask || false}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Mark as Daily Task (appears in Daily Checklist)</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Details
                </label>
                <textarea
                  name="content"
                  rows={4}
                  defaultValue={editingNote?.content || ''}
                  placeholder="Add any additional notes or details..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                >
                  {editingNote ? 'Update Note' : 'Add Note'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingNote(null);
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
              Notes & To-Do
            </h1>
            <p className="text-sm md:text-base text-gray-600">
              Keep track of important tasks and reminders
            </p>
          </div>
          <button
            onClick={() => {
              setEditingNote(null);
              setShowForm(true);
            }}
            className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors text-sm md:text-base"
          >
            + Add Note
          </button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {categories.map(category => {
            const count = activeNotes.filter(n => n.category === category).length;
            return (
              <div key={category} className="bg-white rounded-lg shadow-md p-4 text-center">
                <div className={`text-2xl md:text-3xl font-bold ${categoryColors[category].split(' ')[1]}`}>
                  {count}
                </div>
                <div className="text-xs md:text-sm text-gray-600 mt-1">
                  {categoryLabels[category]}
                </div>
              </div>
            );
          })}
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
                <option key={cat} value={cat}>{categoryLabels[cat]}</option>
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
            <p className="mt-4 text-gray-600">Loading notes...</p>
          </div>
        ) : activeNotes.length === 0 && !showCompleted ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <p className="text-gray-600 mb-4">No active notes. Great job staying organized!</p>
            <button
              onClick={() => {
                setEditingNote(null);
                setShowForm(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors"
            >
              Add Your First Note
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Active Notes */}
            {activeNotes.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Active Notes ({activeNotes.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeNotes.map((note) => (
                    <div
                      key={note.id}
                      className={`bg-white rounded-lg shadow-md p-5 border-l-4 ${
                        categoryColors[note.category].split(' ')[2]
                      } ${note.isCompleted ? 'opacity-60' : ''}`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${categoryColors[note.category]}`}>
                              {categoryLabels[note.category]}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${priorityColors[note.priority]}`}>
                              {note.priority}
                            </span>
                          </div>
                          <h3 className="font-semibold text-gray-900 mb-2">
                            {note.title}
                          </h3>
                          {note.content && (
                            <p className="text-sm text-gray-600 mb-3">
                              {note.content}
                            </p>
                          )}
                          {note.dueDate && (
                            <p className={`text-xs ${getDueDateClass(note.dueDate)}`}>
                              {formatDueDate(note.dueDate)}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => handleToggleComplete(note)}
                          className="flex-1 bg-green-100 text-green-700 py-2 px-3 rounded-md hover:bg-green-200 transition-colors text-sm font-medium"
                        >
                          ✓ Complete
                        </button>
                        <button
                          onClick={() => {
                            setEditingNote(note);
                            setShowForm(true);
                          }}
                          className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(note.id)}
                          className="px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Completed Notes */}
            {showCompleted && completedNotes.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Completed Notes ({completedNotes.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {completedNotes.map((note) => (
                    <div
                      key={note.id}
                      className="bg-gray-50 rounded-lg shadow-md p-5 border-l-4 border-gray-300 opacity-75"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-1 rounded text-xs font-medium bg-gray-200 text-gray-700">
                              {categoryLabels[note.category]}
                            </span>
                          </div>
                          <h3 className="font-semibold text-gray-700 mb-2 line-through">
                            {note.title}
                          </h3>
                          {note.content && (
                            <p className="text-sm text-gray-500 mb-3">
                              {note.content}
                            </p>
                          )}
                          {note.completedAt && (
                            <p className="text-xs text-gray-500">
                              Completed: {format(new Date(note.completedAt), 'MMM d, yyyy')}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => handleToggleComplete(note)}
                          className="flex-1 bg-blue-100 text-blue-700 py-2 px-3 rounded-md hover:bg-blue-200 transition-colors text-sm font-medium"
                        >
                          Undo
                        </button>
                        <button
                          onClick={() => handleDelete(note.id)}
                          className="px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
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


