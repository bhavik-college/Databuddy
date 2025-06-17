import { Elysia } from "elysia";
import { auth } from "../lib/auth";

type AuthMiddlewareOptions = {
    required: boolean;
}

export const authMiddleware = (options: AuthMiddlewareOptions = { required: false }) => {
    return new Elysia({ name: 'middleware.auth' })
        .derive(async ({ request }) => {
            try {
                const session = await auth.api.getSession({
                    headers: request.headers,
                });

                if (!session) {
                    return { user: null, session: null };
                }
                
                return { 
                    user: session.user, 
                    session,
                 };

            } catch (error) {
                console.error("Error getting session:", error);
                return { user: null, session: null };
            }
        })
        .onBeforeHandle(({ user, session, set }) => {
            if (options.required && (!user || !session)) {
                set.status = 401;
                return {
                    success: false,
                    error: 'Unauthorized',
                    code: 'AUTH_REQUIRED'
                }
            }
        });
};

export type AuthMiddleware = ReturnType<typeof authMiddleware>;
