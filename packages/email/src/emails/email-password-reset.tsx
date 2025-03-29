import React from 'react';
import { Button, Link, Text } from '@react-email/components';
import { z } from 'zod';
import { Layout } from '../components/layout';

export const zEmailResetPassword = z.object({
  userName: z.string(),
  resetUrl: z.string(),
  companyName: z.string().optional().default('Databuddy'),
  expiryMinutes: z.number().optional().default(30),
});

export type Props = z.infer<typeof zEmailResetPassword>;

export default function EmailResetPassword({
  userName, 
  resetUrl,
  companyName = 'Databuddy',
  expiryMinutes = 30,
}: Props) {
  return (
    <Layout>
      <Text style={{
        fontSize: '24px',
        lineHeight: '32px',
        fontWeight: 'bold',
        color: '#111827',
        textAlign: 'center',
        marginBottom: '24px',
      }}>{companyName}</Text>
      
      <Text style={{
        fontSize: '16px',
        lineHeight: '24px',
        color: '#374151',
        marginBottom: '16px',
      }}>Hello {userName},</Text>
      
      <Text style={{
        fontSize: '16px',
        lineHeight: '24px',
        color: '#374151',
        marginBottom: '16px',
      }}>
        We received a request to reset your password for your {companyName} account.
        To proceed with the password reset, click the button below:
      </Text>
      
      <Button
        href={resetUrl}
        style={{
          backgroundColor: '#0ea5e9',
          borderRadius: '6px',
          color: '#ffffff',
          fontSize: '14px',
          fontWeight: '500',
          textDecoration: 'none',
          textAlign: 'center',
          display: 'block',
          padding: '10px 16px',
          marginBottom: '24px',
          marginTop: '24px',
        }}
      >
        Reset Password
      </Button>
      
      <Text style={{
        fontSize: '16px',
        lineHeight: '24px',
        color: '#374151',
        marginBottom: '16px',
      }}>
        This reset link will expire in {expiryMinutes} minutes.
      </Text>
      
      <Text style={{
        fontSize: '16px',
        lineHeight: '24px',
        color: '#374151',
        marginBottom: '16px',
      }}>
        If you didn't request a password reset, you can safely ignore this email. 
        Your password will remain unchanged.
      </Text>
      
      <Text style={{
        fontSize: '14px',
        lineHeight: '20px',
        color: '#6b7280',
        marginBottom: '8px',
      }}>
        If the button above doesn't work, please copy and paste the following link into your browser:
      </Text>
      
      <Text style={{
        fontSize: '14px',
        lineHeight: '20px',
        color: '#0ea5e9',
        marginBottom: '16px',
      }}>
        <Link 
          href={resetUrl}
          style={{
            color: '#0ea5e9',
            textDecoration: 'underline',
            wordBreak: 'break-all',
          }}
        >
          {resetUrl}
        </Link>
      </Text>
    </Layout>
  );
}