/** Postgres unique_violation code, surfaced by PostgREST as error.code. */
const UNIQUE_VIOLATION = '23505';

export function friendlyDbError(error: { code?: string; message: string }): string {
	if (error.code === UNIQUE_VIOLATION && error.message.includes('display_order')) {
		return 'Urutan itu sudah dipakai baris lain. Pilih angka urutan yang berbeda.';
	}
	return error.message;
}
