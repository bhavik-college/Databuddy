import { Resend } from 'resend';
import type { z } from 'zod';
import { createLogger } from '@databuddy/logger';
import { render } from '@react-email/render';

import { type TemplateKey, type Templates, templates } from './emails';

const log = createLogger('email');
const FROM = process.env.EMAIL_SENDER ?? 'no-reply@databuddy.cc';

/**
 * Send an email using Resend
 */
export async function sendEmail<T extends TemplateKey>(
  template: T,
  options: {
    to: string | string[];
    data: z.infer<Templates[T]['schema']>;
    cc?: string | string[];
    bcc?: string | string[];
  },
) {
  try {
    const { to, cc, bcc, data } = options;
    const { subject, Component, schema } = templates[template];
    const props = schema.safeParse(data);

    if (!props.success) {
      log.error('Failed to parse email data', { error: props.error, template });
      return {
        success: false,
        error: new Error(`Failed to parse email data: ${props.error.message}`),
      };
    }

    if (!process.env.RESEND_API_KEY) {
      log.warn('No RESEND_API_KEY found, here is the data that would be sent', { 
        template, 
        to, 
        data: props.data 
      });
      return {
        success: true,
        messageId: 'dev-mode',
      };
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    
    // Render the React component to HTML
    const html = render(Component(props.data));

    const response = await resend.emails.send({
      from: FROM,
      to,
      cc,
      bcc,
      subject: subject(props.data),
      html,
    });

    if (response.error) {
      log.error('Failed to send email', { 
        error: response.error, 
        template, 
        to 
      });
      return {
        success: false,
        error: new Error(response.error.message),
      };
    }

    log.info('Email sent successfully', { 
      messageId: response.data?.id,
      template,
      to 
    });

    return {
      success: true,
      messageId: response.data?.id,
    };
  } catch (error) {
    log.error('Exception while sending email', { error, template });
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}