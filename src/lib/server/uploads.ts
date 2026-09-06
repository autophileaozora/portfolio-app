import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$lib/supabase/database.types';

const BUCKET = 'public-assets';

/** Uploads one file to the shared bucket and returns its public URL. */
export async function uploadFile(supabase: SupabaseClient<Database>, file: File, folder: string) {
	const ext = file.name.split('.').pop() || 'bin';
	const path = `${folder}/${crypto.randomUUID()}.${ext}`;
	const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true });
	if (error) throw new Error(`Gagal unggah file: ${error.message}`);
	return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

/**
 * Uploads a new file if one was chosen; otherwise keeps whatever URL the
 * row already had. <input type="file"> can never be pre-filled by the
 * browser, so "no file chosen" must not be read as "clear this field".
 * Pass `null` as existingUrl on create (there's nothing to fall back to).
 */
export async function resolveFileField(
	supabase: SupabaseClient<Database>,
	formData: FormData,
	fieldName: string,
	existingUrl: string | null,
	folder: string
) {
	const file = formData.get(fieldName);
	if (file instanceof File && file.size > 0) {
		return uploadFile(supabase, file, folder);
	}
	return existingUrl;
}
