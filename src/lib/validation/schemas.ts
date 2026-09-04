import { z } from 'zod';

export const skillSchema = z.object({
	name: z.string().trim().min(1, 'Nama wajib diisi.').max(80),
	display_order: z.coerce.number().int()
});

export const statSchema = z.object({
	label: z.string().trim().min(1, 'Label wajib diisi.').max(80),
	value: z.coerce.number().int().min(0, 'Value tidak boleh negatif.'),
	display_order: z.coerce.number().int()
});
