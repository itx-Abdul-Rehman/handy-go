#!/usr/bin/env node
/**
 * Quick test: send a test email via Resend SDK.
 */
import { Resend } from 'resend';

const resend = new Resend('re_G1TX82tk_BeaP5fa3ThFDbobTwFVNkC5K');

console.log('Sending test email via Resend...');

try {
  const { data, error } = await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: 'f2023266257@umt.edu.pk',
    subject: 'Hello World',
    html: '<p>Congrats on sending your <strong>first email</strong>!</p>',
  });

  if (error) {
    console.error('Resend error:', JSON.stringify(error, null, 2));
  } else {
    console.log('Email sent successfully!');
    console.log('Response:', JSON.stringify(data, null, 2));
  }
} catch (e) {
  console.error('Exception:', e.message);
}
