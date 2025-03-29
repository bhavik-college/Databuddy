import React from 'react';
import { Button, Link, Text } from '@react-email/components';
import { z } from 'zod';
import { Layout } from '../components/layout';

export const zEmailWelcome = z.object({
  userName: z.string(),
  loginUrl: z.string(),
  companyName: z.string().optional().default('Databuddy'),
  supportEmail: z.string().optional().default('support@databuddy.io'),
});

export type Props = z.infer<typeof zEmailWelcome>;

export default function EmailWelcome({
  userName,
  loginUrl,
  companyName = 'Databuddy',
  supportEmail = 'support@databuddy.io',
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
      }}>Welcome to {companyName}!</Text>
      
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
        Thank you for joining {companyName}! We're excited to have you on board.
      </Text>
      
      <Text style={{
        fontSize: '16px',
        lineHeight: '24px',
        color: '#374151',
        marginBottom: '16px',
      }}>
        Your account has been successfully created and is ready to use. You can now log in
        to access all the features and services available to you.
      </Text>
      
      <Button
        href={loginUrl}
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
        Log In to Your Account
      </Button>
      
      <Text style={{
        fontSize: '16px',
        lineHeight: '24px',
        color: '#374151',
        marginBottom: '16px',
      }}>
        Here are a few things you can do to get started:
      </Text>
      
      <ul style={{
        marginBottom: '24px',
        paddingLeft: '24px',
      }}>
        <li style={{
          fontSize: '16px',
          lineHeight: '24px',
          color: '#374151',
          marginBottom: '8px',
        }}>Complete your profile</li>
        <li style={{
          fontSize: '16px',
          lineHeight: '24px',
          color: '#374151',
          marginBottom: '8px',
        }}>Explore the dashboard</li>
        <li style={{
          fontSize: '16px',
          lineHeight: '24px',
          color: '#374151',
          marginBottom: '8px',
        }}>Check out our documentation</li>
      </ul>
      
      <Text style={{
        fontSize: '16px',
        lineHeight: '24px',
        color: '#374151',
        marginBottom: '16px',
      }}>
        If you have any questions or need assistance, please don't hesitate to
        contact our support team at{' '}
        <Link 
          href={`mailto:${supportEmail}`} 
          style={{
            color: '#0ea5e9',
            textDecoration: 'underline',
          }}
        >
          {supportEmail}
        </Link>.
      </Text>
      
      <Text style={{
        fontSize: '14px',
        lineHeight: '20px',
        color: '#6b7280',
        textAlign: 'center',
        marginTop: '24px',
      }}>
        Thank you for choosing {companyName}. We look forward to helping you succeed!
      </Text>
    </Layout>
  );
} 