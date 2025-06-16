# DataBuddy

<div align="center">

[![License: Proprietary](https://img.shields.io/badge/License-Proprietary-red.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.3-black.svg)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0-blue.svg)](https://reactjs.org/)
[![Turborepo](https://img.shields.io/badge/Turborepo-1.12-blue.svg)](https://turbo.build/repo)
[![Bun](https://img.shields.io/badge/Bun-1.2-blue.svg)](https://bun.sh/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-blue.svg)](https://tailwindcss.com/)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare%20Workers-4.13-orange.svg)](https://workers.cloudflare.com/)

[![CI/CD](https://github.com/databuddy/databuddy/actions/workflows/ci.yml/badge.svg)](https://github.com/databuddy/databuddy/actions/workflows/ci.yml)
[![Code Coverage](https://img.shields.io/badge/coverage-85%25-green.svg)](https://github.com/databuddy/databuddy/actions/workflows/coverage.yml)
[![Security Scan](https://img.shields.io/badge/security-A%2B-green.svg)](https://github.com/databuddy/databuddy/actions/workflows/security.yml)
[![Dependency Status](https://img.shields.io/badge/dependencies-up%20to%20date-green.svg)](https://github.com/databuddy/databuddy/actions/workflows/dependencies.yml)

[![Discord](https://img.shields.io/discord/123456789?label=Discord&logo=discord)](https://discord.gg/JTk7a38tCZ)
[![Twitter](https://img.shields.io/twitter/follow/databuddy?style=social)](https://twitter.com/databuddy)
[![GitHub Stars](https://img.shields.io/github/stars/databuddy/databuddy?style=social)](https://github.com/databuddy/databuddy/stargazers)

</div>

A comprehensive analytics and data management platform built with Next.js, TypeScript, and modern web technologies. DataBuddy provides real-time analytics, user tracking, and data visualization capabilities for web applications.

## 🌟 Features

- 📊 Real-time analytics dashboard
- 👥 User behavior tracking
- 📈 Advanced data visualization
- 🔒 Secure authentication
- 💳 Stripe payment integration
- 📱 Responsive design
- 🌐 Multi-tenant support
- 🔄 Real-time updates
- 📊 Custom metrics
- 🎯 Goal tracking
- 📈 Conversion analytics
- 🔍 Custom event tracking
- 📊 Funnel analysis
- 📈 Cohort analysis
- 🔄 A/B testing
- 📊 Custom reports
- 📈 Export capabilities
- 🔒 GDPR compliance
- 🔐 Data encryption
- 📊 API access

## 📚 Table of Contents

- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Development](#development)
- [Architecture](#architecture)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [Security](#security)
- [Performance](#performance)
- [Troubleshooting](#troubleshooting)
- [FAQ](#faq)
- [Support](#support)
- [License](#license)

## 🏗️ Project Structure

This is a monorepo using Turborepo, containing multiple applications and shared packages:

### Applications (`/apps`)

#### `dashboard` - Main Dashboard Application
- Next.js 15.3 application with App Router
- Features:
  - Real-time analytics dashboard
  - User management
  - Website tracking configuration
  - Advanced data visualization
  - Stripe integration for payments
  - Custom report generation
  - Team collaboration
  - Role-based access control
  - Audit logging
  - Export capabilities
- Tech Stack:
  - React 19.0.0
  - TanStack Query 5.75.4
  - Radix UI components (latest)
  - Tailwind CSS 4.1.4
  - Framer Motion 12.9.2
  - Sentry 9.15.0
  - Zustand 5.0.3
  - Recharts 2.15.3
  - React Simple Maps 3.0.0
  - D3.js 3.1.1
  - Stripe 18.0.0
  - Better-Auth (via better-auth 1.2.7)
  - Zod 3.24.3
  - React Hook Form 7.56.1
  - Sonner 2.0.3
  - Next.js Top Loader 3.8.16
  - Biome 1.9.4

#### `landing` - Marketing Website
- Next.js 15.2 application with App Router
- Features:
  - Product landing page
  - Documentation
  - Blog
  - Pricing pages
  - Case studies
  - Customer testimonials
  - Integration guides
  - API documentation
  - Changelog
  - Support portal
- Tech Stack:
  - Next.js 15.2.3
  - Tailwind CSS 3.4.17
  - MDX (via react-markdown 10.1.0)
  - Contentlayer (via @tiptap/react 2.11.5)
  - Framer Motion 12.4.7
  - React Hook Form 7.54.2
  - Zod 3.24.2
  - Better-Auth (via better-auth 1.2.0)
  - Stripe (via @stripe/stripe-js)
  - Vercel Analytics (via posthog-js 1.224.1)
  - Vercel Speed Insights

#### `admin` - Admin Panel
- Next.js application for platform administration
- Features:
  - User management
  - System configuration
  - Analytics overview
  - Platform monitoring
  - Billing management
  - Team management
  - Role management
  - Audit logs
  - System health
  - Performance monitoring
  - Error tracking
  - Usage statistics
- Tech Stack:
  - Next.js
  - Radix UI
  - Tailwind CSS
  - TanStack Query
  - Zustand
  - React Hook Form
  - Zod
  - Sentry
  - Stripe
  - BetterAuth

#### `api` - Backend API
- Cloudflare Workers-based API
- Features:
  - RESTful endpoints
  - Authentication
  - Data processing
  - Analytics collection
  - Rate limiting
  - Caching
  - Webhook support
  - API key management
  - Usage tracking
  - Error handling
  - Logging
  - Monitoring
- Tech Stack:
  - Cloudflare Workers (via wrangler 4.13.2)
  - TypeScript
  - Hono 4.7.8
  - Zod 3.24.3
  - JWT (via better-auth 1.2.7)
  - Redis (via @databuddy/redis)
  - ClickHouse (via @clickhouse/client 1.11.1)
  - Pino 9.6.0
  - Highlight 1.0.4
  - Logtail 0.5.4

### Packages (`/packages`)

#### `@databuddy/sdk` - Analytics SDK
- Client-side analytics tracking
- Features:
  - Event tracking
  - Page view tracking
  - Performance monitoring
  - Error tracking
  - Custom metrics
  - Session tracking
  - User identification
  - Automatic tracking
  - Manual tracking
  - Batch processing
  - Retry mechanism
  - Offline support
  - Privacy controls
- Tech Stack:
  - TypeScript 5.0.0
  - Rollup 3.0.0
  - Jest 29.5.0
  - ESLint 8.0.0
  - Prettier 3.0.0
  - TSDoc

#### `@databuddy/db` - Database Package
- Database schema and migrations
- Features:
  - Type-safe database access
  - Schema definitions
  - Migration utilities
  - Query builders
  - Connection pooling
  - Transaction support
  - Backup utilities
  - Data validation
  - Type generation
  - Migration CLI
- Tech Stack:
  - Drizzle ORM 0.42.0
  - PostgreSQL (via pg 8.15.6)
  - ClickHouse (via @clickhouse/client 1.11.0)
  - TypeScript
  - Zod
  - Jest

#### `@databuddy/auth` - Authentication Package
- Authentication and authorization
- Features:
  - Session management
  - User authentication
  - Role-based access control
  - OAuth integration
  - JWT handling
  - Password hashing
  - 2FA support
  - Social login
  - Email verification
  - Password reset
  - Account linking
  - Session invalidation
- Tech Stack:
  - BetterAuth
  - JWT
  - bcrypt
  - TypeScript
  - Zod

#### `@databuddy/redis` - Redis Package
- Redis client and utilities
- Features:
  - Caching
  - Rate limiting
  - Session storage
  - Pub/Sub
  - Queue management
  - Lock mechanism
  - Cache invalidation
  - Connection pooling
  - Error handling
  - Monitoring
- Tech Stack:
  - Redis
  - TypeScript
  - Jest
  - Bull

#### `@databuddy/validation` - Validation Package
- Data validation utilities
- Features:
  - Schema validation
  - Type checking
  - Input sanitization
  - Custom validators
  - Error messages
  - Async validation
  - Cross-field validation
  - Conditional validation
  - Array validation
  - Object validation
- Tech Stack:
  - Zod
  - TypeScript
  - Jest

#### `@databuddy/shared` - Shared Utilities
- Common utilities and types
- Features:
  - Shared types
  - Helper functions
  - Constants
  - Date utilities
  - String utilities
  - Number utilities
  - Array utilities
  - Object utilities
  - Error handling
  - Logging
  - Testing utilities
- Tech Stack:
  - TypeScript
  - Jest
  - ESLint
  - Prettier

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Bun
- pnpm
- Docker
- PostgreSQL
- Redis
- Cloudflare account
- Vercel account
- Stripe account
- Sentry account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/databuddy/databuddy.git
cd databuddy
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp apps/dashboard/.env.example apps/dashboard/.env
cp apps/landing/.env.example apps/landing/.env
cp apps/admin/.env.example apps/admin/.env
cp apps/api/.env.example apps/api/.env
```

4. Start development servers:
```bash
pnpm dev
```

### Environment Variables

#### Dashboard (`dashboard`)
```env
NEXT_PUBLIC_API_URL=http://localhost:8787
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_key
STRIPE_SECRET_KEY=your_stripe_secret
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
```

#### Landing Page (`landing`)
```env
NEXT_PUBLIC_API_URL=http://localhost:8787
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_key
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
```

#### Admin Panel (`admin`)
```env
NEXT_PUBLIC_API_URL=http://localhost:8787
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
```

#### API (`api`)
```env
DATABASE_URL=postgresql://user:password@localhost:5432/databuddy
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret
STRIPE_SECRET_KEY=your_stripe_secret
SENTRY_DSN=your_sentry_dsn
```

## 💻 Development

### Available Scripts

- `pnpm dev` - Start all applications in development mode
- `pnpm build` - Build all applications and packages
- `pnpm lint` - Run linting across all packages
- `pnpm test` - Run tests across all packages
- `pnpm clean` - Clean all build artifacts
- `pnpm typecheck` - Run TypeScript type checking
- `pnpm format` - Format all files
- `pnpm prepare` - Prepare all packages for development
- `pnpm changeset` - Create a new changeset
- `pnpm version` - Version all packages
- `pnpm publish` - Publish all packages

### Development Workflow

1. Create a new branch:
```bash
git checkout -b feature/your-feature
```

2. Make your changes

3. Run tests:
```bash
pnpm test
```

4. Create a changeset:
```bash
pnpm changeset
```

5. Commit your changes:
```bash
git add .
git commit -m "feat: your feature"
```

6. Push your changes:
```bash
git push origin feature/your-feature
```

7. Create a Pull Request

### Code Style

- Use TypeScript for all new code
- Follow the project's ESLint configuration
- Use Prettier for formatting
- Write tests for all new features
- Update documentation as needed
- Follow conventional commits

## 🏗️ Architecture

### Frontend Architecture

#### Dashboard (`dashboard`)
- Next.js App Router
- Server Components
- Client Components
- API Routes
- Middleware
- Authentication
- Authorization
- State Management
- Data Fetching
- Error Handling
- Loading States
- Form Handling
- Validation
- Notifications
- Analytics
- Performance Monitoring

#### Landing Page (`landing`)
- Next.js App Router
- Static Generation
- Server Components
- Client Components
- MDX
- Content Management
- SEO
- Analytics
- Performance
- Accessibility

#### Admin Panel (`admin`)
- Next.js App Router
- Server Components
- Client Components
- API Routes
- Authentication
- Authorization
- State Management
- Data Fetching
- Error Handling
- Monitoring
- Logging

### Backend Architecture

#### API (`api`)
- Cloudflare Workers
- RESTful API
- GraphQL API
- Authentication
- Authorization
- Rate Limiting
- Caching
- Database Access
- Redis
- Error Handling
- Logging
- Monitoring
- Metrics
- Alerts

### Data Flow

1. Client SDK collects analytics data
2. Data is sent to API endpoints
3. API processes and stores data
4. Dashboard displays processed data
5. Admin panel manages system configuration

### Security

- Authentication
- Authorization
- Rate Limiting
- CORS
- CSP
- XSS Protection
- CSRF Protection
- SQL Injection Protection
- Input Validation
- Output Encoding
- Secure Headers
- SSL/TLS
- Data Encryption
- Password Hashing
- Session Management
- Audit Logging

## 📚 API Documentation

### REST API

#### Authentication

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password"
}
```

#### Analytics

```http
POST /api/analytics/track
Content-Type: application/json

{
  "event": "page_view",
  "properties": {
    "path": "/dashboard",
    "referrer": "https://google.com"
  }
}
```

### GraphQL API

```graphql
query GetAnalytics {
  analytics {
    pageViews
    uniqueVisitors
    bounceRate
    averageTimeOnSite
  }
}
```

## 🚀 Deployment

### Dashboard (`dashboard`)
- Deployed on Vercel
- Environment: Production/Staging
- CI/CD: GitHub Actions
- Monitoring: Sentry
- Analytics: Vercel Analytics
- Performance: Vercel Speed Insights

### Landing Page (`landing`)
- Deployed on Vercel
- Environment: Production
- CI/CD: GitHub Actions
- Monitoring: Sentry
- Analytics: Vercel Analytics
- Performance: Vercel Speed Insights

### Admin Panel (`admin`)
- Deployed on Vercel
- Environment: Production
- CI/CD: GitHub Actions
- Monitoring: Sentry
- Analytics: Vercel Analytics
- Performance: Vercel Speed Insights

### API (`api`)
- Deployed on Cloudflare Workers
- Environment: Production
- CI/CD: GitHub Actions
- Monitoring: Sentry
- Analytics: Cloudflare Analytics
- Performance: Cloudflare Workers Analytics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

### Pull Request Process

1. Update the README.md with details of changes
2. Update the documentation
3. Add tests for new features
4. Ensure all tests pass
5. Update the changelog
6. Create a changeset

### Code of Conduct

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing.

## 🔒 Security

### Reporting a Vulnerability

Please report security vulnerabilities to security@databuddy.cc

### Security Measures

- Regular security audits
- Dependency updates
- Vulnerability scanning
- Penetration testing
- Security headers
- Input validation
- Output encoding
- Authentication
- Authorization
- Rate limiting
- CORS
- CSP
- XSS protection
- CSRF protection
- SQL injection protection

## ⚡ Performance

### Frontend Performance

- Server Components
- Client Components
- Code splitting
- Tree shaking
- Image optimization
- Font optimization
- CSS optimization
- JavaScript optimization
- Caching
- Preloading
- Prefetching
- Lazy loading
- Suspense
- Error boundaries

### Backend Performance

- Edge computing
- Caching
- Database optimization
- Query optimization
- Connection pooling
- Rate limiting
- Load balancing
- CDN
- Compression
- Minification
- Monitoring
- Metrics
- Alerts

## 🔍 Troubleshooting

### Common Issues

1. **Build fails**
   - Check Node.js version
   - Clear cache
   - Update dependencies
   - Check for errors

2. **API errors**
   - Check environment variables
   - Check database connection
   - Check Redis connection
   - Check logs

3. **Authentication issues**
   - Check JWT secret
   - Check session configuration
   - Check cookies
   - Check CORS

### Debugging

1. **Frontend**
   - Browser DevTools
   - React DevTools
   - Network tab
   - Console
   - Sources
   - Performance

2. **Backend**
   - Logs
   - Metrics
   - Tracing
   - Profiling
   - Debugging

## ❓ FAQ

### General

1. **What is Databuddy?**
   Databuddy is a comprehensive analytics and data management platform.

2. **How do I get started?**
   Follow the [Getting Started](#getting-started) guide.

3. **Is it free?**
   Check our [pricing page](https://databuddy.cc/pricing).

### Technical

1. **What are the system requirements?**
   See [Prerequisites](#prerequisites).

2. **How do I deploy?**
   See [Deployment](#deployment).

3. **How do I contribute?**
   See [Contributing](#contributing).

## 💬 Support

- [Documentation](https://docs.databuddy.cc)
- [Discord](https://discord.gg/JTk7a38tCZ)
- [Twitter](https://twitter.com/databuddyps)
- [GitHub Issues](https://github.com/databuddy/databuddy/issues)
- [Email Support](mailto:support@databuddy.cc)

## 📄 License

Proprietary - All rights reserved

Copyright (c) 2024 DataBuddy

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/)
- [React](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Radix UI](https://www.radix-ui.com/)
- [Cloudflare](https://www.cloudflare.com/)
- [Vercel](https://vercel.com/)
- [Stripe](https://stripe.com/)
- [Turborepo](https://turbo.build/repo)
- [Bun](https://bun.sh/)
