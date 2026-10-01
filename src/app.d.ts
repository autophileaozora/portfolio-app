// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { SupabaseClient, Session, User } from '@supabase/supabase-js';
import type { Database } from '$lib/supabase/database.types';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			supabase: SupabaseClient<Database>;
			safeGetSession: () => Promise<{ session: Session | null; user: User | null }>;
			locale: string;
		}
		interface PageData {
			// Only the project detail page's own +page.server.ts actually
			// returns this (testimonials scoped to that project) — declared
			// here so (public)/+layout.svelte, which reads it to override the
			// general testimonials pool, type-checks; SvelteKit merges it in
			// at runtime regardless of this declaration, same as any other
			// route's load data, this just makes the type system aware too.
			projectTestimonials?: Database['public']['Tables']['testimonials']['Row'][] | null;
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
