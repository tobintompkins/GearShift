import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Get all active employees
    const employees = await prisma.employee.findMany({
      where: { isActive: true },
      include: {
        jobs: {
          where: {
            status: 'completed',
            ...(startDate && endDate
              ? {
                  date: {
                    gte: new Date(startDate),
                    lte: new Date(endDate),
                  },
                }
              : {}),
          },
        },
      },
    });

    // Calculate metrics for each employee
    const performanceData = employees.map((employee) => {
      const completedJobs = employee.jobs.filter(
        (job) => job.status === 'completed' && job.price !== null
      );

      const jobsCompleted = completedJobs.length;
      const totalRevenue = completedJobs.reduce((sum, job) => sum + (job.price || 0), 0);
      const averageRevenue = jobsCompleted > 0 ? totalRevenue / jobsCompleted : 0;

      // Calculate average job time
      const jobsWithDuration = completedJobs.filter((job) => job.duration !== null);
      const totalDuration = jobsWithDuration.reduce((sum, job) => sum + (job.duration || 0), 0);
      const averageJobTime = jobsWithDuration.length > 0 ? totalDuration / jobsWithDuration.length : 0;

      // Calculate jobs by status
      const allJobs = employee.jobs;
      const pendingJobs = allJobs.filter((j) => j.status === 'pending').length;
      const inProgressJobs = allJobs.filter((j) => j.status === 'in-progress').length;
      const awaitingPartsJobs = allJobs.filter((j) => j.status === 'awaiting-parts').length;
      const cancelledJobs = allJobs.filter((j) => j.status === 'cancelled').length;

      // Customer satisfaction (placeholder for future survey feature)
      const customerSatisfaction = null; // Will be implemented with survey feature

      return {
        employee: {
          id: employee.id,
          firstName: employee.firstName,
          lastName: employee.lastName,
          email: employee.email,
          phone: employee.phone,
          photo: employee.photo,
          skills: employee.skills,
        },
        metrics: {
          jobsCompleted,
          totalRevenue,
          averageRevenue,
          averageJobTime: Math.round(averageJobTime), // Round to nearest minute
          customerSatisfaction, // Placeholder for future
          totalJobs: allJobs.length,
          pendingJobs,
          inProgressJobs,
          awaitingPartsJobs,
          cancelledJobs,
        },
      };
    });

    // Sort by total revenue (descending)
    performanceData.sort((a, b) => b.metrics.totalRevenue - a.metrics.totalRevenue);

    return NextResponse.json(performanceData);
  } catch (error: any) {
    console.error('Error fetching performance metrics:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch performance metrics' },
      { status: 500 }
    );
  }
}

