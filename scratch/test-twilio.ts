import dotenv from 'dotenv';
import path from 'path';
// Load .env from the root
dotenv.config({ path: path.join(process.cwd(), '.env') });

import { twilioService } from '../src/server/twilioService.ts';

async function testTwilio() {
  console.log('Testing Twilio configuration...');
  console.log('Account SID:', process.env.TWILIO_ACCOUNT_SID);
  console.log('From Number:', process.env.TWILIO_PHONE_NUMBER);
  
  // Replace with a number you want to test with, or I will use a dummy one to see if it triggers an error
  const testNumber = '+917013145455'; // Sahil's number or similar format
  
  try {
    const result = await twilioService.sendSMS(testNumber, 'Test message from PathForge AI integration test.');
    if (result) {
      console.log('✅ Success! Message SID:', result.sid);
    } else {
      console.log('❌ Failed to send message (returned null). Check console warnings.');
    }
  } catch (error) {
    console.error('❌ Error during Twilio test:', error);
  }
}

testTwilio();
