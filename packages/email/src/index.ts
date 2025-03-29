// Export email functionality
export { sendEmail } from './client';
export { type TemplateKey, type Templates } from './emails';

/**
 * Example usage:
 * 
 * ```typescript
 * import { sendEmail } from '@databuddy/email';
 * 
 * async function main() {
 *   // Send verification email
 *   const result = await sendEmail('verification', {
 *     to: 'user@example.com',
 *     data: {
 *       userName: 'John Doe',
 *       verificationUrl: 'https://yourdomain.com/verify?code=abc123',
 *       companyName: 'Databuddy'
 *     }
 *   });
 * 
 *   console.log(result.success ? 'Email sent!' : 'Failed to send email');
 * }
 * ```
 */ 