import { prisma } from './db';
import { sendEmail } from './email';
import { sendSMS, formatPhoneNumber } from './sms';
import { format, addDays, isSameDay, startOfDay } from 'date-fns';

interface ReminderJob {
  id: string;
  jobId: string;
  type: 'customer' | 'employee';
  method: 'email' | 'sms' | 'app';
  daysBefore: number;
  message: string | null;
  job: {
    date: Date;
    startTime: string;
    customerFirstName: string;
    customerLastName: string;
    customerPhone: string;
    customer?: {
      email: string | null;
      phone: string;
    } | null;
    employee?: {
      email: string | null;
      phone: string | null;
    } | null;
    serviceType: string;
    vehicleInfo: string;
  };
}

export async function processReminders(): Promise<{ sent: number; failed: number; errors: string[] }> {
  const results = {
    sent: 0,
    failed: 0,
    errors: [] as string[],
  };

  try {
    // Get all unsent reminders
    const reminders = await prisma.reminder.findMany({
      where: {
        sent: false,
      },
      include: {
        job: {
          include: {
            customer: true,
            employee: true,
          },
        },
      },
    });

    const today = startOfDay(new Date());

    for (const reminder of reminders) {
      try {
        // Calculate when the reminder should be sent
        const jobDate = startOfDay(new Date(reminder.job.date));
        const reminderDate = addDays(jobDate, -reminder.daysBefore);

        // Check if today is the reminder date
        if (!isSameDay(today, reminderDate)) {
          continue; // Not time to send this reminder yet
        }

        // Determine recipient contact info
        let recipientEmail: string | null = null;
        let recipientPhone: string | null = null;
        let recipientName = '';

        if (reminder.type === 'customer') {
          recipientName = `${reminder.job.customerFirstName} ${reminder.job.customerLastName}`;
          recipientEmail = reminder.job.customer?.email || null;
          recipientPhone = reminder.job.customer?.phone || reminder.job.customerPhone || null;
        } else {
          // Employee reminder
          if (!reminder.job.employee) {
            results.errors.push(`Reminder ${reminder.id}: Job has no assigned employee`);
            continue;
          }
          recipientName = `${reminder.job.employee.firstName} ${reminder.job.employee.lastName}`;
          recipientEmail = reminder.job.employee.email || null;
          recipientPhone = reminder.job.employee.phone || null;
        }

        // Generate message
        const defaultMessage = reminder.message || 
          `Reminder: You have an appointment scheduled for ${format(new Date(reminder.job.date), 'MMMM d, yyyy')} at ${reminder.job.startTime}. Service: ${reminder.job.serviceType}.`;

        // Send reminder based on method
        let sent = false;

        if (reminder.method === 'email' && recipientEmail) {
          sent = await sendEmail({
            to: recipientEmail,
            subject: `Appointment Reminder - ${format(new Date(reminder.job.date), 'MMM d, yyyy')}`,
            text: defaultMessage,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">Appointment Reminder</h2>
                <p>Hello ${recipientName},</p>
                <p>${defaultMessage}</p>
                <p><strong>Date:</strong> ${format(new Date(reminder.job.date), 'MMMM d, yyyy')}</p>
                <p><strong>Time:</strong> ${reminder.job.startTime}</p>
                <p><strong>Service:</strong> ${reminder.job.serviceType}</p>
                ${reminder.job.vehicleInfo ? `<p><strong>Vehicle:</strong> ${reminder.job.vehicleInfo}</p>` : ''}
                <p>Thank you,<br>TNT Apex Elite AutoCare</p>
              </div>
            `,
          });
        } else if (reminder.method === 'sms' && recipientPhone) {
          const formattedPhone = formatPhoneNumber(recipientPhone);

          sent = await sendSMS({
            to: formattedPhone,
            message: defaultMessage,
          });
        } else if (reminder.method === 'app') {
          // App notifications - for now, just mark as sent
          // In the future, you could integrate with push notification services
          console.log(`App notification reminder for ${recipientName}: ${defaultMessage}`);
          sent = true; // Mark as sent for app notifications (would need actual push notification service)
        } else {
          results.errors.push(
            `Reminder ${reminder.id}: No valid contact method. Email: ${!!recipientEmail}, Phone: ${!!recipientPhone}`
          );
          continue;
        }

        // Update reminder status
        if (sent) {
          await prisma.reminder.update({
            where: { id: reminder.id },
            data: {
              sent: true,
              sentAt: new Date(),
            },
          });
          results.sent++;
        } else {
          results.failed++;
          results.errors.push(`Reminder ${reminder.id}: Failed to send ${reminder.method}`);
        }
      } catch (error) {
        results.failed++;
        results.errors.push(
          `Reminder ${reminder.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        console.error(`Error processing reminder ${reminder.id}:`, error);
      }
    }

    return results;
  } catch (error) {
    console.error('Error processing reminders:', error);
    results.errors.push(`Failed to process reminders: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return results;
  }
}


