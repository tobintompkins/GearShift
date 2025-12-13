import { Job } from '@/lib/types';
import { format } from 'date-fns';
import Link from 'next/link';

interface JobCardProps {
  job: Job;
}

export default function JobCard({ job }: JobCardProps) {
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    'in-progress': 'bg-blue-100 text-blue-800',
    'awaiting-parts': 'bg-orange-100 text-orange-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  return (
    <Link href={`/jobs/${job.id}`}>
      <div className="bg-white rounded-lg shadow-md p-3 md:p-4 hover:shadow-lg transition-shadow cursor-pointer">
        <div className="flex justify-between items-start mb-2 gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-base md:text-lg font-semibold text-gray-900 truncate flex items-center gap-2">
              {job.urgent && <span className="text-red-600">⚠️</span>}
              {job.customerFirstName} {job.customerLastName}
            </h3>
            <p className="text-xs md:text-sm text-gray-600">Job ID: {job.id.slice(0, 8)}</p>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${statusColors[job.status]}`}>
            {job.status.replace('-', ' ')}
          </span>
        </div>
        
        <div className="space-y-1 text-xs md:text-sm text-gray-700">
          <p><strong>Date:</strong> {format(new Date(job.date), 'MMM dd, yyyy')}</p>
          <p><strong>Time:</strong> {job.startTime} {job.endTime && `- ${job.endTime}`}</p>
          <p><strong>Service:</strong> {job.serviceType}</p>
          <p><strong>Vehicle:</strong> {job.vehicleInfo}</p>
          <p><strong>Phone:</strong> {job.customerPhone}</p>
          {job.employee && (
            <p>
              <strong>Assigned to:</strong>{' '}
              <span className="text-blue-600">
                {job.employee.firstName} {job.employee.lastName}
              </span>
            </p>
          )}
          {job.price && (
            <p>
              <strong>Price:</strong> ${job.price.toFixed(2)}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}



