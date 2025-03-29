import type { z } from 'zod';
import EmailVerification, { zEmailVerification } from './email-verification';
import EmailResetPassword, { zEmailResetPassword } from './email-password-reset';
import EmailWelcome, { zEmailWelcome } from './email-welcome';

export const templates = {
  'verification': {
    subject: (data: z.infer<typeof zEmailVerification>) =>
      `Verify your email address for ${data.companyName}`,
    Component: EmailVerification,
    schema: zEmailVerification,
  },
  'password-reset': {
    subject: (data: z.infer<typeof zEmailResetPassword>) =>
      `Reset your password for ${data.companyName}`,
    Component: EmailResetPassword,
    schema: zEmailResetPassword,
  },
  'welcome': {
    subject: (data: z.infer<typeof zEmailWelcome>) =>
      `Welcome to ${data.companyName}!`,
    Component: EmailWelcome,
    schema: zEmailWelcome,
  },
} as const;

export type Templates = typeof templates;
export type TemplateKey = keyof Templates;