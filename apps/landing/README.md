# Databuddy - Website Analytics Dashboard

A modern, privacy-focused analytics platform for tracking website performance and visitor behavior.

## Features

- **Real-time Analytics**: Track visitors, page views, and user behavior in real time
- **Website Management**: Add and monitor multiple websites from a single dashboard
- **User-friendly Interface**: Clean, modern dark-themed UI built with Next.js and shadcn/ui
- **Privacy-focused**: No cookies required, respects user privacy
- **Lightweight Tracking**: Minimal impact on website performance
- **Custom Events**: Track specific user interactions and conversions

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js
- **Deployment**: Vercel (recommended)

## Getting Started

### Prerequisites

- Node.js 18+ (or Bun)
- PostgreSQL database

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/databuddy.git
cd databuddy
```

2. Install dependencies:

```bash
bun install
```

3. Set up environment variables:

Create a `.env` file in the root directory with the following variables:

```
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/databuddy"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

4. Set up the database:

```bash
bun prisma migrate dev
```

5. Start the development server:

```bash
bun dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Adding a Website

1. Log in to your Databuddy dashboard
2. Click "Add Website" and enter the website details
3. Copy the tracking code provided
4. Add the tracking code to the `<head>` section of your website

### Tracking Custom Events

You can track custom events on your website using the Databuddy JavaScript API:

```javascript
// Track a button click
databuddy.trackEvent('button_click', { buttonId: 'signup-button' });

// Track a form submission
databuddy.trackEvent('form_submit', { formId: 'contact-form' });
```

## Deployment

### Deploying to Vercel

1. Push your code to a GitHub repository
2. Import the project in Vercel
3. Set the environment variables in the Vercel dashboard
4. Deploy!

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
