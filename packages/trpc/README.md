# @databuddy/trpc

This package contains the tRPC server implementation for the DataBuddy API.

## Overview

This package provides:

- Core tRPC router and procedure definitions
- Type-safe API endpoints
- Authentication and authorization middleware
- Shared types for client-server communication

## Usage

### Server-side (API)

```typescript
import { appRouter, createContext } from '@databuddy/trpc';
import { trpcServer } from '@honojs/trpc-server';

// Create a Hono app
const app = new Hono();

// Add tRPC handler
app.all('/trpc/*', trpcServer({
  router: appRouter,
  createContext: async (c) => {
    // Get user from session, etc.
    return createContext({ 
      req: c.req.raw,
      user: currentUser 
    });
  },
}));
```

### Client-side (Frontend)

Use the `@databuddy/trpc-client` package to interact with the API:

```typescript
import { trpc } from '@databuddy/trpc-client';

// Use the standalone client
async function fetchUsers() {
  const users = await trpc.user.list.query({ limit: 10 });
  console.log(users);
}

// Or use the React hooks
import { api, TRPCProvider } from '@databuddy/trpc-client';

function MyComponent() {
  const { data, isLoading } = api.user.me.useQuery();
  
  if (isLoading) return <div>Loading...</div>;
  
  return <div>Hello, {data?.name}!</div>;
}

function App() {
  return (
    <TRPCProvider>
      <MyComponent />
    </TRPCProvider>
  );
}
```

## Available Routers

- `user` - User-related endpoints
- `post` - Blog post endpoints

## Adding New Routers

1. Create a new file in `src/routers/`
2. Define your router using the `router` helper
3. Add your router to the `appRouter` in `src/root.ts`

## License

Private 