'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { Tool, ToolType, ToolCondition } from '@/lib/types';
import { format, isPast, addDays } from 'date-fns';

export default function ToolsPage() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCondition, setFilterCondition] = useState<string>('all');
  const [filterAssigned, setFilterAssigned] = useState<string>('all');
  const [showCalibrationAlerts, setShowCalibrationAlerts] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);

  const toolTypes: ToolType[] = ['wrench', 'scanner', 'impact-gun', 'torque-wrench', 'jack', 'other'];
  const conditions: ToolCondition[] = ['excellent', 'good', 'fair', 'poor', 'needs-repair'];

  useEffect(() => {
    fetchTools();
    fetchEmployees();
  }, [filterType, filterCondition, filterAssigned, showCalibrationAlerts]);

  const fetchTools = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (filterType !== 'all') {
        params.append('toolType', filterType);
      }
      if (filterCondition !== 'all') {
        params.append('condition', filterCondition);
      }
      if (filterAssigned !== 'all') {
        params.append('assignedToId', filterAssigned);
      }
      if (showCalibrationAlerts) {
        params.append('calibrationDue', 'overdue');
      }
      params.append('activeOnly', 'true');
      
      const response = await fetch(`/api/tools?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch tools');
      }
      const data = await response.json();
      setTools(Array.isArray(data) ? data : []);
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

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tool?')) {
      return;
    }

    try {
      const response = await fetch(`/api/tools/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete tool');
      }

      fetchTools();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const conditionColors: Record<ToolCondition, string> = {
    excellent: 'bg-green-100 text-green-800',
    good: 'bg-blue-100 text-blue-800',
    fair: 'bg-yellow-100 text-yellow-800',
    poor: 'bg-orange-100 text-orange-800',
    'needs-repair': 'bg-red-100 text-red-800',
  };

  const toolTypeLabels: Record<ToolType, string> = {
    wrench: '🔧 Wrench',
    scanner: '📱 Scanner',
    'impact-gun': '🔨 Impact Gun',
    'torque-wrench': '⚙️ Torque Wrench',
    jack: '🔩 Jack',
    other: '🛠️ Other',
  };

  const stats = {
    total: tools.length,
    byType: toolTypes.reduce((acc, type) => {
      acc[type] = tools.filter(t => t.toolType === type).length;
      return acc;
    }, {} as Record<ToolType, number>),
    calibrationOverdue: tools.filter(t => {
      if (!t.calibrationDueDate) return false;
      try {
        return isPast(new Date(t.calibrationDueDate));
      } catch {
        return false;
      }
    }).length,
    calibrationDueSoon: tools.filter(t => {
      if (!t.calibrationDueDate) return false;
      try {
        const dueDate = new Date(t.calibrationDueDate);
        const thirtyDaysFromNow = addDays(new Date(), 30);
        return !isPast(dueDate) && dueDate <= thirtyDaysFromNow;
      } catch {
        return false;
      }
    }).length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-4 md:py-8">
        <div className="mb-4 md:mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Tool Inventory
            </h1>
            <p className="text-sm md:text-base text-gray-600">
              Track your tools, their condition, and calibration reminders
            </p>
          </div>
          <Link
            href="/tools/new"
            className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors text-sm md:text-base text-center"
          >
            + Add Tool
          </Link>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">Total Tools</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold text-red-600">{stats.calibrationOverdue}</div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">Calibration Overdue</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold text-yellow-600">{stats.calibrationDueSoon}</div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">Due Soon (30 days)</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl md:text-3xl font-bold text-green-600">
              {tools.filter(t => t.condition === 'excellent' || t.condition === 'good').length}
            </div>
            <div className="text-xs md:text-sm text-gray-600 mt-1">Good Condition</div>
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
              {toolTypes.map(type => (
                <option key={type} value={type}>{toolTypeLabels[type]}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Condition:</label>
            <select
              value={filterCondition}
              onChange={(e) => setFilterCondition(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="all">All Conditions</option>
              {conditions.map(cond => (
                <option key={cond} value={cond}>{cond.charAt(0).toUpperCase() + cond.slice(1).replace('-', ' ')}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Assigned To:</label>
            <select
              value={filterAssigned}
              onChange={(e) => setFilterAssigned(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="all">All Employees</option>
              <option value="unassigned">Unassigned</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
              ))}
            </select>
          </div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showCalibrationAlerts}
              onChange={(e) => setShowCalibrationAlerts(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Show Calibration Overdue Only</span>
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
            <p className="mt-4 text-gray-600">Loading tools...</p>
          </div>
        ) : tools.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <p className="text-gray-600 mb-4">No tools found.</p>
            <Link
              href="/tools/new"
              className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors"
            >
              Add Your First Tool
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tools.map((tool) => {
              let isCalibrationOverdue = false;
              let isCalibrationDueSoon = false;
              
              if (tool.calibrationDueDate) {
                try {
                  const dueDate = new Date(tool.calibrationDueDate);
                  isCalibrationOverdue = isPast(dueDate);
                  if (!isCalibrationOverdue) {
                    const thirtyDaysFromNow = addDays(new Date(), 30);
                    isCalibrationDueSoon = dueDate <= thirtyDaysFromNow;
                  }
                } catch (e) {
                  // Invalid date, skip
                }
              }
              
              return (
                <div
                  key={tool.id}
                  className={`bg-white rounded-lg shadow-md p-4 md:p-6 ${
                    isCalibrationOverdue ? 'border-l-4 border-red-500' : ''
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {tool.name}
                      </h3>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm text-gray-600">
                          {toolTypeLabels[tool.toolType]}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            conditionColors[tool.condition as ToolCondition] || conditionColors.good
                          }`}
                        >
                          {tool.condition.charAt(0).toUpperCase() + tool.condition.slice(1).replace('-', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-gray-700 mb-4">
                    {tool.brand && (
                      <div>
                        <span className="font-medium">Brand:</span> {tool.brand}
                        {tool.model && ` ${tool.model}`}
                      </div>
                    )}
                    {tool.serialNumber && (
                      <div>
                        <span className="font-medium">Serial:</span> {tool.serialNumber}
                      </div>
                    )}
                    {tool.assignedTo && (
                      <div>
                        <span className="font-medium">Assigned to:</span>{' '}
                        <span className="text-blue-600">
                          {tool.assignedTo.firstName} {tool.assignedTo.lastName}
                        </span>
                      </div>
                    )}
                    {tool.location && (
                      <div>
                        <span className="font-medium">Location:</span> {tool.location}
                      </div>
                    )}
                    {tool.purchaseDate && (
                      <div>
                        <span className="font-medium">Purchased:</span>{' '}
                        {(() => {
                          try {
                            return format(new Date(tool.purchaseDate), 'MMM d, yyyy');
                          } catch {
                            return 'Invalid date';
                          }
                        })()}
                      </div>
                    )}
                    {tool.calibrationDueDate && (
                      <div className={isCalibrationOverdue ? 'text-red-600 font-semibold' : isCalibrationDueSoon ? 'text-yellow-600 font-semibold' : ''}>
                        <span className="font-medium">Calibration Due:</span>{' '}
                        {(() => {
                          try {
                            return format(new Date(tool.calibrationDueDate!), 'MMM d, yyyy');
                          } catch {
                            return 'Invalid date';
                          }
                        })()}
                        {isCalibrationOverdue && ' ⚠️ Overdue'}
                        {isCalibrationDueSoon && ' ⏰ Due Soon'}
                      </div>
                    )}
                  </div>

                  {tool.notes && (
                    <div className="mb-4 text-sm text-gray-600">
                      <span className="font-medium">Notes:</span> {tool.notes}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Link
                      href={`/tools/${tool.id}`}
                      className="flex-1 bg-blue-100 text-blue-700 px-3 py-2 rounded-md text-xs font-medium hover:bg-blue-200 transition-colors text-center"
                    >
                      View/Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(tool.id)}
                      className="flex-1 bg-red-100 text-red-700 px-3 py-2 rounded-md text-xs font-medium hover:bg-red-200 transition-colors"
                    >
                      Delete
                    </button>
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


