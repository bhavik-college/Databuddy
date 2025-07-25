import { auth } from '@databuddy/auth';
import { autumnHandler } from 'autumn-js/next';

export const { GET, POST } = autumnHandler({
  identify: async (request) => {
    // get the user from your auth provider (example: better-auth)
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    return {
      customerId: session?.user.id,
      customerData: {
        name: session?.user.name,
        email: session?.user.email,
      },
    };
  },
});
