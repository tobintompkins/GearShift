'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { Employee } from '@/lib/types';
import { format } from 'date-fns';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/employees');
      if (!response.ok) {
        throw new Error('Failed to fetch employees');
      }
      const data = await response.json();
      setEmployees(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this employee?')) {
      return;
    }

    try {
      const response = await fetch(`/api/employees/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete employee');
      }

      fetchEmployees();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleFormSubmit = async (data: any) => {
    try {
      setError(null);
      const url = editingEmployee
        ? `/api/employees/${editingEmployee.id}`
        : '/api/employees';
      const method = editingEmployee ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to save employee: ${response.status} ${response.statusText}`);
      }

      setShowForm(false);
      setEditingEmployee(null);
      fetchEmployees();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      console.error('Error saving employee:', err);
    }
  };

  if (showForm) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="container mx-auto px-4 py-4 md:py-8 max-w-4xl">
          <div className="mb-4 md:mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
            </h1>
            <p className="text-sm md:text-base text-gray-600">
              {editingEmployee
                ? 'Update employee information'
                : 'Add a new team member to your roster'}
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
                const emailValue = formData.get('email')?.toString().trim();
                const phoneValue = formData.get('phone')?.toString().trim();
                const photoValue = formData.get('photo')?.toString().trim();
                const skillsValue = formData.get('skills')?.toString().trim();
                handleFormSubmit({
                  firstName: formData.get('firstName')?.toString().trim(),
                  lastName: formData.get('lastName')?.toString().trim(),
                  email: emailValue && emailValue.length > 0 ? emailValue : undefined,
                  phone: phoneValue && phoneValue.length > 0 ? phoneValue : undefined,
                  photo: photoValue && photoValue.length > 0 ? photoValue : undefined,
                  skills: skillsValue && skillsValue.length > 0 ? skillsValue : undefined,
                  isActive: formData.get('isActive') === 'on',
                });
              }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    required
                    defaultValue={editingEmployee?.firstName || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    required
                    defaultValue={editingEmployee?.lastName || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    defaultValue={editingEmployee?.email || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    defaultValue={editingEmployee?.phone || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Photo URL
                  </label>
                  <input
                    type="url"
                    name="photo"
                    placeholder="https://example.com/photo.jpg or /photos/employee.jpg"
                    defaultValue={editingEmployee?.photo || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter a URL or path to the employee photo
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Skills
                  </label>
                  <input
                    type="text"
                    name="skills"
                    placeholder="e.g., brakes, diagnostics, AC, engine repair"
                    defaultValue={editingEmployee?.skills || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter skills separated by commas
                  </p>
                </div>

                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="isActive"
                      defaultChecked={editingEmployee?.isActive !== false}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Active</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                >
                  {editingEmployee ? 'Update Employee' : 'Add Employee'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingEmployee(null);
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
              Team Members
            </h1>
            <p className="text-sm md:text-base text-gray-600">
              Manage your team and assign jobs to employees
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/performance"
              className="w-full sm:w-auto bg-purple-600 text-white px-4 py-2 rounded-md font-medium hover:bg-purple-700 transition-colors text-sm md:text-base text-center"
            >
              📊 Performance
            </Link>
            <button
              onClick={() => {
                setEditingEmployee(null);
                setShowForm(true);
              }}
              className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors text-sm md:text-base"
            >
              + Add Employee
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading employees...</p>
          </div>
        ) : employees.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <p className="text-gray-600 mb-4">No employees yet.</p>
            <button
              onClick={() => {
                setEditingEmployee(null);
                setShowForm(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors"
            >
              Add Your First Employee
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {employees.map((employee) => (
              <div
                key={employee.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start gap-4 mb-4">
                  {employee.photo ? (
                    <img
                      src={employee.photo}
                      alt={`${employee.firstName} ${employee.lastName}`}
                      className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-lg">
                      {employee.firstName[0]}{employee.lastName[0]}
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {employee.firstName} {employee.lastName}
                    </h3>
                    <span
                      className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium ${
                        employee.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {employee.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-700 mb-4">
                  {employee.email && (
                    <p>
                      <strong>Email:</strong> {employee.email}
                    </p>
                  )}
                  {employee.phone && (
                    <p>
                      <strong>Phone:</strong> {employee.phone}
                    </p>
                  )}
                  {employee.skills && (
                    <div>
                      <strong>Skills:</strong>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {employee.skills.split(',').map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs"
                          >
                            {skill.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-gray-500">
                    Added: {format(new Date(employee.createdAt), 'MMM d, yyyy')}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Link
                    href={`/employees/${employee.id}`}
                    className="flex-1 bg-blue-600 text-white text-center py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    View Schedule
                  </Link>
                  <button
                    onClick={() => {
                      setEditingEmployee(employee);
                      setShowForm(true);
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors text-sm font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(employee.id)}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}


