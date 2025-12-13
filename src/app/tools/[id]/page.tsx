'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { Tool, ToolType, ToolCondition, Employee } from '@/lib/types';
import { format, isPast, addDays } from 'date-fns';

export default function ToolDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [tool, setTool] = useState<Tool | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [toolType, setToolType] = useState<ToolType>('wrench');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [condition, setCondition] = useState<ToolCondition>('good');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [purchasePrice, setPurchasePrice] = useState<number | ''>('');
  const [assignedToId, setAssignedToId] = useState<string>('');
  const [calibrationDate, setCalibrationDate] = useState('');
  const [calibrationDueDate, setCalibrationDueDate] = useState('');
  const [calibrationInterval, setCalibrationInterval] = useState<number | ''>('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  const toolTypes: ToolType[] = ['wrench', 'scanner', 'impact-gun', 'torque-wrench', 'jack', 'other'];
  const conditions: ToolCondition[] = ['excellent', 'good', 'fair', 'poor', 'needs-repair'];

  const toolTypeLabels: Record<ToolType, string> = {
    wrench: '🔧 Wrench',
    scanner: '📱 Scanner',
    'impact-gun': '🔨 Impact Gun',
    'torque-wrench': '⚙️ Torque Wrench',
    jack: '🔩 Jack',
    other: '🛠️ Other',
  };

  const conditionColors: Record<ToolCondition, string> = {
    excellent: 'bg-green-100 text-green-800',
    good: 'bg-blue-100 text-blue-800',
    fair: 'bg-yellow-100 text-yellow-800',
    poor: 'bg-orange-100 text-orange-800',
    'needs-repair': 'bg-red-100 text-red-800',
  };

  useEffect(() => {
    if (params.id) {
      fetchTool(params.id as string);
      fetchEmployees();
    }
  }, [params.id]);

  useEffect(() => {
    if (tool) {
      setName(tool.name);
      setToolType(tool.toolType);
      setBrand(tool.brand || '');
      setModel(tool.model || '');
      setSerialNumber(tool.serialNumber || '');
      setCondition(tool.condition);
      setPurchaseDate(tool.purchaseDate ? format(new Date(tool.purchaseDate), 'yyyy-MM-dd') : '');
      setPurchasePrice(tool.purchasePrice || '');
      setAssignedToId(tool.assignedToId || '');
      setCalibrationDate(tool.calibrationDate ? format(new Date(tool.calibrationDate), 'yyyy-MM-dd') : '');
      setCalibrationDueDate(tool.calibrationDueDate ? format(new Date(tool.calibrationDueDate), 'yyyy-MM-dd') : '');
      setCalibrationInterval(tool.calibrationInterval || '');
      setLocation(tool.location || '');
      setNotes(tool.notes || '');
    }
  }, [tool]);

  const fetchTool = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/tools/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch tool');
      }
      const data = await response.json();
      setTool(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees?activeOnly=true');
      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!name) {
        setError('Tool name is required');
        return;
      }

      const response = await fetch(`/api/tools/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          toolType,
          brand: brand || undefined,
          model: model || undefined,
          serialNumber: serialNumber || undefined,
          condition,
          purchaseDate: purchaseDate || undefined,
          purchasePrice: purchasePrice !== '' ? purchasePrice : undefined,
          assignedToId: assignedToId || undefined,
          calibrationDate: calibrationDate || undefined,
          calibrationDueDate: calibrationDueDate || undefined,
          calibrationInterval: calibrationInterval !== '' ? calibrationInterval : undefined,
          location: location || undefined,
          notes: notes || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update tool');
      }

      const updated = await response.json();
      setTool(updated);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this tool?')) return;

    try {
      const response = await fetch(`/api/tools/${params.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete tool');
      router.push('/tools');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  if (loading && !tool) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading tool...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !tool) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <p className="text-red-600 mb-4">{error || 'Tool not found'}</p>
            <Link
              href="/tools"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Back to Tools
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const isCalibrationOverdue = tool.calibrationDueDate && isPast(new Date(tool.calibrationDueDate));
  const isCalibrationDueSoon = tool.calibrationDueDate && !isPast(new Date(tool.calibrationDueDate)) && new Date(tool.calibrationDueDate) <= addDays(new Date(), 30);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-4 md:py-8 max-w-3xl">
        <div className="mb-4 md:mb-6">
          <Link
            href="/tools"
            className="text-blue-600 hover:text-blue-800 mb-2 inline-block text-sm"
          >
            ← Back to Tools
          </Link>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                {tool.name}
              </h1>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{toolTypeLabels[tool.toolType]}</span>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    conditionColors[tool.condition as ToolCondition] || conditionColors.good
                  }`}
                >
                  {tool.condition.charAt(0).toUpperCase() + tool.condition.slice(1).replace('-', ' ')}
                </span>
                {isCalibrationOverdue && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                    ⚠️ Calibration Overdue
                  </span>
                )}
                {isCalibrationDueSoon && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                    ⏰ Calibration Due Soon
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
            {/* Same form fields as new tool page */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tool Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tool Type *
                </label>
                <select
                  required
                  value={toolType}
                  onChange={(e) => setToolType(e.target.value as ToolType)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {toolTypes.map(type => (
                    <option key={type} value={type}>{toolTypeLabels[type]}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Condition *
                </label>
                <select
                  required
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as ToolCondition)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {conditions.map(cond => (
                    <option key={cond} value={cond}>
                      {cond.charAt(0).toUpperCase() + cond.slice(1).replace('-', ' ')}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Brand
                </label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Model
                </label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Serial Number
              </label>
              <input
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assign to Employee
              </label>
              <select
                value={assignedToId}
                onChange={(e) => setAssignedToId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Unassigned --</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Purchase Date
                </label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Purchase Price
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value ? parseFloat(e.target.value) : '')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Calibration Date
                </label>
                <input
                  type="date"
                  value={calibrationDate}
                  onChange={(e) => setCalibrationDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Calibration Due Date
                </label>
                <input
                  type="date"
                  value={calibrationDueDate}
                  onChange={(e) => setCalibrationDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Calibration Interval (days)
              </label>
              <input
                type="number"
                min="1"
                value={calibrationInterval}
                onChange={(e) => setCalibrationInterval(e.target.value ? parseInt(e.target.value) : '')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

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
                  fetchTool(params.id as string);
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
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Tool Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {tool.brand && (
                  <div>
                    <span className="font-medium text-gray-700">Brand:</span>
                    <p className="text-gray-900">{tool.brand}{tool.model ? ` ${tool.model}` : ''}</p>
                  </div>
                )}
                {tool.serialNumber && (
                  <div>
                    <span className="font-medium text-gray-700">Serial Number:</span>
                    <p className="text-gray-900">{tool.serialNumber}</p>
                  </div>
                )}
                {tool.assignedTo && (
                  <div>
                    <span className="font-medium text-gray-700">Assigned to:</span>
                    <p className="text-gray-900">{tool.assignedTo.firstName} {tool.assignedTo.lastName}</p>
                  </div>
                )}
                {tool.location && (
                  <div>
                    <span className="font-medium text-gray-700">Location:</span>
                    <p className="text-gray-900">{tool.location}</p>
                  </div>
                )}
                {tool.purchaseDate && (
                  <div>
                    <span className="font-medium text-gray-700">Purchase Date:</span>
                    <p className="text-gray-900">{format(new Date(tool.purchaseDate), 'MMMM d, yyyy')}</p>
                  </div>
                )}
                {tool.purchasePrice && (
                  <div>
                    <span className="font-medium text-gray-700">Purchase Price:</span>
                    <p className="text-gray-900">${tool.purchasePrice.toFixed(2)}</p>
                  </div>
                )}
              </div>
            </div>

            {tool.calibrationDate || tool.calibrationDueDate ? (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Calibration</h2>
                <div className="space-y-2 text-sm text-gray-700">
                  {tool.calibrationDate && (
                    <div>
                      <span className="font-medium">Last Calibration:</span>{' '}
                      {format(new Date(tool.calibrationDate), 'MMMM d, yyyy')}
                    </div>
                  )}
                  {tool.calibrationDueDate && (
                    <div className={isCalibrationOverdue ? 'text-red-600 font-semibold' : isCalibrationDueSoon ? 'text-yellow-600 font-semibold' : ''}>
                      <span className="font-medium">Next Calibration Due:</span>{' '}
                      {format(new Date(tool.calibrationDueDate), 'MMMM d, yyyy')}
                      {isCalibrationOverdue && ' ⚠️ Overdue'}
                      {isCalibrationDueSoon && ' ⏰ Due Soon'}
                    </div>
                  )}
                  {tool.calibrationInterval && (
                    <div>
                      <span className="font-medium">Calibration Interval:</span>{' '}
                      {tool.calibrationInterval} days
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {tool.notes && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Notes</h2>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{tool.notes}</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}


