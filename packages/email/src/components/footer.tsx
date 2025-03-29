import {
    Hr,
    Link,
    Section,
    Text,
  } from '@react-email/components';
  import React from 'react';
  
  export function Footer() {
    return (
      <>
        <Hr style={{ 
          borderColor: '#e5e7eb',
          margin: '24px 0'
        }} />
        <Section>
          <Text style={{
            fontSize: '14px',
            lineHeight: '20px',
            color: '#6b7280',
            textAlign: 'center',
            margin: '16px 0'
          }}>
            &copy; {new Date().getFullYear()} DataBuddy. All rights reserved.
          </Text>
          <Text style={{
            fontSize: '12px',
            lineHeight: '16px',
            color: '#9ca3af',
            textAlign: 'center',
            margin: '16px 0'
          }}>
            <Link href="https://www.databuddy.cc/privacy-policy" style={{ color: '#0ea5e9', textDecoration: 'underline' }}>
              Privacy Policy
            </Link>
            {' · '}
            <Link href="https://www.databuddy.cc/terms" style={{ color: '#0ea5e9', textDecoration: 'underline' }}>
              Terms of Service
            </Link>
          </Text>
        </Section>
      </>
    );
  }