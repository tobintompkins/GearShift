import { prisma } from '@/lib/db';
import JobList from '@/components/JobList';
import Navigation from '@/components/Navigation';
import type { Job } from '@/lib/types';

export default async function JobsPage() {
  const jobs = await prisma.job.findMany({
    include: {
      employee: true,
      customer: true,
      vehicle: true,
    },
    orderBy: { date: 'desc' },
  });

  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="container mx-auto px-4 py-4 md:py-8">
        <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-4 md:mb-6">All Jobs</h2>
        <JobList jobs={jobs as Job[]} />
      </main>
    </div>
  );
}



