'use client';

import { useState, FormEvent, useEffect } from 'react';
import { JobFormData, JobStatus, Employee, Customer, Vehicle, ServiceTemplate, JobTemplate, UrgentType } from '@/lib/types';

interface JobFormProps {
  initialData?: Partial<JobFormData>;
  onSubmit: (data: JobFormData) => Promise<void>;
  onCancel?: () => void;
  customerId?: string;
  templateId?: string;
}

export default function JobForm({ initialData, onSubmit, onCancel, customerId, templateId }: JobFormProps) {
  const customerIdParam = customerId;
  const [jobTemplates, setJobTemplates] = useState<JobTemplate[]>([]);
  const [loadingJobTemplates, setLoadingJobTemplates] = useState(true);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(templateId || '');

  const [formData, setFormData] = useState<JobFormData>({
    date: initialData?.date || new Date().toISOString().split('T')[0],
    startTime: initialData?.startTime || '',
    endTime: initialData?.endTime || '',
    duration: initialData?.duration || undefined,
    customerFirstName: initialData?.customerFirstName || '',
    customerLastName: initialData?.customerLastName || '',
    customerPhone: initialData?.customerPhone || '',
    customerAddress: initialData?.customerAddress || '',
    vehicleInfo: initialData?.vehicleInfo || '',
    serviceType: initialData?.serviceType || '',
    status: initialData?.status || 'pending',
    price: initialData?.price || undefined,
    urgent: initialData?.urgent || false,
    urgentType: initialData?.urgentType || undefined,
    employeeId: initialData?.employeeId || undefined,
    customerId: initialData?.customerId || (customerIdParam || undefined),
    vehicleId: initialData?.vehicleId || (initialData as any)?.vehicleId || undefined,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerVehicles, setCustomerVehicles] = useState<Vehicle[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [serviceTemplates, setServiceTemplates] = useState<ServiceTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await fetch('/api/employees');
        if (response.ok) {
          const data = await response.json();
          setEmployees(data.filter((emp: Employee) => emp.isActive));
        }
      } catch (error) {
        console.error('Error fetching employees:', error);
      } finally {
        setLoadingEmployees(false);
      }
    };

    const fetchServiceTemplates = async () => {
      try {
        const response = await fetch('/api/services');
        if (response.ok) {
          const data = await response.json();
          setServiceTemplates(data.filter((template: ServiceTemplate) => template.isActive));
        }
      } catch (error) {
        console.error('Error fetching service templates:', error);
      } finally {
        setLoadingTemplates(false);
      }
    };

    const fetchJobTemplates = async () => {
      try {
        const response = await fetch('/api/job-templates?activeOnly=true');
        if (response.ok) {
          const data = await response.json();
          setJobTemplates(data);
        }
      } catch (error) {
        console.error('Error fetching job templates:', error);
      } finally {
        setLoadingJobTemplates(false);
      }
    };

    fetchEmployees();
    fetchServiceTemplates();
    fetchJobTemplates();
  }, []);

  // Handle vehicleId from initialData (when coming from vehicle page)
  useEffect(() => {
    const vehicleIdFromProps = (initialData as any)?.vehicleId;
    if (vehicleIdFromProps && !selectedCustomer) {
      const fetchVehicleAndCustomer = async () => {
        try {
          const response = await fetch(`/api/vehicles/${vehicleIdFromProps}`);
          if (response.ok) {
            const vehicleData = await response.json();
            if (vehicleData.customer) {
              const customer = vehicleData.customer;
              const vehicle = vehicleData;
              setSelectedCustomer(customer);
              setCustomerSearch(`${customer.firstName} ${customer.lastName}`);
              
              // Build vehicle info string
              const vehicleInfo = [
                vehicle.year,
                vehicle.make,
                vehicle.model,
                vehicle.engine && `Engine: ${vehicle.engine}`,
                vehicle.mileage && `Mileage: ${vehicle.mileage.toLocaleString()} mi`,
                vehicle.licensePlate && `Plate: ${vehicle.licensePlate}`,
                vehicle.vin && `VIN: ${vehicle.vin}`,
              ].filter(Boolean).join(', ');
              
              setFormData(prev => ({
                ...prev,
                customerId: customer.id,
                customerFirstName: customer.firstName,
                customerLastName: customer.lastName,
                customerPhone: customer.phone,
                customerAddress: customer.address || '',
                vehicleId: vehicleIdFromProps,
                vehicleInfo,
              }));
              // Fetch vehicles for this customer
              fetchVehicles(customer.id);
            }
          }
        } catch (error) {
          console.error('Error fetching vehicle:', error);
        }
      };
      fetchVehicleAndCustomer();
    }
  }, [initialData]);

  // Load customer if customerId is provided
  useEffect(() => {
    if (formData.customerId) {
      fetch(`/api/customers/${formData.customerId}`)
        .then(res => res.json())
        .then(customer => {
          setSelectedCustomer(customer);
          setFormData(prev => ({
            ...prev,
            customerFirstName: customer.firstName,
            customerLastName: customer.lastName,
            customerPhone: customer.phone,
            customerAddress: customer.address || '',
          }));
          fetchVehicles(customer.id);
        })
        .catch(console.error);
    }
  }, [formData.customerId]);

  // Load template if templateId is provided
  useEffect(() => {
    if (templateId) {
      setSelectedTemplateId(templateId);
      fetch(`/api/job-templates/${templateId}`)
        .then(res => res.json())
        .then(template => {
          setFormData(prev => ({
            ...prev,
            serviceType: template.serviceType || prev.serviceType,
            duration: template.duration || prev.duration,
            price: template.price || prev.price,
          }));
        })
        .catch(console.error);
    }
  }, [templateId]);

  const handleTemplateSelect = (template: JobTemplate) => {
    setSelectedTemplateId(template.id);
    setFormData(prev => ({
      ...prev,
      serviceType: template.serviceType,
      duration: template.duration || prev.duration,
      price: template.price || prev.price,
    }));
  };

  const fetchVehicles = async (customerId: string) => {
    setLoadingVehicles(true);
    try {
      const response = await fetch(`/api/customers/${customerId}/vehicles`);
      if (response.ok) {
        const data = await response.json();
        setCustomerVehicles(data);
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoadingVehicles(false);
    }
  };

  const searchCustomers = async (search: string) => {
    if (search.length < 2) {
      setCustomers([]);
      return;
    }
    setLoadingCustomers(true);
    try {
      const response = await fetch(`/api/customers?search=${encodeURIComponent(search)}`);
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      }
    } catch (error) {
      console.error('Error searching customers:', error);
    } finally {
      setLoadingCustomers(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (customerSearch) {
        searchCustomers(customerSearch);
      } else {
        setCustomers([]);
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [customerSearch]);

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerSearch(`${customer.firstName} ${customer.lastName}`);
    setCustomers([]);
    setFormData(prev => ({
      ...prev,
      customerId: customer.id,
      customerFirstName: customer.firstName,
      customerLastName: customer.lastName,
      customerPhone: customer.phone,
      customerAddress: customer.address || '',
      vehicleId: undefined,
    }));
    fetchVehicles(customer.id);
  };

  const handleVehicleSelect = (vehicle: Vehicle) => {
    const vehicleInfo = [
      vehicle.year,
      vehicle.make,
      vehicle.model,
      vehicle.engine && `Engine: ${vehicle.engine}`,
      vehicle.mileage && `Mileage: ${vehicle.mileage.toLocaleString()} mi`,
      vehicle.licensePlate && `Plate: ${vehicle.licensePlate}`,
      vehicle.vin && `VIN: ${vehicle.vin}`,
    ]
      .filter(Boolean)
      .join(', ');
    
    setFormData(prev => ({
      ...prev,
      vehicleId: vehicle.id,
      vehicleInfo,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateDuration = () => {
    if (formData.startTime && formData.endTime) {
      const start = new Date(`2000-01-01T${formData.startTime}`);
      const end = new Date(`2000-01-01T${formData.endTime}`);
      const diff = (end.getTime() - start.getTime()) / (1000 * 60);
      if (diff > 0) {
        setFormData({ ...formData, duration: Math.round(diff) });
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6 p-4 md:p-6 bg-white rounded-lg shadow-md">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date *
          </label>
          <input
            type="date"
            required
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status *
          </label>
          <select
            required
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as JobStatus })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="awaiting-parts">Awaiting Parts</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Assign to Employee
          </label>
          <select
            value={formData.employeeId || ''}
            onChange={(e) => setFormData({ ...formData, employeeId: e.target.value || undefined })}
            disabled={loadingEmployees}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">No assignment</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.firstName} {employee.lastName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Time *
          </label>
          <input
            type="time"
            required
            value={formData.startTime}
            onChange={(e) => {
              setFormData({ ...formData, startTime: e.target.value });
              calculateDuration();
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End Time
          </label>
          <input
            type="time"
            value={formData.endTime || ''}
            onChange={(e) => {
              setFormData({ ...formData, endTime: e.target.value });
              calculateDuration();
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Duration (minutes)
          </label>
          <input
            type="number"
            value={formData.duration || ''}
            onChange={(e) => setFormData({ ...formData, duration: e.target.value ? parseInt(e.target.value) : undefined })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Service Type *
          </label>
          {jobTemplates.length > 0 && (
            <div className="mb-2">
              <p className="text-xs text-gray-600 mb-2">Job Templates (Quick Add):</p>
              <div className="flex flex-wrap gap-1.5 md:gap-2">
                {jobTemplates.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => handleTemplateSelect(template)}
                    className={`px-2 md:px-3 py-1 md:py-1.5 rounded-md text-xs md:text-sm font-medium transition-colors border ${
                      selectedTemplateId === template.id
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200'
                    }`}
                  >
                    {template.name}
                    {template.duration && ` (${template.duration}min)`}
                  </button>
                ))}
              </div>
            </div>
          )}
          {serviceTemplates.length > 0 && (
            <div className="mb-2">
              <p className="text-xs text-gray-600 mb-2">Service Templates:</p>
              <div className="flex flex-wrap gap-1.5 md:gap-2">
                {serviceTemplates.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        serviceType: template.name,
                        duration: template.duration || prev.duration,
                      }));
                    }}
                    className="px-2 md:px-3 py-1 md:py-1.5 bg-gray-50 text-gray-700 rounded-md hover:bg-gray-100 text-xs md:text-sm font-medium transition-colors border border-gray-200"
                  >
                    {template.name}
                    {template.duration && ` (${template.duration}min)`}
                  </button>
                ))}
              </div>
            </div>
          )}
          <input
            type="text"
            required
            value={formData.serviceType}
            onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
            placeholder="e.g., Oil Change, Brake Repair"
            className="w-full px-3 py-2 text-base md:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search Existing Customer (optional)
          </label>
          <div className="relative">
            <input
              type="text"
              value={customerSearch}
              onChange={(e) => {
                setCustomerSearch(e.target.value);
                if (!e.target.value) {
                  setSelectedCustomer(null);
                  setFormData(prev => ({
                    ...prev,
                    customerId: undefined,
                    vehicleId: undefined,
                  }));
                }
              }}
              placeholder="Type to search by name, phone, or email..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {customers.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                {customers.map((customer) => (
                  <button
                    key={customer.id}
                    type="button"
                    onClick={() => handleCustomerSelect(customer)}
                    className="w-full text-left px-4 py-2 hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-medium">{customer.firstName} {customer.lastName}</div>
                    <div className="text-sm text-gray-600">{customer.phone}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
          {selectedCustomer && (
            <p className="mt-1 text-sm text-green-600">
              ✓ Selected: {selectedCustomer.firstName} {selectedCustomer.lastName}
            </p>
          )}
        </div>

        {selectedCustomer && customerVehicles.length > 0 && (
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Vehicle
            </label>
            <select
              value={formData.vehicleId || ''}
              onChange={(e) => {
                const vehicle = customerVehicles.find(v => v.id === e.target.value);
                if (vehicle) handleVehicleSelect(vehicle);
                else {
                  setFormData(prev => ({
                    ...prev,
                    vehicleId: undefined,
                  }));
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a vehicle or enter manually below</option>
              {customerVehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.year && `${vehicle.year} `}
                  {vehicle.make} {vehicle.model}
                  {vehicle.licensePlate && ` - ${vehicle.licensePlate}`}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Customer First Name *
          </label>
          <input
            type="text"
            required
            value={formData.customerFirstName}
            onChange={(e) => setFormData({ ...formData, customerFirstName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Customer Last Name *
          </label>
          <input
            type="text"
            required
            value={formData.customerLastName}
            onChange={(e) => setFormData({ ...formData, customerLastName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Customer Phone *
          </label>
          <input
            type="tel"
            required
            value={formData.customerPhone}
            onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
            placeholder="(555) 123-4567"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Customer Address *
          </label>
          <textarea
            required
            value={formData.customerAddress}
            onChange={(e) => setFormData({ ...formData, customerAddress: e.target.value })}
            rows={2}
            placeholder="Street address, City, State, ZIP"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Vehicle Info *
          </label>
          <textarea
            required
            value={formData.vehicleInfo}
            onChange={(e) => setFormData({ ...formData, vehicleInfo: e.target.value })}
            rows={2}
            placeholder="Year, Make, Model, License Plate, VIN (if available)"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Price ($)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={formData.price || ''}
            onChange={(e) => setFormData({ ...formData, price: e.target.value ? parseFloat(e.target.value) : undefined })}
            placeholder="0.00"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-3">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.urgent || false}
              onChange={(e) => setFormData({ ...formData, urgent: e.target.checked, urgentType: e.target.checked ? formData.urgentType : undefined })}
              className="rounded border-gray-300 text-red-600 focus:ring-red-500"
            />
            <span className="text-sm font-medium text-gray-700">Mark as Urgent ⚠️</span>
          </label>
          {formData.urgent && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Urgent Type *
              </label>
              <select
                required={formData.urgent}
                value={formData.urgentType || ''}
                onChange={(e) => setFormData({ ...formData, urgentType: e.target.value as UrgentType })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">-- Select Urgent Type --</option>
                <option value="emergency">🚨 Emergency</option>
                <option value="breakdown">⚠️ Breakdown</option>
                <option value="no-start">🔋 No-Start</option>
                <option value="safety-issue">🛡️ Safety Issue</option>
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Saving...' : 'Save Job'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}



