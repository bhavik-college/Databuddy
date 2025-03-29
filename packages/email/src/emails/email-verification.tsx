import React from 'react';
import { Button, Link, Text } from '@react-email/components';
import { z } from 'zod';
import { Layout } from '../components/layout';

export const zEmailVerification = z.object({
  userName: z.string(),
  verificationUrl: z.string(),
  companyName: z.string().optional().default('Databuddy'),
  expiryHours: z.number().optional().default(24),
});

export type Props = z.infer<typeof zEmailVerification>;

export default function EmailVerification({
  userName,
  verificationUrl,
  companyName = 'Databuddy',
  expiryHours = 24,
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
        Thank you for signing up with {companyName}. To complete your registration, 
        please verify your email address by clicking the button below:
      </Text>
      
      <Button
        href={verificationUrl}
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
        Verify Email Address
      </Button>
      
      <Text style={{
        fontSize: '16px',
        lineHeight: '24px',
        color: '#374151',
        marginBottom: '16px',
      }}>
        This verification link will expire in {expiryHours} hours.
      </Text>
      
      <Text style={{
        fontSize: '16px',
        lineHeight: '24px',
        color: '#374151',
        marginBottom: '16px',
      }}>
        If you did not create an account, you can safely ignore this email.
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
          href={verificationUrl}
          style={{
            color: '#0ea5e9',
            textDecoration: 'underline',
            wordBreak: 'break-all',
          }}
        >
          {verificationUrl}
        </Link>
      </Text>
    </Layout>
  );
} 