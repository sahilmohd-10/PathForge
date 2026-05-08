import twilio from 'twilio';
import db from './db.ts';
import { notificationService } from './notificationService.ts';

export const twilioService = {
  getClient() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    if (!accountSid || !authToken) return null;
    return twilio(accountSid, authToken);
  },

  async sendSMS(to: string, message: string) {
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;
    const client = this.getClient();

    if (!client || !fromNumber) {
      console.warn('Twilio credentials not configured. Skipping SMS.');
      return;
    }

    try {
      // Normalize number: remove all non-numeric characters except +
      let normalizedTo = to.replace(/[^\d+]/g, '');
      
      if (!normalizedTo.startsWith('+')) {
        // Intelligent defaulting: if it's a 10-digit number, it's likely an Indian mobile number missing +91
        if (normalizedTo.length === 10) {
          normalizedTo = '+91' + normalizedTo;
        } else {
          normalizedTo = '+' + normalizedTo;
        }
      }

      const response = await client.messages.create({
        body: `[PathForge] ${message}`,
        from: fromNumber,
        to: normalizedTo
      });
      console.log('SMS sent successfully:', response.sid);
      return response;
    } catch (error) {
      console.error('Failed to send SMS:', error);
    }
  },

  async notifyUserFeatureUsage(userId: number, featureName: string, summary?: string) {
    try {
      const profile = await db('profiles').where({ user_id: userId }).first();
      
      // Always create in-app notification first
      await notificationService.createNotification(
        userId, 
        featureName, 
        summary || 'Analysis complete.', 
        'success'
      );

      if (profile && profile.phone_number) {
        const header = `[PATHFORGE INTELLIGENCE]`;
        const section = `Section: ${featureName.toUpperCase()}`;
        const content = summary ? `Insights: ${summary}` : `Status: Processed successfully.`;
        
        const message = `${header}\n${section}\n${content}`;
        
        await this.sendSMS(profile.phone_number, message);
      } else {
        console.log(`[Twilio] Notification skipped: No phone number found for user ${userId}.`);
      }
    } catch (error) {
      console.error('Error notifying user via SMS:', error);
    }
  }
};
