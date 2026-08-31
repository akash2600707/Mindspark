import { createClient, SupabaseClient } from '@supabase/supabase-js';

/** Service-role client. Bypasses RLS — only ever use it server-side. */
export function adminDb(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase server environment variables are missing.');
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

/** Resolve the Supabase user behind a `Authorization: Bearer <token>` header. */
export async function getUser(req: Request) {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) throw new Error('Supabase public environment variables are missing.');
  const publicDb = createClient(url, anon, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await publicDb.auth.getUser(token);
  if (error) return null;
  return data.user ?? null;
}

/** Throws unless the user is listed in admin_users. */
export async function assertAdmin(db: SupabaseClient, userId: string) {
  const { data, error } = await db
    .from('admin_users')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('You are not authorized as an organizer.');
}

export async function getPublicQuiz(db: SupabaseClient) {
  const { data, error } = await db
    .from('quizzes')
    .select('*')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('No public quiz found.');
  return data;
}
