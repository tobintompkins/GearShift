import twilio from 'twilio';

interface SMSOptions {
  to: string;
  message: string;
}

let twilioClient: twilio.Twilio | null = null;

const getTwilioClient = (): twilio.Twilio | null => {
  if (twilioClient) {
    return twilioClient;
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    return null;
  }

  twilioClient = twilio(accountSid, authToken);
  return twilioClient;
};

export async function sendSMS(options: SMSOptions): Promise<boolean> {
  try {
    const client = getTwilioClient();

    if (!client) {
      console.error('SMS service not configured. Please set up Twilio environment variables.');
      return false;
    }

    // Support both MessagingServiceSid and direct phone number
    const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!messagingServiceSid && !fromNumber) {
      console.error('Either TWILIO_PHONE_NUMBER or TWILIO_MESSAGING_SERVICE_SID must be set.');
      return false;
    }

    const messageParams: any = {
      body: options.message,
      to: options.to,
    };

    // Use MessagingServiceSid if available, otherwise use phone number
    if (messagingServiceSid) {
      messageParams.messagingServiceSid = messagingServiceSid;
    } else {
      messageParams.from = fromNumber;
    }

    await client.messages.create(messageParams);

    console.log(`SMS sent successfully to ${options.to}`);
    return true;
  } catch (error) {
    console.error('Error sending SMS:', error);
    return false;
  }
}

export function isSMSConfigured(): boolean {
  return !!getTwilioClient();
}

// Helper to format phone numbers
export function formatPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  
  // If it's a US number (11 digits starting with 1)
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }
  
  // If it already starts with +
  if (phone.startsWith('+')) {
    return phone;
  }
  
  // Assume US number and add +1
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  
  return phone;
}


