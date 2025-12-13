import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, format } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'week'; // week, month, year
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    let startDate: Date;
    let endDate: Date = new Date();

    if (startDateParam && endDateParam) {
      startDate = new Date(startDateParam);
      endDate = new Date(endDateParam);
    } else if (period === 'week') {
      startDate = startOfWeek(new Date(), { weekStartsOn: 0 });
      endDate = endOfWeek(new Date(), { weekStartsOn: 0 });
    } else if (period === 'month') {
      startDate = startOfMonth(new Date());
      endDate = endOfMonth(new Date());
    } else {
      // Year - last 12 months
      startDate = subDays(new Date(), 365);
    }

    // Weekly Jobs - Jobs per day of the week
    const weeklyJobs = await prisma.job.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        status: { not: 'cancelled' },
      },
      select: {
        date: true,
        status: true,
      },
    });

    // Group by day of week
    const jobsByDay: Record<string, number> = {
      Sunday: 0,
      Monday: 0,
      Tuesday: 0,
      Wednesday: 0,
      Thursday: 0,
      Friday: 0,
      Saturday: 0,
    };

    weeklyJobs.forEach((job) => {
      const dayName = format(new Date(job.date), 'EEEE');
      jobsByDay[dayName] = (jobsByDay[dayName] || 0) + 1;
    });

    const weeklyJobsData = Object.entries(jobsByDay).map(([day, count]) => ({
      day,
      jobs: count,
    }));

    // Revenue - Daily revenue for the period
    const revenueJobs = await prisma.job.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        status: 'completed',
        price: { not: null },
      },
      select: {
        date: true,
        price: true,
      },
    });

    // Group revenue by date
    const revenueByDate: Record<string, number> = {};
    revenueJobs.forEach((job) => {
      const dateKey = format(new Date(job.date), 'yyyy-MM-dd');
      revenueByDate[dateKey] = (revenueByDate[dateKey] || 0) + (job.price || 0);
    });

    const revenueData = Object.entries(revenueByDate)
      .map(([date, revenue]) => ({
        date,
        revenue: Number(revenue.toFixed(2)),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Most Common Jobs - Service types
    const serviceTypeCounts = await prisma.job.groupBy({
      by: ['serviceType'],
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        status: { not: 'cancelled' },
      },
      _count: {
        serviceType: true,
      },
      orderBy: {
        _count: {
          serviceType: 'desc',
        },
      },
      take: 10,
    });

    const mostCommonJobs = serviceTypeCounts.map((item) => ({
      serviceType: item.serviceType,
      count: item._count.serviceType,
    }));

    // Parts Usage - From PartOrder
    const partsUsage = await prisma.partOrder.groupBy({
      by: ['partName'],
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: { in: ['ordered', 'arrived', 'installed'] },
      },
      _sum: {
        quantity: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 10,
    });

    const partsUsageData = partsUsage.map((item) => ({
      partName: item.partName,
      quantity: item._sum.quantity || 0,
    }));

    // Employee Workload - Jobs per employee
    const employeeWorkload = await prisma.job.groupBy({
      by: ['employeeId'],
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        status: { not: 'cancelled' },
        employeeId: { not: null },
      },
      _count: {
        employeeId: true,
      },
      orderBy: {
        _count: {
          employeeId: 'desc',
        },
      },
    });

    // Get employee names
    const employeeIds = employeeWorkload.map((e) => e.employeeId).filter(Boolean) as string[];
    const employees = await prisma.employee.findMany({
      where: {
        id: { in: employeeIds },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });

    const employeeMap = new Map(employees.map((e) => [e.id, `${e.firstName} ${e.lastName}`]));

    const employeeWorkloadData = employeeWorkload
      .map((item) => ({
        employeeId: item.employeeId,
        employeeName: item.employeeId ? employeeMap.get(item.employeeId) || 'Unknown' : 'Unassigned',
        jobCount: item._count.employeeId,
      }))
      .sort((a, b) => b.jobCount - a.jobCount);

    // Summary statistics
    const totalJobs = weeklyJobs.length;
    const totalRevenue = revenueJobs.reduce((sum, job) => sum + (job.price || 0), 0);
    const completedJobs = revenueJobs.length;
    const averageRevenue = completedJobs > 0 ? totalRevenue / completedJobs : 0;
    const totalPartsUsed = partsUsageData.reduce((sum, part) => sum + part.quantity, 0);

    return NextResponse.json({
      period,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      summary: {
        totalJobs,
        completedJobs,
        totalRevenue: Number(totalRevenue.toFixed(2)),
        averageRevenue: Number(averageRevenue.toFixed(2)),
        totalPartsUsed,
      },
      weeklyJobs: weeklyJobsData,
      revenue: revenueData,
      mostCommonJobs,
      partsUsage: partsUsageData,
      employeeWorkload: employeeWorkloadData,
    });
  } catch (error: any) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

