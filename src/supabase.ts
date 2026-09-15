/* Talks to your Supabase database.

   The two values below come from Supabase → Project Settings → API.
   They are safe to be public: the "anon" key can only do what the
   security rules in supabase/schema.sql allow, which is read published
   classes and send you a teacher form or a review. Everything else
   needs your login.

   Leave them empty and the website simply uses src/data.ts instead,
   exactly as it did before. */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Availability, Teacher } from './data';

export const SUPABASE_URL = '';       // e.g. https://abcdefgh.supabase.co
export const SUPABASE_ANON_KEY = '';  // the long "anon public" key

export const isLive = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const supabase: SupabaseClient | null = isLive
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null;
export const SUPABASE_URL = 'https://uyltnxevhhmrmetbwccx.supabase.co/rest/v1/';
export const SUPABASE_ANON_KEY = 'sb_publishable_qR9NS9sRvzaccLqymt_08A_guOScd7O';
/* ── shapes ────────────────────────────────────────────────────────── */

export interface GroupClassRow {
  id: string;
  month: string;          // '2026-10'
  name: string;
  fee: number;
  schedule: string;
  start_date: string | null;
  seats: string;
  visible: boolean;
  sort_order: number;
}

export interface TeacherRow {
  id: string;
  name: string;
  course: 'general' | 'ielts';
  levels: string[];
  platform: string;
  blurb: string;
  availability: Availability[];
  status: 'pending' | 'live';
  sort_order: number;
}

export interface SubmissionRow {
  id: string;
  kind: 'new' | 'update';
  name: string;
  phone: string;
  email: string;
  telegram: string;
  courses: string;
  blurb: string;
  availability_text: string;
  fee_request: string;
  handled: boolean;
  created_at: string;
}

export interface ReviewRow {
  id: string;
  quote: string;
  name: string;
  course: string;
  rating: number;
  status: 'pending' | 'approved';
  created_at: string;
}

/** A database teacher row in the same shape as the ones in data.ts, so
 *  the rest of the site does not care where a teacher came from. */
export const rowToTeacher = (r: TeacherRow): Teacher => ({
  name: r.name,
  course: r.course,
  levels: r.levels ?? [],
  platform: r.platform || 'Zoom',
  blurb: r.blurb || '',
  status: r.status,
  availability: Array.isArray(r.availability) ? r.availability : [],
});

/* ── public reads ──────────────────────────────────────────────────── */

export async function loadPublicContent() {
  if (!supabase) return null;
  try {
    const [g, t, r] = await Promise.all([
      supabase.from('group_classes').select('*').eq('visible', true)
        .order('month', { ascending: true }).order('sort_order', { ascending: true }),
      supabase.from('teachers').select('*').eq('status', 'live')
        .order('sort_order', { ascending: true }),
      supabase.from('reviews').select('*').eq('status', 'approved')
        .order('created_at', { ascending: false }),
    ]);
    if (g.error || t.error || r.error) return null;
    return {
      groupClasses: (g.data ?? []) as GroupClassRow[],
      teachers: ((t.data ?? []) as TeacherRow[]).map(rowToTeacher),
      reviews: (r.data ?? []) as ReviewRow[],
    };
  } catch {
    return null;
  }
}

/* ── public writes ─────────────────────────────────────────────────── */

export async function sendTeacherForm(input: {
  kind: 'new' | 'update';
  name: string;
  phone: string;
  email: string;
  telegram: string;
  courses: string;
  blurb: string;
  availability_text: string;
  fee_request: string;
}) {
  if (!supabase) return { ok: false, message: 'The teacher form is not connected yet.' };
  const { error } = await supabase.from('teacher_submissions').insert(input);
  return error ? { ok: false, message: error.message } : { ok: true, message: '' };
}

export async function sendReview(input: {
  quote: string; name: string; course: string; rating: number;
}) {
  if (!supabase) return { ok: false, message: 'Reviews are not connected yet.' };
  const { error } = await supabase.from('reviews').insert({ ...input, status: 'pending' });
  return error ? { ok: false, message: error.message } : { ok: true, message: '' };
}

/* ── admin ─────────────────────────────────────────────────────────── */

export async function signIn(email: string, password: string) {
  if (!supabase) return { ok: false, message: 'Not connected to the database.' };
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return error ? { ok: false, message: error.message } : { ok: true, message: '' };
}

export const signOut = () => supabase?.auth.signOut();

export async function adminLoadAll() {
  if (!supabase) return null;
  const [g, t, s, r] = await Promise.all([
    supabase.from('group_classes').select('*')
      .order('month', { ascending: false }).order('sort_order', { ascending: true }),
    supabase.from('teachers').select('*').order('sort_order', { ascending: true }),
    supabase.from('teacher_submissions').select('*').order('created_at', { ascending: false }),
    supabase.from('reviews').select('*').order('created_at', { ascending: false }),
  ]);
  return {
    groupClasses: (g.data ?? []) as GroupClassRow[],
    teachers: (t.data ?? []) as TeacherRow[],
    submissions: (s.data ?? []) as SubmissionRow[],
    reviews: (r.data ?? []) as ReviewRow[],
    error: g.error || t.error || s.error || r.error || null,
  };
}

export const saveGroupClass = (row: Partial<GroupClassRow>) =>
  supabase!.from('group_classes').upsert({ ...row, updated_at: new Date().toISOString() }).select();

export const deleteGroupClass = (id: string) =>
  supabase!.from('group_classes').delete().eq('id', id);

export const saveTeacher = (row: Partial<TeacherRow>) =>
  supabase!.from('teachers').upsert({ ...row, updated_at: new Date().toISOString() }).select();

export const deleteTeacher = (id: string) =>
  supabase!.from('teachers').delete().eq('id', id);

export const markSubmissionHandled = (id: string, handled: boolean) =>
  supabase!.from('teacher_submissions').update({ handled }).eq('id', id);

export const deleteSubmission = (id: string) =>
  supabase!.from('teacher_submissions').delete().eq('id', id);

export const setReviewStatus = (id: string, status: 'pending' | 'approved') =>
  supabase!.from('reviews').update({ status }).eq('id', id);

export const deleteReview = (id: string) =>
  supabase!.from('reviews').delete().eq('id', id);
