import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$lib/supabase/database.types';

/** "React, Laravel, MongoDB" -> ['React', 'Laravel', 'MongoDB'], trimmed and deduped. */
export function parseTagsInput(raw: string): string[] {
	const seen = new Set<string>();
	const out: string[] = [];
	for (const part of raw.split(',')) {
		const label = part.trim();
		if (label && !seen.has(label.toLowerCase())) {
			seen.add(label.toLowerCase());
			out.push(label);
		}
	}
	return out;
}

/**
 * Looks up or creates each tag by label, then replaces this project's
 * project_tags links wholesale — simplest correct approach given a project
 * typically has a handful of tags, not worth diffing.
 */
export async function syncProjectTags(supabase: SupabaseClient<Database>, projectId: string, labels: string[]) {
	const tagIds: string[] = [];
	for (const label of labels) {
		const { data, error } = await supabase
			.from('tags')
			.upsert({ label }, { onConflict: 'label' })
			.select('id')
			.single();
		if (error) throw new Error(`Gagal menyimpan tag "${label}": ${error.message}`);
		tagIds.push(data.id);
	}

	const { error: deleteError } = await supabase.from('project_tags').delete().eq('project_id', projectId);
	if (deleteError) throw new Error(`Gagal reset tags: ${deleteError.message}`);

	if (tagIds.length) {
		const rows = tagIds.map((tag_id, i) => ({ project_id: projectId, tag_id, display_order: i }));
		const { error: insertError } = await supabase.from('project_tags').insert(rows);
		if (insertError) throw new Error(`Gagal simpan tags: ${insertError.message}`);
	}
}
