/* Talks to your Supabase database.

   Your two keys live in src/config.ts, which no update ever replaces.
   They are safe to be public: the publishable key can only do what the
   security rules in supabase/schema.sql allow, which is read published
   classes and send you a form. Everything else needs your login.

   Leave config.ts empty and the website quietly uses src/data.ts
   instead, exactly as it did before there was a database. */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Availability, Teacher } from './data';
import { SUPABASE_KEY, SUPABASE_URL } from './config';

export const isLive = Boolean(SUPABASE_URL && SUPABASE_KEY);

export const supabase: SupabaseClient | null = isLive
  ? createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null;

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
  token: string;
  certificates: string[];
  photo: string;
  experience: string;
  years_experience: number | null;
  cv_file: string;
  qualifications: string[];
  demo_url: string;
  teaches_video: boolean;
  photo_pending: string;
  photo_consent: boolean;
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
  certificates: string[];
  kind: 'new' | 'update';
  name: string;
  phone: string;
  email: string;
  telegram: string;
  courses: string;
  blurb: string;
  availability_text: string;
  fee_request: string;
  qualifications: string;
  demo_url: string;
  teaches_video: boolean;
  experience: string;
  years_experience: number | null;
  cv_file: string;
  photo: string;
  photo_consent: boolean;
  payout_method: string;
  payout_number: string;
  payout_name: string;
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
  photo: r.photo || '',
  qualifications: r.qualifications ?? [],
  demoUrl: r.demo_url ?? '',
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
  qualifications: string;
  demo_url: string;
  teaches_video?: boolean;
  photo?: string;
  photo_consent?: boolean;
  payout_method?: string;
  payout_number?: string;
  payout_name?: string;
  certificates?: string[];
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

/* ── enrolments ────────────────────────────────────────────────────── */

export interface EnrolmentRow {
  id: string;
  reference: string;
  token: string;
  voucher_code: string;
  discount_percent: number;
  full_fee: number;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  telegram: string;
  facebook: string;
  notes: string;
  booking_type: string;
  course: string;
  hours: number | null;
  teacher: string;
  slots: string[];
  start_date: string | null;
  fee: number;
  payment_method: string;
  payment_last6: string;
  payment_file: string;
  status: 'awaiting_payment' | 'checking' | 'confirmed' | 'rejected';
  admin_note: string;
  access_url: string;
  access_note: string;
  created_at: string;
  paid_at: string | null;
  confirmed_at: string | null;
}

/** Saves the booking. The student never reads this table back — they
 *  come back through their private link instead. */
export async function createEnrolment(row: {
  reference: string; token: string;
  first_name: string; last_name: string; phone: string; email: string;
  telegram: string; facebook: string; notes: string;
  booking_type: string; course: string; hours: number | null;
  teacher: string; slots: string[]; start_date: string | null; fee: number;
  payment_method: string; payment_last6: string; payment_file: string;
  status: 'awaiting_payment' | 'checking';
  voucher_code?: string; discount_percent?: number; full_fee?: number;
}) {
  if (!supabase) return { ok: false, message: 'Bookings are not connected yet.' };
  const { error } = await supabase.from('enrolments').insert(row);
  return error ? { ok: false, message: error.message } : { ok: true, message: '' };
}

/** Puts the payment screenshot in the private bucket and returns where
 *  it was put. Only you can open it afterwards. */
export async function uploadPaymentFile(token: string, file: File) {
  if (!supabase) return { ok: false, path: '', message: 'Not connected.' };
  const clean = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_').slice(-60);
  const path = `${token}/${Date.now()}-${clean}`;
  const { error } = await supabase.storage.from('payments').upload(path, file, {
    cacheControl: '3600', upsert: false,
  });
  return error
    ? { ok: false, path: '', message: error.message }
    : { ok: true, path, message: '' };
}

/** The student's private link. Answers only if the token is right. */
export async function getEnrolment(token: string) {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc('get_enrolment', { p_token: token });
  if (error || !data || (data as unknown[]).length === 0) return null;
  return (data as Partial<EnrolmentRow>[])[0];
}

/** Used when a student books first and pays afterwards. */
export async function attachPayment(
  token: string, method: string, last6: string, file: string,
) {
  if (!supabase) return { ok: false, message: 'Not connected.' };
  const { data, error } = await supabase.rpc('attach_payment', {
    p_token: token, p_method: method, p_last6: last6, p_file: file,
  });
  if (error) return { ok: false, message: error.message };
  if (!data) return { ok: false, message: 'This booking has already been dealt with.' };
  return { ok: true, message: '' };
}

/* admin side */

export async function adminLoadEnrolments() {
  if (!supabase) return [];
  const { data } = await supabase.from('enrolments').select('*')
    .order('created_at', { ascending: false }).limit(300);
  return (data ?? []) as EnrolmentRow[];
}

export async function screenshotUrl(path: string) {
  if (!supabase || !path) return '';
  const { data } = await supabase.storage.from('payments').createSignedUrl(path, 3600);
  return data?.signedUrl ?? '';
}

export function setEnrolmentStatus(
  id: string, status: EnrolmentRow['status'], adminNote = '',
) {
  const patch: Record<string, unknown> = { status, admin_note: adminNote };
  if (status === 'confirmed') patch.confirmed_at = new Date().toISOString();
  return supabase!.from('enrolments').update(patch).eq('id', id);
}

export const deleteEnrolment = (id: string) =>
  supabase!.from('enrolments').delete().eq('id', id);

/* ── teachers: their private area and their pay ────────────────────── */

export interface PaymentRequest {
  id: string;
  period: string;
  detail: string;
  amount: number;
  status: 'requested' | 'paid' | 'rejected';
  admin_note: string;
  proof_file: string;
  created_at: string;
  paid_at: string | null;
}

export interface FeeOffer {
  id: string;
  amount: number;
  unit: string;
  proposed_by: 'school' | 'teacher';
  note: string;
  status: 'open' | 'accepted' | 'declined' | 'superseded';
  created_at: string;
}

export interface TeacherHome {
  name: string;
  offers?: FeeOffer[];
  certificates?: string[];
  experience?: string;
  years_experience?: number | null;
  cv_file?: string;
  teaches_video?: boolean;
  demo_url?: string;
  photo: string;
  photo_pending: string;
  photo_consent: boolean;
  status: 'pending' | 'live';
  course: string;
  levels: string[];
  blurb: string;
  availability: { day: string; times: string; onRequest?: boolean }[];
  payout_method: string;
  payout_number: string;
  payout_name: string;
  agreed_rate: string;
  telegram: string;
  requests: PaymentRequest[];
}

export interface TeacherPrivateRow {
  teacher_id: string;
  experience: string;
  cv_file: string;
  applied_at: string | null;
  phone: string;
  email: string;
  telegram: string;
  payout_method: string;
  payout_number: string;
  payout_name: string;
  agreed_rate: string;
  note: string;
}

/** Everything a teacher sees on their own private link. */
export async function teacherHome(token: string): Promise<TeacherHome | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc('teacher_home', { p_token: token });
  if (error || !data) return null;
  return data as TeacherHome;
}

export async function teacherSubmitHours(token: string, hours: string, note: string) {
  if (!supabase) return { ok: false, message: 'Not connected.' };
  const { data, error } = await supabase.rpc('teacher_submit_hours', {
    p_token: token, p_hours: hours, p_note: note,
  });
  if (error) return { ok: false, message: error.message };
  return data ? { ok: true, message: '' } : { ok: false, message: 'We could not find your record.' };
}

export async function teacherRequestPayment(
  token: string, period: string, detail: string, amount: number,
) {
  if (!supabase) return { ok: false, message: 'Not connected.' };
  const { data, error } = await supabase.rpc('teacher_request_payment', {
    p_token: token, p_period: period, p_detail: detail, p_amount: amount,
  });
  if (error) return { ok: false, message: error.message };
  return data
    ? { ok: true, message: '' }
    : { ok: false, message: 'That did not go through. Wait a moment and try again.' };
}

export async function teacherUpdatePayout(
  token: string, method: string, number: string, name: string, telegram: string,
) {
  if (!supabase) return { ok: false, message: 'Not connected.' };
  const { data, error } = await supabase.rpc('teacher_update_payout', {
    p_token: token, p_method: method, p_number: number, p_name: name, p_telegram: telegram,
  });
  if (error) return { ok: false, message: error.message };
  return data ? { ok: true, message: '' } : { ok: false, message: 'We could not find your record.' };
}

/** The public address of a payout screenshot. The file name is random,
 *  so only someone given the address can open it. */
export function payoutProofUrl(path: string) {
  if (!supabase || !path) return '';
  return supabase.storage.from('payouts').getPublicUrl(path).data.publicUrl;
}

/* admin side of teacher pay */

export async function adminLoadPayments() {
  if (!supabase) return { requests: [], teachers: [], privates: [] };
  const [r, t, p] = await Promise.all([
    supabase.from('payment_requests').select('*').order('created_at', { ascending: false }).limit(300),
    supabase.from('teachers').select('id, name, token').order('name'),
    supabase.from('teacher_private').select('*'),
  ]);
  return {
    requests: (r.data ?? []) as (PaymentRequest & { teacher_id: string })[],
    teachers: (t.data ?? []) as { id: string; name: string; token: string }[],
    privates: (p.data ?? []) as TeacherPrivateRow[],
  };
}

export async function uploadPayoutProof(requestId: string, file: File) {
  if (!supabase) return { ok: false, path: '', message: 'Not connected.' };
  const clean = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_').slice(-50);
  const path = `${requestId}/${crypto.randomUUID()}-${clean}`;
  const { error } = await supabase.storage.from('payouts').upload(path, file);
  return error
    ? { ok: false, path: '', message: error.message }
    : { ok: true, path, message: '' };
}

export function markRequestPaid(id: string, proofFile: string, note = '') {
  return supabase!.from('payment_requests').update({
    status: 'paid', proof_file: proofFile, admin_note: note,
    paid_at: new Date().toISOString(),
  }).eq('id', id);
}

export function rejectRequest(id: string, note: string) {
  return supabase!.from('payment_requests')
    .update({ status: 'rejected', admin_note: note }).eq('id', id);
}

export const deleteRequest = (id: string) =>
  supabase!.from('payment_requests').delete().eq('id', id);

export function saveTeacherPrivate(row: Partial<TeacherPrivateRow> & { teacher_id: string }) {
  return supabase!.from('teacher_private')
    .upsert({ ...row, updated_at: new Date().toISOString() });
}

/* ── teacher photos ────────────────────────────────────────────────── */

export function teacherPhotoUrl(path: string) {
  if (!supabase || !path) return '';
  return supabase.storage.from('teacher-photos').getPublicUrl(path).data.publicUrl;
}

export async function uploadTeacherPhoto(token: string, file: File) {
  if (!supabase) return { ok: false, path: '', message: 'Not connected.' };
  const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase().slice(0, 5);
  const path = `${token}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from('teacher-photos').upload(path, file);
  return error ? { ok: false, path: '', message: error.message } : { ok: true, path, message: '' };
}

export async function teacherSetPhoto(token: string, path: string, consent: boolean) {
  if (!supabase) return { ok: false, message: 'Not connected.' };
  const { data, error } = await supabase.rpc('teacher_set_photo', {
    p_token: token, p_path: path, p_consent: consent,
  });
  if (error) return { ok: false, message: error.message };
  return data ? { ok: true, message: '' } : { ok: false, message: 'We could not find your record.' };
}

export const approveTeacherPhoto = (id: string, path: string) =>
  supabase!.from('teachers').update({ photo: path, photo_pending: '' }).eq('id', id);

export const rejectTeacherPhoto = (id: string) =>
  supabase!.from('teachers').update({ photo_pending: '' }).eq('id', id);

export const removeTeacherPhoto = (id: string) =>
  supabase!.from('teachers').update({ photo: '', photo_pending: '' }).eq('id', id);

/* ── returning student vouchers ────────────────────────────────────── */

export interface VoucherRow {
  id: string;
  code: string;
  percent: number;
  student_name: string;
  phone: string;
  telegram: string;
  proof_file: string;
  status: 'unused' | 'used' | 'cancelled';
  used_reference: string;
  created_at: string;
  expires_at: string;
  used_at: string | null;
}

export interface VoucherAttempt {
  id: string;
  code_tried: string;
  reason: string;
  created_at: string;
}

export async function uploadVoucherProof(phone: string, file: File) {
  if (!supabase) return { ok: false, path: '', message: 'Not connected.' };
  const clean = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_').slice(-50);
  const path = `${phone.replace(/\D/g, '') || 'x'}/${Date.now()}-${clean}`;
  const { error } = await supabase.storage.from('voucher-proof').upload(path, file);
  return error ? { ok: false, path: '', message: error.message } : { ok: true, path, message: '' };
}

/** The draw. The result is decided inside the database, not here. */
export async function claimVoucher(
  name: string, phone: string, telegram: string, proof: string,
) {
  if (!supabase) return { ok: false, message: 'Not connected yet.' } as const;
  const { data, error } = await supabase.rpc('claim_voucher', {
    p_name: name, p_phone: phone, p_telegram: telegram, p_proof: proof,
  });
  if (error) return { ok: false, message: error.message } as const;
  return data as {
    ok: boolean; code?: string; percent?: number; expires_at?: string;
    again?: boolean; message?: string;
  };
}

export async function checkVoucher(code: string) {
  if (!supabase) return { valid: false, message: 'Not connected.' };
  const { data, error } = await supabase.rpc('check_voucher', { p_code: code });
  if (error) return { valid: false, message: error.message };
  return data as { valid: boolean; percent?: number; code?: string; message?: string };
}

export async function redeemVoucher(code: string, reference: string) {
  if (!supabase) return false;
  const { data } = await supabase.rpc('redeem_voucher', { p_code: code, p_reference: reference });
  return Boolean(data);
}

export async function adminLoadVouchers() {
  if (!supabase) return { vouchers: [], attempts: [] };
  const [v, a] = await Promise.all([
    supabase.from('vouchers').select('*').order('created_at', { ascending: false }).limit(300),
    supabase.from('voucher_attempts').select('*').order('created_at', { ascending: false }).limit(100),
  ]);
  return {
    vouchers: (v.data ?? []) as VoucherRow[],
    attempts: (a.data ?? []) as VoucherAttempt[],
  };
}

export const cancelVoucher = (id: string) =>
  supabase!.from('vouchers').update({ status: 'cancelled' }).eq('id', id);

export async function voucherProofUrl(path: string) {
  if (!supabase || !path) return '';
  const { data } = await supabase.storage.from('voucher-proof').createSignedUrl(path, 3600);
  return data?.signedUrl ?? '';
}

/* ── video courses ─────────────────────────────────────────────────── */

export interface VideoCourseRow {
  id: string;
  title: string;
  summary: string;
  fee: number;
  lessons: string;
  level: string;
  access_note: string;
  visible: boolean;
  sort_order: number;
}

export async function loadVideoCourses() {
  if (!supabase) return [];
  const { data } = await supabase.from('video_courses').select('*')
    .eq('visible', true).order('sort_order', { ascending: true });
  return (data ?? []) as VideoCourseRow[];
}

export async function adminLoadVideoCourses() {
  if (!supabase) return [];
  const { data } = await supabase.from('video_courses').select('*')
    .order('sort_order', { ascending: true });
  return (data ?? []) as VideoCourseRow[];
}

export const saveVideoCourse = (row: Partial<VideoCourseRow>) =>
  supabase!.from('video_courses').upsert({ ...row, updated_at: new Date().toISOString() }).select();

export const deleteVideoCourse = (id: string) =>
  supabase!.from('video_courses').delete().eq('id', id);

/** A Telegram address, and nothing else. The database refuses anything
 *  that is not one; this lets the teacher see why before they send it. */
export const isTelegramLink = (url: string) =>
  /^https:\/\/(t\.me|telegram\.me)\/[A-Za-z0-9_+/-]+$/i.test(url.trim());

/* ── recorded video classes ────────────────────────────────────────── */

/** A teacher offering to record, or withdrawing the offer. It arrives in
 *  your approval queue like any other change. */
export async function teacherSetVideo(token: string, wants: boolean, demo: string) {
  if (!supabase) return { ok: false, message: 'Not connected.' };
  const { data, error } = await supabase.rpc('teacher_set_video', {
    p_token: token, p_wants: wants, p_demo: demo,
  });
  if (error) return { ok: false, message: error.message };
  return data
    ? { ok: true, message: '' }
    : { ok: false, message: 'The demo must be a Telegram link, starting https://t.me/' };
}

/** The link you hand a student once their payment is confirmed. */
export function setEnrolmentAccess(id: string, url: string, note: string) {
  return supabase!.from('enrolments')
    .update({ access_url: url, access_note: note }).eq('id', id);
}

/* ── one-to-one course levels ──────────────────────────────────────── */

export interface LevelRow {
  id: string;
  course: 'general' | 'ielts';
  name: string;
  fee: number;
  hours: number | null;
  description: string;
  visible: boolean;
  sort_order: number;
}

export async function loadLevels(): Promise<LevelRow[] | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from('course_levels').select('*')
    .eq('visible', true).order('sort_order', { ascending: true });
  if (error || !data || data.length === 0) return null;
  return data as LevelRow[];
}

export async function adminLoadLevels(): Promise<LevelRow[]> {
  if (!supabase) return [];
  const { data } = await supabase.from('course_levels').select('*')
    .order('sort_order', { ascending: true });
  return (data ?? []) as LevelRow[];
}

export const saveLevel = (row: Partial<LevelRow>) =>
  supabase!.from('course_levels')
    .upsert({ ...row, updated_at: new Date().toISOString() }).select();

export const deleteLevel = (id: string) =>
  supabase!.from('course_levels').delete().eq('id', id);

/** A photograph sent with an application, before the teacher has a page
 *  of their own. It sits in the same private-by-name bucket as the rest. */
export async function uploadApplicationPhoto(file: File) {
  if (!supabase) return { ok: false, path: '', message: 'Not connected.' };
  const clean = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_').slice(-40);
  const path = `applications/${crypto.randomUUID()}-${clean}`;
  const { error } = await supabase.storage.from('teacher-photos').upload(path, file);
  return error
    ? { ok: false, path: '', message: error.message }
    : { ok: true, path, message: '' };
}

/* ── CVs ───────────────────────────────────────────────────────────── */

/** A teacher attaching their CV. It goes into a private store that only
 *  your signed-in admin page can open. */
export async function uploadTeacherCv(file: File) {
  if (!supabase) return { ok: false, path: '', message: 'Not connected.' };
  const clean = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_').slice(-60);
  const path = `${crypto.randomUUID()}-${clean}`;
  const { error } = await supabase.storage.from('teacher-cv').upload(path, file);
  return error
    ? { ok: false, path: '', message: error.message }
    : { ok: true, path, message: '' };
}

/** A temporary address for a CV, for your eyes only. Expires in an hour. */
export async function cvUrl(path: string) {
  if (!supabase || !path) return '';
  const { data } = await supabase.storage.from('teacher-cv').createSignedUrl(path, 3600);
  return data?.signedUrl ?? '';
}

/** A teacher sending their experience, or replacing their CV. */
export async function teacherSetCv(
  token: string, cvPath: string, experience: string, years: number | null,
) {
  if (!supabase) return { ok: false, message: 'Not connected.' };
  const { data, error } = await supabase.rpc('teacher_set_cv', {
    p_token: token, p_cv: cvPath, p_experience: experience, p_years: years,
  });
  if (error) return { ok: false, message: error.message };
  return data ? { ok: true, message: '' } : { ok: false, message: 'We could not find your record.' };
}

/* ── agreeing what a teacher is paid ───────────────────────────────── */

/** A teacher naming their own figure. */
export async function teacherProposeFee(
  token: string, amount: number, unit: string, note: string,
) {
  if (!supabase) return { ok: false, message: 'Not connected.' };
  const { data, error } = await supabase.rpc('teacher_propose_fee', {
    p_token: token, p_amount: amount, p_unit: unit, p_note: note,
  });
  if (error) return { ok: false, message: error.message };
  return data ? { ok: true, message: '' } : { ok: false, message: 'That did not go through.' };
}

/** A teacher accepting or declining your offer. */
export async function teacherAnswerFee(
  token: string, offerId: string, accept: boolean, note: string,
) {
  if (!supabase) return { ok: false, message: 'Not connected.' };
  const { data, error } = await supabase.rpc('teacher_answer_fee', {
    p_token: token, p_offer: offerId, p_accept: accept, p_note: note,
  });
  if (error) return { ok: false, message: error.message };
  return data ? { ok: true, message: '' } : { ok: false, message: 'That offer is no longer open.' };
}

/* your side of the same conversation */

export async function adminLoadOffers() {
  if (!supabase) return [];
  const { data } = await supabase.from('fee_offers').select('*')
    .order('created_at', { ascending: false }).limit(500);
  return (data ?? []) as (FeeOffer & { teacher_id: string })[];
}

/** You naming a figure. Any offer still open is set aside first, so there
 *  is only ever one live offer per teacher. */
export async function proposeFee(
  teacherId: string, amount: number, unit: string, note: string,
) {
  if (!supabase) return { ok: false, message: 'Not connected.' };
  await supabase.from('fee_offers').update({ status: 'superseded' })
    .eq('teacher_id', teacherId).eq('status', 'open');
  const { error } = await supabase.from('fee_offers').insert({
    teacher_id: teacherId, amount, unit, proposed_by: 'school', note,
  });
  return error ? { ok: false, message: error.message } : { ok: true, message: '' };
}

/** You accepting what the teacher asked for. Writes the agreed figure
 *  into their private record so it is the same number everywhere. */
export async function acceptTeacherOffer(
  offer: FeeOffer & { teacher_id: string },
) {
  if (!supabase) return { ok: false, message: 'Not connected.' };
  const { error } = await supabase.from('fee_offers')
    .update({ status: 'accepted', responded_at: new Date().toISOString() })
    .eq('id', offer.id);
  if (error) return { ok: false, message: error.message };

  const res = await supabase.from('teacher_private').upsert({
    teacher_id: offer.teacher_id,
    agreed_rate: `${offer.amount.toLocaleString('en-US')} MMK ${offer.unit}`,
    updated_at: new Date().toISOString(),
  });
  return res.error ? { ok: false, message: res.error.message } : { ok: true, message: '' };
}

/** A teacher's certificates, kept in the same private store as CVs. */
export async function teacherSetCertificates(token: string, files: string[]) {
  if (!supabase) return { ok: false, message: 'Not connected.' };
  const { data, error } = await supabase.rpc('teacher_set_certificates', {
    p_token: token, p_files: files,
  });
  if (error) return { ok: false, message: error.message };
  return data ? { ok: true, message: '' } : { ok: false, message: 'We could not find your record.' };
}
