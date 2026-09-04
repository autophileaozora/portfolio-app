import { createServerClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY } from '$env/static/public';
import type { RequestEvent } from '@sveltejs/kit';
import type { Database } from './database.types';
import WebSocket from 'ws';

/**
 * One Supabase client per request, cookie-backed so auth sessions survive
 * across SSR requests. Used for BOTH public reads and admin writes — admin
 * mutations run as the authenticated user's own session (RLS-enforced),
 * never a service-role key.
 */
export function createSupabaseServerClient(event: RequestEvent) {
	return createServerClient<Database>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
		cookies: {
			getAll: () => event.cookies.getAll(),
			setAll: (cookiesToSet) => {
				cookiesToSet.forEach(({ name, value, options }) => {
					event.cookies.set(name, value, { ...options, path: '/' });
				});
			}
		},
		// We don't use Supabase Realtime, but the client constructs a realtime
		// sub-client unconditionally, which otherwise crashes on Node < 22
		// (no native WebSocket global). `ws` supplies one; harmless either way.
		realtime: {
			// @ts-expect-error - the `ws` package's types don't perfectly match the DOM WebSocket type supabase-js expects
			transport: WebSocket
		}
	});
}
