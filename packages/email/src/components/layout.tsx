import {
    Body,
    Container,
    Font,
    Html,
    Head,
    Img,
    Section,
    Tailwind,
  } from '@react-email/components';
  // biome-ignore lint/style/useImportType: resend needs React
  import React from 'react';
  import { Footer } from './footer';
  
  type Props = {
    children: React.ReactNode;
  };
  
  export function Layout({ children }: Props) {
    return (
      <Html>
        <Tailwind>
          <head>
            <Font
              fontFamily="Geist"
              fallbackFontFamily="Helvetica"
              webFont={{
                url: 'https://cdn.jsdelivr.net/npm/@fontsource/geist-sans@5.0.1/files/geist-sans-latin-400-normal.woff2',
                format: 'woff2',
              }}
              fontWeight={400}
              fontStyle="normal"
            />
  
            <Font
              fontFamily="Geist"
              fallbackFontFamily="Helvetica"
              webFont={{
                url: 'https://cdn.jsdelivr.net/npm/@fontsource/geist-sans@5.0.1/files/geist-sans-latin-500-normal.woff2',
                format: 'woff2',
              }}
              fontWeight={500}
              fontStyle="normal"
            />
          </head>
          <Body style={{
            backgroundColor: '#f9fafb',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
            padding: '20px 0',
          }}>
            <Container style={{
              margin: '0 auto',
              padding: '32px',
              maxWidth: '580px',
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
            }}>
              <Section>
                <Img
                  src={'https://app.databuddy.cc/logo.svg'}
                  width="80"
                  height="80"
                  alt="Databuddy Logo"
                  style={{ borderRadius: 4, margin: '0 auto 24px auto', display: 'block' }}
                />
              </Section>
              <Section>{children}</Section>
              <Footer />
            </Container>
          </Body>
        </Tailwind>
      </Html>
    );
  }