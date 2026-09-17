import React, { useEffect, useState } from 'react';
import {
  Check, ChevronLeft, Download, FileText, Loader2, LogOut, Mail, Plus, RefreshCw, Trash2, X,
} from 'lucide-react';
import {
  EnrolmentRow, GroupClassRow, ReviewRow, SubmissionRow, TeacherRow,
  adminLoadAll, adminLoadEnrolments, deleteEnrolment, deleteGroupClass, deleteReview,
  deleteSubmission, deleteTeacher, isLive, markSubmissionHandled, saveGroupClass,
  FeeOffer, acceptTeacherOffer, adminLoadOffers, cvUrl, isTelegramLink, proposeFee, saveTeacher, screenshotUrl, setEnrolmentAccess, setEnrolmentStatus, setReviewStatus,
  signIn, signOut, supabase,
} from '../supabase';
import {
  PaymentRequest, TeacherPrivateRow, VideoCourseRow, VoucherAttempt, VoucherRow,
  adminLoadPayments, adminLoadVideoCourses, adminLoadVouchers, approveTeacherPhoto,
  cancelVoucher, deleteRequest, deleteVideoCourse, markRequestPaid, payoutProofUrl,
  rejectRequest, rejectTeacherPhoto, removeTeacherPhoto, saveTeacherPrivate,
  saveVideoCourse, teacherPhotoUrl, uploadPayoutProof, voucherProofUrl,
} from '../supabase';
import { money, receiptLink } from '../contact';
import ClassPaste, { ParsedClass } from './ClassPaste';
import { downloadCsv } from '../csv';
import { LevelRow, adminLoadLevels, deleteLevel, saveLevel } from '../supabase';

/* The email you send a student once their payment is confirmed. It is
   composed here and opened in your own Gmail, so it comes from your real
   address and their reply reaches you. */
function studentEmail(row: EnrolmentRow) {
  const link = `${window.location.origin}${window.location.pathname}#receipt/${row.token}`;
  const name = row.first_name || 'there';

  const subject = `${site.shortName} — your place is confirmed (${row.reference})`;

  const lines = [
    `Dear ${name},`,
    ``,
    `Thank you — we have received your payment and your place on ${row.course} is confirmed.`,
    ``,
    `Your receipt: ${link}`,
    `Open that link any time to see or print your receipt. It is marked PAID.`,
  ];

  if (row.access_url) {
    lines.push(``, `Your class: ${row.access_url}`);
  }
  if (row.access_note) {
    lines.push(row.access_note);
  }

  lines.push(``, `Booking reference: ${row.reference}`);
  if (row.teacher) lines.push(`Teacher: ${row.teacher}`);
  if ((row.slots ?? []).length) lines.push(`Times: ${row.slots.join(' · ')}`);
  if (row.start_date) lines.push(`Starts: ${row.start_date}`);
  lines.push(`Fee paid: ${money(row.fee)}`);

  lines.push(
    ``,
    `If you have any questions, reply to this email or message us on Telegram.`,
    ``,
    `${site.shortName}`,
    site.phone,
  );

  return { subject, body: lines.join('\n') };
}

/** Opens Gmail with the message already written. */
function gmailLink(row: EnrolmentRow) {
  const { subject, body } = studentEmail(row);
  const p = new URLSearchParams({
    view: 'cm', fs: '1', to: row.email, su: subject, body,
  });
  return `https://mail.google.com/mail/?${p.toString()}`;
}

/** A short id for a new course. Names written in Burmese leave nothing
 *  behind when stripped to letters and numbers, so those get a generated
 *  id instead of an empty one. */
function courseId(name: string): string {
  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '').slice(0, 30);
  return slug.length >= 2 ? slug : `course-${Date.now().toString(36)}`;
}

const teacherLink = (token: string) =>
  `${window.location.origin}${window.location.pathname}#teacher/${token}`;
import { oneToOneLevels, site } from '../data';
import { monthLabel, thisMonth } from '../content';
import { Availability } from '../data';

/* Your admin page. It lives at  yoursite.com/#admin

   Nothing here works without signing in, and the security rules in the
   database are what enforce that — not this page. Even if someone opened
   this screen, without your login the database refuses every change. */

type Tab = 'enrolments' | 'levels' | 'classes' | 'video' | 'teachers' | 'payments' | 'vouchers' | 'reviews';

const input =
  'w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-600 focus:border-transparent outline-none';
const btn =
  'px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50';

/* availability is stored as a list; we edit it as one line per day:
     Monday | 6:00–8:00 PM                                            */
const availabilityToText = (a: Availability[]) =>
  (a ?? []).map(x => `${x.day} | ${x.times}${x.onRequest ? ' | on request' : ''}`).join('\n');

const textToAvailability = (text: string): Availability[] =>
  text.split('\n').map(line => line.trim()).filter(Boolean).map(line => {
    const [day = '', times = '', flag = ''] = line.split('|').map(s => s.trim());
    const entry: Availability = { day, times };
    if (flag.toLowerCase().includes('request')) entry.onRequest = true;
    return entry;
  }).filter(a => a.day && a.times);

const previousMonth = (month: string) => {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export default function Admin() {
  const [checking, setChecking] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [tab, setTab] = useState<Tab>('enrolments');
  const [enrolments, setEnrolments] = useState<EnrolmentRow[]>([]);
  const [requests, setRequests] = useState<(PaymentRequest & { teacher_id: string })[]>([]);
  const [levels, setLevels] = useState<LevelRow[]>([]);
  const [offers, setOffers] = useState<(FeeOffer & { teacher_id: string })[]>([]);
  const [privates, setPrivates] = useState<TeacherPrivateRow[]>([]);
  const [vouchers, setVouchers] = useState<VoucherRow[]>([]);
  const [attempts, setAttempts] = useState<VoucherAttempt[]>([]);
  const [videos, setVideos] = useState<VideoCourseRow[]>([]);
  const [month, setMonth] = useState(thisMonth());
  const [classes, setClasses] = useState<GroupClassRow[]>([]);
  const [teacherRows, setTeacherRows] = useState<TeacherRow[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [reviewRows, setReviewRows] = useState<ReviewRow[]>([]);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!supabase) { setChecking(false); return; }
    supabase.auth.getSession().then(({ data }) => {
      setSignedIn(Boolean(data.session));
      setChecking(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setSignedIn(Boolean(session));
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const refresh = async () => {
    setBusy(true);
    const [data, bookings, pay, vouch, vids] = await Promise.all([
      adminLoadAll(), adminLoadEnrolments(), adminLoadPayments(),
      adminLoadVouchers(), adminLoadVideoCourses(),
    ]);
    setEnrolments(bookings);
    setRequests(pay.requests);
    setLevels(await adminLoadLevels());
    setOffers(await adminLoadOffers());
    setPrivates(pay.privates);
    setVouchers(vouch.vouchers);
    setAttempts(vouch.attempts);
    setVideos(vids);
    setBusy(false);
    if (!data) return;
    setClasses(data.groupClasses);
    setTeacherRows(data.teachers);
    setSubmissions(data.submissions);
    setReviewRows(data.reviews);
  };

  useEffect(() => { if (signedIn) refresh(); }, [signedIn]);

  const flash = (message: string) => {
    setNote(message);
    setTimeout(() => setNote(''), 3000);
  };

  /* ── not connected ─────────────────────────────────────────────── */
  if (!isLive) {
    return (
      <Shell>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Not connected yet</h1>
        <p className="text-sm text-gray-600 leading-relaxed">
          Paste your Supabase project URL and anon key into <code>src/supabase.ts</code>,
          commit, and this page will ask you to sign in. Until then the website runs from
          <code> src/data.ts</code> exactly as before.
        </p>
      </Shell>
    );
  }

  if (checking) {
    return <Shell><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></Shell>;
  }

  /* ── login ─────────────────────────────────────────────────────── */
  if (!signedIn) {
    const submit = async (e: React.FormEvent) => {
      e.preventDefault();
      setBusy(true);
      setError('');
      const res = await signIn(email.trim(), password);
      setBusy(false);
      if (!res.ok) setError(res.message || 'Wrong email or password.');
    };

    return (
      <Shell>
        <h1 className="text-xl font-bold text-gray-900 mb-1">{site.shortName} admin</h1>
        <p className="text-sm text-gray-500 mb-6">Sign in to manage classes and teachers.</p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="admin-email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input id="admin-email" type="email" required autoComplete="username"
              value={email} onChange={e => setEmail(e.target.value)} className={input} />
          </div>
          <div>
            <label htmlFor="admin-pw" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input id="admin-pw" type="password" required autoComplete="current-password"
              value={password} onChange={e => setPassword(e.target.value)} className={input} />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={busy} className={`${btn} w-full bg-brand-600 text-white hover:bg-brand-700 py-3`}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <a href="#" className="block mt-6 text-sm text-gray-500 hover:text-gray-900">
          <ChevronLeft className="w-4 h-4 inline" /> Back to the website
        </a>
      </Shell>
    );
  }

  /* ── group classes ─────────────────────────────────────────────── */
  const monthClasses = classes
    .filter(c => c.month === month)
    .sort((a, b) => a.sort_order - b.sort_order);

  const editClass = (id: string, patch: Partial<GroupClassRow>) =>
    setClasses(prev => prev.map(c => (c.id === id ? { ...c, ...patch } : c)));

  const addClass = () => {
    const blank: GroupClassRow = {
      id: `new-${Date.now()}`,
      month,
      name: '',
      fee: 0,
      schedule: '',
      start_date: null,
      seats: '',
      visible: true,
      sort_order: monthClasses.length + 1,
    };
    setClasses(prev => [...prev, blank]);
  };

  const copyLastMonth = () => {
    const prev = previousMonth(month);
    const source = classes.filter(c => c.month === prev);
    if (source.length === 0) { flash(`Nothing saved for ${monthLabel(prev)}.`); return; }
    const copies = source.map((c, i) => ({
      ...c,
      id: `new-${Date.now()}-${i}`,
      month,
      start_date: null,
    }));
    setClasses(prev2 => [...prev2, ...copies]);
    flash(`Copied ${source.length} classes from ${monthLabel(prev)}. Check the dates, then save.`);
  };

  const editLevel = (id: string, patch: Partial<LevelRow>) =>
    setLevels(prev => prev.map(l => (l.id === id ? { ...l, ...patch } : l)));

  const addLevel = () => setLevels(prev => [...prev, {
    id: `new-${Date.now()}`, course: 'general', name: '', fee: 0,
    hours: 12, description: '', visible: true, sort_order: prev.length + 1,
  }]);

  const addPastedLevels = async (rows: ParsedClass[]) => {
    setBusy(true);
    let n = 0;
    for (const r of rows) {
      const res = await saveLevel({
        id: courseId(r.name),
        course: /ielts/i.test(r.name) ? 'ielts' : 'general',
        name: r.name.trim(),
        fee: r.fee,
        hours: r.hours,
        description: '',
        visible: true,
        sort_order: 50 + n,
      });
      if (res.error) { setBusy(false); flash(`Not saved — ${res.error.message}`); return; }
      n += 1;
    }
    await refresh();
    setBusy(false);
    flash(`${n} course${n === 1 ? '' : 's'} added. Check them below.`);
  };

  const saveLevels = async () => {
    setBusy(true);
    for (const l of levels) {
      if (!l.name.trim()) continue;
      const res = await saveLevel({
        id: l.id.startsWith('new-') ? courseId(l.name) : l.id,
        course: l.course, name: l.name.trim(), fee: Number(l.fee) || 0,
        hours: l.hours === null || Number.isNaN(Number(l.hours)) ? null : Number(l.hours),
        description: l.description, visible: l.visible, sort_order: l.sort_order,
      });
      if (res.error) { setBusy(false); flash(`Not saved — ${res.error.message}`); return; }
    }
    await refresh();
    setBusy(false);
    flash('Saved. The pricing card and the booking form both show this now.');
  };

  const removeLevel = async (l: LevelRow) => {
    if (!confirm(`Remove ${l.name || 'this course'}? Teachers linked to it keep their other levels.`)) return;
    if (!l.id.startsWith('new-')) await deleteLevel(l.id);
    setLevels(prev => prev.filter(x => x.id !== l.id));
  };

  /* Classes pasted in as text. Each one is filed under the month of its
     own start date, so a mixed list sorts itself out. */
  const addPasted = async (rows: ParsedClass[]) => {
    setBusy(true);
    let n = 0;
    for (const r of rows) {
      const target = r.month || month;
      const res = await saveGroupClass({
        month: target,
        name: r.name,
        fee: r.fee,
        schedule: r.schedule,
        start_date: r.startDate || null,
        seats: r.seats,
        visible: true,
        sort_order: 50 + n,
      });
      if (res.error) { setBusy(false); flash(`Not saved — ${res.error.message}`); return; }
      n += 1;
    }
    await refresh();
    setBusy(false);
    const months = Array.from(new Set(rows.map(r => r.month || month))).sort();
    if (months.length && !months.includes(month)) setMonth(months[0]);
    flash(`${n} class${n === 1 ? '' : 'es'} added. Check them below before telling students.`);
  };

  const saveClasses = async () => {
    setBusy(true);
    let saved = 0;
    let failure = '';
    for (const c of monthClasses) {
      if (!c.name.trim()) continue;
      const row: Partial<GroupClassRow> = {
        month: c.month, name: c.name.trim(), fee: Number(c.fee) || 0,
        schedule: c.schedule, start_date: c.start_date || null,
        seats: c.seats, visible: c.visible, sort_order: c.sort_order,
      };
      if (!c.id.startsWith('new-')) row.id = c.id;
      const res = await saveGroupClass(row);
      if (res.error) failure = failure || `${c.name}: ${res.error.message}`;
      else saved += 1;
    }
    await refresh();
    setBusy(false);
    if (failure) flash(`Not saved — ${failure}`);
    else if (saved === 0) flash('Nothing to save. Add a class first, and give it a name.');
    else flash(`${saved} class${saved === 1 ? '' : 'es'} saved. Students can see them now.`);
  };

  const removeClass = async (c: GroupClassRow) => {
    if (!confirm(`Remove ${c.name || 'this class'}?`)) return;
    if (!c.id.startsWith('new-')) await deleteGroupClass(c.id);
    setClasses(prev => prev.filter(x => x.id !== c.id));
  };

  /* ── teachers ──────────────────────────────────────────────────── */
  const publishSubmission = async (s: SubmissionRow) => {
    const res = await saveTeacher({
      name: s.name,
      course: /ielts/i.test(s.courses) ? 'ielts' : 'general',
      levels: [],
      platform: 'Zoom',
      blurb: s.blurb,
      availability: textToAvailability(s.availability_text) as unknown as Availability[],
      qualifications: (s.qualifications ?? '').split(',').map(x => x.trim()).filter(Boolean),
      demo_url: s.demo_url ?? '',
      teaches_video: s.teaches_video ?? false,
      experience: s.experience ?? '',
      photo: s.photo_consent ? (s.photo ?? '') : '',
      photo_consent: s.photo_consent ?? false,
      status: 'pending',
      sort_order: teacherRows.length + 1,
    });
    if (res.error) { flash(res.error.message); return; }

    const created = (res.data ?? [])[0] as TeacherRow | undefined;
    if (created) {
      await saveTeacherPrivate({
        teacher_id: created.id,
        phone: s.phone, email: s.email, telegram: s.telegram,
        payout_method: s.payout_method ?? '', payout_number: s.payout_number ?? '',
        payout_name: s.payout_name ?? '', agreed_rate: s.fee_request ?? '',
        cv_file: s.cv_file ?? '', experience: s.experience ?? '',
        applied_at: s.created_at,
      });
    }

    await markSubmissionHandled(s.id, true);
    await refresh();
    setTab('teachers');
    flash(`${s.name} is below as PENDING — students cannot see them. Agree the pay, then set them Live.`);
  };

  const editTeacher = (id: string, patch: Partial<TeacherRow>) =>
    setTeacherRows(prev => prev.map(t => (t.id === id ? { ...t, ...patch } : t)));

  const persistTeacher = async (t: TeacherRow) => {
    setBusy(true);
    const { error } = await saveTeacher({
      id: t.id, name: t.name, course: t.course, levels: t.levels,
      platform: t.platform, blurb: t.blurb, availability: t.availability,
      status: t.status, sort_order: t.sort_order,
    });
    setBusy(false);
    flash(error ? error.message : `${t.name} saved.`);
  };

  const removeTeacher = async (t: TeacherRow) => {
    if (!confirm(`Remove ${t.name} from the website?`)) return;
    await deleteTeacher(t.id);
    await refresh();
  };

  const waiting = submissions.filter(s => !s.handled);

  /* ── reviews ───────────────────────────────────────────────────── */
  const pendingReviews = reviewRows.filter(r => r.status === 'pending');
  const approvedReviews = reviewRows.filter(r => r.status === 'approved');

  const waitingPayments = enrolments.filter(e => e.status === 'checking');

  const confirmPayment = async (e: EnrolmentRow) => {
    await setEnrolmentStatus(e.id, 'confirmed');
    await refresh();
    flash(`${e.first_name}'s receipt is now marked PAID. Send them their link.`);
  };

  const rejectPayment = async (e: EnrolmentRow) => {
    const why = prompt('What was wrong? (only you see this)') ?? '';
    await setEnrolmentStatus(e.id, 'rejected', why);
    await refresh();
  };

  /* Your records, as a file Excel opens. */
  const exportEnrolments = () => downloadCsv(
    'effortless-enrolments',
    ['Reference', 'Date', 'Student', 'Phone', 'Email', 'Telegram', 'Type', 'Course',
     'Teacher', 'Times', 'Start', 'Fee', 'Voucher', 'Discount %', 'Paid by',
     'Last 6', 'Status', 'Confirmed', 'Class link', 'Notes'],
    enrolments.map(e => [
      e.reference, e.created_at?.slice(0, 10), `${e.first_name} ${e.last_name}`.trim(),
      e.phone, e.email, e.telegram, e.booking_type, e.course, e.teacher,
      (e.slots ?? []).join(' / '), e.start_date, e.fee,
      (e as unknown as { voucher_code?: string }).voucher_code ?? '',
      (e as unknown as { discount_percent?: number }).discount_percent ?? 0,
      e.payment_method, e.payment_last6, e.status,
      e.confirmed_at?.slice(0, 10), e.access_url, e.notes,
    ]),
  );

  const exportTeachers = () => downloadCsv(
    'effortless-teachers',
    ['Name', 'Status', 'Levels', 'Years', 'Qualifications', 'Phone', 'Email',
     'Telegram', 'Wallet', 'Number', 'Account name', 'Agreed rate', 'Their page'],
    teacherRows.map(t => {
      const p = privateFor(t.id);
      return [
        t.name, t.status, (t.levels ?? []).join(' / '), t.years_experience ?? '',
        (t.qualifications ?? []).join(' / '), p?.phone ?? '', p?.email ?? '',
        p?.telegram ?? '', p?.payout_method ?? '', p?.payout_number ?? '',
        p?.payout_name ?? '', p?.agreed_rate ?? '', teacherLink(t.token),
      ];
    }),
  );

  const exportPayments = () => downloadCsv(
    'effortless-teacher-pay',
    ['Teacher', 'Month', 'Amount', 'Status', 'Asked on', 'Paid on', 'Classes', 'Your note'],
    requests.map(r => [
      teacherName(r.teacher_id), r.period, r.amount, r.status,
      r.created_at?.slice(0, 10), r.paid_at?.slice(0, 10) ?? '', r.detail, r.admin_note,
    ]),
  );

  const owedRequests = requests.filter(r => r.status === 'requested');
  const photosWaiting = teacherRows.filter(t => t.photo_pending).length;

  const editVideo = (id: string, patch: Partial<VideoCourseRow>) =>
    setVideos(prev => prev.map(v => (v.id === id ? { ...v, ...patch } : v)));

  const addVideo = () => setVideos(prev => [...prev, {
    id: `new-${Date.now()}`, title: '', summary: '', fee: 0, lessons: '',
    level: '', access_note: '', visible: true, sort_order: prev.length + 1,
  }]);

  const addPastedVideos = async (rows: ParsedClass[]) => {
    setBusy(true);
    let n = 0;
    for (const r of rows) {
      const res = await saveVideoCourse({
        title: r.name.trim(),
        summary: '',
        fee: r.fee,
        lessons: r.schedule || (r.hours ? `${r.hours} hours` : ''),
        level: '',
        access_note: '',
        visible: true,
        sort_order: 50 + n,
      });
      if (res.error) { setBusy(false); flash(`Not saved — ${res.error.message}`); return; }
      n += 1;
    }
    await refresh();
    setBusy(false);
    flash(`${n} video course${n === 1 ? '' : 's'} added. Add the Telegram link to each one below.`);
  };

  const saveVideos = async () => {
    setBusy(true);
    for (const v of videos) {
      if (!v.title.trim()) continue;
      const row: Partial<VideoCourseRow> = {
        title: v.title.trim(), summary: v.summary, fee: Number(v.fee) || 0,
        lessons: v.lessons, level: v.level, access_note: v.access_note,
        visible: v.visible, sort_order: v.sort_order,
      };
      if (!v.id.startsWith('new-')) row.id = v.id;
      const res = await saveVideoCourse(row);
      if (res.error) { setBusy(false); flash(`Not saved — ${res.error.message}`); return; }
    }
    await refresh();
    setBusy(false);
    flash('Saved. Students can see your video courses now.');
  };
  const privateFor = (id: string) => privates.find(p => p.teacher_id === id);
  const teacherName = (id: string) => teacherRows.find(t => t.id === id)?.name ?? 'Teacher';

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'enrolments', label: 'Enrolments', count: waitingPayments.length },
    { id: 'levels', label: 'One-to-one courses' },
    { id: 'classes', label: 'Group classes' },
    { id: 'video', label: 'Video courses' },
    { id: 'teachers', label: 'Teachers', count: waiting.length + photosWaiting },
    { id: 'payments', label: 'Teacher pay', count: owedRequests.length },
    { id: 'vouchers', label: 'Vouchers' },
    { id: 'reviews', label: 'Reviews', count: pendingReviews.length },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="font-bold text-gray-900">{site.shortName} admin</div>
          <div className="flex items-center gap-2">
            <a href="#" className="text-sm text-gray-500 hover:text-gray-900 px-3">View website</a>
            <button onClick={refresh} className={`${btn} bg-white border border-gray-300 text-gray-700`}>
              <RefreshCw className={`w-4 h-4 ${busy ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={() => signOut()} className={`${btn} bg-white border border-gray-300 text-gray-700 flex items-center gap-2`}>
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-4 flex gap-1 -mb-px">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-3 text-sm font-semibold border-b-2 flex items-center gap-2 ${
                tab === t.id ? 'border-brand-600 text-brand-700' : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}>
              {t.label}
              {!!t.count && (
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">{t.count}</span>
              )}
            </button>
          ))}
        </div>
      </header>

      {note && (
        <div className="max-w-5xl mx-auto px-4 pt-4">
          <div className="px-4 py-3 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm">{note}</div>
        </div>
      )}

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">

        {/* ENROLMENTS */}
        {tab === 'enrolments' && (
          <section className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-bold text-gray-900 mb-1">Student bookings</h2>
              <button onClick={exportEnrolments} className={`${btn} bg-white border border-gray-300 text-gray-700 flex items-center gap-2`}>
                <Download className="w-4 h-4" /> Download for Excel
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-5">
              Check the transfer, then press <strong>Confirm payment</strong>. That turns the
              student's link into a receipt marked PAID, which they can print themselves.
            </p>

            {enrolments.length === 0 && (
              <p className="text-sm text-gray-500 py-8 text-center">No bookings yet.</p>
            )}

            <div className="space-y-3">
              {enrolments.map(e => (
                <EnrolmentCard key={e.id} row={e}
                  onConfirm={() => confirmPayment(e)}
                  onReject={() => rejectPayment(e)}
                  onDelete={async () => {
                    if (confirm(`Delete ${e.first_name}'s booking ${e.reference}?`)) {
                      await deleteEnrolment(e.id); refresh();
                    }
                  }} />
              ))}
            </div>
          </section>
        )}

        {/* ONE-TO-ONE COURSES */}
        {tab === 'levels' && (
          <section className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div>
                <h2 className="font-bold text-gray-900">One-to-one courses</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Your levels and what a student pays for each. Changes show on the pricing
                  card and in the booking form as soon as you save.
                </p>
              </div>
              <button onClick={addLevel} className={`${btn} bg-white border border-gray-300 text-gray-700 flex items-center gap-2 ml-auto`}>
                <Plus className="w-4 h-4" /> Add a course
              </button>
              <button onClick={saveLevels} disabled={busy} className={`${btn} bg-brand-600 text-white hover:bg-brand-700`}>
                {busy ? 'Saving…' : 'Save courses'}
              </button>
            </div>

            <div className="mb-5">
              <ClassPaste mode="levels" onAdd={addPastedLevels} busy={busy} />
            </div>

            <div className="space-y-3">
              {levels.map(l => (
                <div key={l.id} className="grid md:grid-cols-12 gap-3 items-end p-3 rounded-xl border border-gray-200">
                  <div className="md:col-span-4">
                    <label className="block text-xs text-gray-500 mb-1">Course name</label>
                    <input value={l.name} onChange={e => editLevel(l.id, { name: e.target.value })}
                      placeholder="Intermediate" className={input} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs text-gray-500 mb-1">Type</label>
                    <select value={l.course} onChange={e => editLevel(l.id, { course: e.target.value as 'general' | 'ielts' })}
                      className={input}>
                      <option value="general">General English</option>
                      <option value="ielts">IELTS</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs text-gray-500 mb-1">Fee ({site.currency})</label>
                    <input type="number" value={l.fee}
                      onChange={e => editLevel(l.id, { fee: Number(e.target.value) })} className={input} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs text-gray-500 mb-1">Hours</label>
                    <input type="number" value={l.hours ?? ''} placeholder="leave empty"
                      onChange={e => editLevel(l.id, {
                        hours: e.target.value === '' ? null : Number(e.target.value),
                      })} className={input} />
                  </div>
                  <div className="md:col-span-2 flex items-center gap-2 pb-2">
                    <label className="flex items-center gap-1 text-xs text-gray-600">
                      <input type="checkbox" checked={l.visible}
                        onChange={e => editLevel(l.id, { visible: e.target.checked })} />
                      Show
                    </label>
                    <button onClick={() => removeLevel(l)} className="text-gray-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="md:col-span-12">
                    <input value={l.description}
                      onChange={e => editLevel(l.id, { description: e.target.value })}
                      placeholder="Optional line shown under the course name — used on the IELTS card"
                      className={`${input} text-xs`} />
                  </div>
                </div>
              ))}

              {levels.length === 0 && (
                <p className="text-sm text-gray-500 py-8 text-center">
                  No courses yet. If this is unexpected, run schema-9-course-levels.sql in Supabase.
                </p>
              )}
            </div>
          </section>
        )}

        {/* GROUP CLASSES */}
        {tab === 'classes' && (
          <section className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex flex-wrap items-end gap-3 mb-5">
              <div>
                <label htmlFor="month" className="block text-xs font-medium text-gray-500 mb-1">Month</label>
                <input id="month" type="month" value={month} onChange={e => setMonth(e.target.value)}
                  className={`${input} w-48`} />
              </div>
              <button onClick={copyLastMonth} className={`${btn} bg-white border border-gray-300 text-gray-700`}>
                Copy {monthLabel(previousMonth(month))}
              </button>
              <button onClick={addClass} className={`${btn} bg-white border border-gray-300 text-gray-700 flex items-center gap-2`}>
                <Plus className="w-4 h-4" /> Add a class
              </button>
              <button onClick={saveClasses} disabled={busy} className={`${btn} bg-brand-600 text-white hover:bg-brand-700 ml-auto`}>
                {busy ? 'Saving…' : 'Save this month'}
              </button>
            </div>

            <div className="mb-5">
              <ClassPaste onAdd={addPasted} busy={busy} />
            </div>

            <p className="text-sm text-gray-500 mb-4">
              Students see {monthLabel(month)} on the website as soon as you save. Untick <em>Show</em>
              {' '}to hide one class without deleting it.
            </p>

            <div className="space-y-3">
              {monthClasses.map(c => (
                <div key={c.id} className="grid md:grid-cols-12 gap-3 items-end p-3 rounded-xl border border-gray-200">
                  <div className="md:col-span-4">
                    <label className="block text-xs text-gray-500 mb-1">Course</label>
                    <input value={c.name} onChange={e => editClass(c.id, { name: e.target.value })}
                      placeholder="IELTS Intensive Preparation" className={input} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs text-gray-500 mb-1">Fee ({site.currency})</label>
                    <input type="number" value={c.fee}
                      onChange={e => editClass(c.id, { fee: Number(e.target.value) })} className={input} />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-xs text-gray-500 mb-1">Days and times</label>
                    <input value={c.schedule} onChange={e => editClass(c.id, { schedule: e.target.value })}
                      placeholder="Mon & Wed, 6:00–8:00 PM" className={input} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs text-gray-500 mb-1">Starts</label>
                    <input type="date" value={c.start_date ?? ''}
                      onChange={e => editClass(c.id, { start_date: e.target.value || null })} className={input} />
                  </div>
                  <div className="md:col-span-1 flex items-center gap-2 pb-2">
                    <label className="flex items-center gap-1 text-xs text-gray-600">
                      <input type="checkbox" checked={c.visible}
                        onChange={e => editClass(c.id, { visible: e.target.checked })} />
                      Show
                    </label>
                    <button onClick={() => removeClass(c)} className="text-gray-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="md:col-span-12">
                    <input value={c.seats} onChange={e => editClass(c.id, { seats: e.target.value })}
                      placeholder="Optional note for students — '4 places left', 'evenings only'"
                      className={`${input} text-xs`} />
                  </div>
                </div>
              ))}

              {monthClasses.length === 0 && (
                <p className="text-sm text-gray-500 py-8 text-center">
                  Nothing set for {monthLabel(month)} yet. Copy last month, or add a class.
                </p>
              )}
            </div>
          </section>
        )}

        {/* TEACHERS */}
        {tab === 'teachers' && (
          <>
            <section className="bg-white rounded-2xl border border-gray-200 p-5">
              <h2 className="font-bold text-gray-900 mb-1">Waiting for you</h2>
              <p className="text-sm text-gray-500 mb-4">
                Sent through the website. Nobody can see these but you.
              </p>

              {waiting.length === 0 && <p className="text-sm text-gray-500 py-6 text-center">Nothing waiting.</p>}

              <div className="space-y-3">
                {waiting.map(s => (
                  <div key={s.id} className="p-4 rounded-xl border border-amber-200 bg-amber-50/50">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <div className="font-semibold text-gray-900">
                        {s.name}
                        <span className="ml-2 text-xs font-normal text-gray-500">
                          {s.kind === 'update' ? 'updating their hours' : 'new teacher'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(s.created_at).toLocaleDateString('en-GB')}
                      </div>
                    </div>

                    <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm mt-3">
                      <Row label="Phone" value={s.phone} />
                      <Row label="Email" value={s.email} />
                      <Row label="Telegram" value={s.telegram} />
                      <Row label="Teaches" value={s.courses} />
                    </dl>

                    {s.photo && (
                      <div className="flex items-start gap-3 mt-3">
                        <img src={teacherPhotoUrl(s.photo)} alt=""
                          className="w-24 h-24 rounded-xl object-cover border border-gray-200" />
                        <p className="text-xs text-gray-600">
                          {s.photo_consent
                            ? 'They agreed we may show this on the website.'
                            : 'They did NOT tick consent — ask before publishing it.'}
                        </p>
                      </div>
                    )}

                    {s.experience && (
                      <p className="text-sm text-gray-700 mt-3 whitespace-pre-line">
                        <span className="text-gray-500">Experience:</span> {s.experience}
                      </p>
                    )}
                    {s.cv_file && <CvLink path={s.cv_file} />}

                    {s.qualifications && (
                      <p className="text-sm text-gray-700 mt-3">
                        <span className="text-gray-500">Qualifications:</span> {s.qualifications}
                      </p>
                    )}
                    {s.teaches_video && (
                      <p className="inline-block mt-3 px-2 py-1 rounded-md bg-gold-100 text-brand-800 text-xs font-bold">
                        Wants to record video classes
                      </p>
                    )}
                    {s.demo_url && (
                      <a href={s.demo_url} target="_blank" rel="noopener noreferrer"
                        className="inline-block text-sm font-semibold text-brand-700 mt-2">
                        Watch their demo lesson →
                      </a>
                    )}

                    {s.blurb && <p className="text-sm text-gray-700 mt-3">{s.blurb}</p>}

                    {s.availability_text && (
                      <pre className="text-xs bg-white border border-gray-200 rounded-lg p-3 mt-3 whitespace-pre-wrap font-sans">
                        {s.availability_text}
                      </pre>
                    )}

                    {s.fee_request && (
                      <p className="text-sm mt-3 px-3 py-2 rounded-lg bg-gray-900 text-gray-100">
                        Asking to be paid: <strong>{s.fee_request}</strong>
                        <span className="block text-xs text-gray-400 mt-0.5">
                          Private. This never goes on the website.
                        </span>
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2 mt-4">
                      <button onClick={() => publishSubmission(s)} className={`${btn} bg-brand-600 text-white hover:bg-brand-700 flex items-center gap-2`}>
                        <Check className="w-4 h-4" /> Start talking to them
                      </button>
                      <button onClick={async () => { await markSubmissionHandled(s.id, true); refresh(); }}
                        className={`${btn} bg-white border border-gray-300 text-gray-700`}>
                        Mark as dealt with
                      </button>
                      <button onClick={async () => {
                        if (confirm(`Delete this message from ${s.name}?`)) { await deleteSubmission(s.id); refresh(); }
                      }} className={`${btn} text-red-600 hover:bg-red-50`}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-bold text-gray-900 mb-1">On the website</h2>
                <button onClick={exportTeachers} className={`${btn} bg-white border border-gray-300 text-gray-700 flex items-center gap-2`}>
                  <Download className="w-4 h-4" /> Download for Excel
                </button>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                Only teachers set to <strong>Live</strong> can be seen and booked by students.
              </p>

              <div className="space-y-4">
                {teacherRows.map(t => (
                  <div key={t.id} className="p-4 rounded-xl border border-gray-200">
                    {t.status === 'pending' && (
                      <p className="mb-3 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-900">
                        <strong>Not published.</strong> Students cannot see or book {t.name || 'this teacher'}.
                        Agree the pay below, then change Status to Live and press Save.
                      </p>
                    )}

                    <div className="grid md:grid-cols-12 gap-3">
                      <div className="md:col-span-4">
                        <label className="block text-xs text-gray-500 mb-1">Name</label>
                        <input value={t.name} onChange={e => editTeacher(t.id, { name: e.target.value })} className={input} />
                      </div>
                      <div className="md:col-span-3">
                        <label className="block text-xs text-gray-500 mb-1">Course</label>
                        <select value={t.course} onChange={e => editTeacher(t.id, { course: e.target.value as 'general' | 'ielts' })} className={input}>
                          <option value="general">General English</option>
                          <option value="ielts">IELTS</option>
                        </select>
                      </div>
                      <div className="md:col-span-3">
                        <label className="block text-xs text-gray-500 mb-1">Status</label>
                        <select value={t.status}
                          onChange={e => {
                            const next = e.target.value as 'pending' | 'live';
                            if (next === 'live' && !privateFor(t.id)?.agreed_rate) {
                              if (!confirm(
                                `You have not agreed what ${t.name} is paid yet. Publish them anyway?`,
                              )) return;
                            }
                            editTeacher(t.id, { status: next });
                          }}
                          className={input}>
                          <option value="live">Live — students see them</option>
                          <option value="pending">Pending — hidden</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs text-gray-500 mb-1">Order</label>
                        <input type="number" value={t.sort_order}
                          onChange={e => editTeacher(t.id, { sort_order: Number(e.target.value) })} className={input} />
                      </div>

                      <div className="md:col-span-12">
                        <label className="block text-xs text-gray-500 mb-1">Levels they teach</label>
                        <div className="flex flex-wrap gap-2">
                          {(levels.length ? levels : oneToOneLevels).map(l => {
                            const on = t.levels?.includes(l.id);
                            return (
                              <button key={l.id} type="button"
                                onClick={() => editTeacher(t.id, {
                                  levels: on ? t.levels.filter(x => x !== l.id) : [...(t.levels ?? []), l.id],
                                })}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                                  on ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-700 border-gray-300'
                                }`}>
                                {l.name}
                                <span className={on ? 'text-white/70' : 'text-gray-400'}>
                                  {' '}· {(l.fee / 1000).toFixed(0)}k
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="md:col-span-12">
                        <MarginNote levels={levels} chosen={t.levels ?? []} rate={privateFor(t.id)?.agreed_rate ?? ''} />
                      </div>

                      <div className="md:col-span-6">
                        <label className="block text-xs text-gray-500 mb-1">
                          Qualifications — separate with commas
                        </label>
                        <input value={(t.qualifications ?? []).join(', ')}
                          onChange={e => editTeacher(t.id, {
                            qualifications: e.target.value.split(',').map(x => x.trim()).filter(Boolean),
                          })}
                          placeholder="TKT Band 3, CELTA" className={input} />
                      </div>
                      <div className="md:col-span-6">
                        <label className="block text-xs text-gray-500 mb-1">
                          Demo lesson — Telegram link only
                        </label>
                        <input value={t.demo_url ?? ''}
                          onChange={e => editTeacher(t.id, { demo_url: e.target.value })}
                          placeholder="https://t.me/…" className={input} />
                        {t.demo_url && !isTelegramLink(t.demo_url) && (
                          <p className="text-xs text-red-600 mt-1">
                            Not a Telegram link — saving this will be refused.
                          </p>
                        )}
                      </div>
                      <div className="md:col-span-12">
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                          <input type="checkbox" checked={t.teaches_video ?? false}
                            onChange={e => editTeacher(t.id, { teaches_video: e.target.checked })} />
                          Records video classes
                        </label>
                      </div>

                      <div className="md:col-span-6">
                        <label className="block text-xs text-gray-500 mb-1">Short description</label>
                        <textarea rows={3} value={t.blurb} onChange={e => editTeacher(t.id, { blurb: e.target.value })}
                          className={`${input} resize-none`} />
                      </div>
                      <div className="md:col-span-6">
                        <label className="block text-xs text-gray-500 mb-1">
                          Available hours — one line per day, as <code>Day | times</code>
                        </label>
                        <textarea rows={3} value={availabilityToText(t.availability)}
                          onChange={e => editTeacher(t.id, { availability: textToAvailability(e.target.value) })}
                          placeholder={'Monday | 6:00–8:00 PM\nSaturday | 1:00–5:00 PM'}
                          className={`${input} resize-none font-mono text-xs`} />
                      </div>
                    </div>

                    {(t.photo || t.photo_pending) && (
                      <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-gray-100">
                        {t.photo && (
                          <div className="text-center">
                            <img src={teacherPhotoUrl(t.photo)} alt=""
                              className="w-16 h-16 rounded-full object-cover mx-auto" />
                            <div className="text-xs text-gray-500 mt-1">On the site</div>
                          </div>
                        )}
                        {t.photo_pending && (
                          <div className="text-center">
                            <img src={teacherPhotoUrl(t.photo_pending)} alt=""
                              className="w-16 h-16 rounded-full object-cover mx-auto ring-2 ring-amber-400" />
                            <div className="text-xs text-amber-700 mt-1">Waiting</div>
                          </div>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {t.photo_pending && (
                            <>
                              <button onClick={async () => {
                                await approveTeacherPhoto(t.id, t.photo_pending); refresh();
                                flash(`${t.name}'s photo is live.`);
                              }} className={`${btn} bg-brand-600 text-white hover:bg-brand-700`}>
                                Use this photo
                              </button>
                              <button onClick={async () => { await rejectTeacherPhoto(t.id); refresh(); }}
                                className={`${btn} bg-white border border-gray-300 text-gray-700`}>
                                Refuse it
                              </button>
                            </>
                          )}
                          {t.photo && (
                            <button onClick={async () => {
                              if (confirm(`Take ${t.name}'s photo off the website?`)) {
                                await removeTeacherPhoto(t.id); refresh();
                              }
                            }} className={`${btn} text-red-600 hover:bg-red-50`}>
                              Remove photo
                            </button>
                          )}
                          {!t.photo_consent && t.photo_pending && (
                            <span className="text-xs text-red-600 self-center">
                              They have not ticked the consent box
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <FeePanel teacher={t} offers={offers.filter(o => o.teacher_id === t.id)}
                      agreed={privateFor(t.id)?.agreed_rate ?? ''} onDone={refresh} onFlash={flash} />

                    <ReadyChecklist teacher={t} priv={privateFor(t.id)}
                      agreed={privateFor(t.id)?.agreed_rate ?? ''} />

                    <TeacherPrivatePanel teacher={t} row={privateFor(t.id)} requests={requests} onSaved={refresh} />

                    <div className="flex gap-2 mt-3">
                      <button onClick={() => persistTeacher(t)} disabled={busy} className={`${btn} bg-brand-600 text-white hover:bg-brand-700`}>
                        Save {t.name.split(' ')[0]}
                      </button>
                      <button onClick={() => removeTeacher(t)} className={`${btn} text-red-600 hover:bg-red-50 ml-auto`}>
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {/* VIDEO COURSES */}
        {tab === 'video' && (
          <section className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <h2 className="font-bold text-gray-900">Video courses</h2>
              <button onClick={addVideo} className={`${btn} bg-white border border-gray-300 text-gray-700 flex items-center gap-2`}>
                <Plus className="w-4 h-4" /> Add a course
              </button>
              <button onClick={saveVideos} disabled={busy} className={`${btn} bg-brand-600 text-white hover:bg-brand-700 ml-auto`}>
                {busy ? 'Saving…' : 'Save'}
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-4">
              Recorded courses students buy once. They appear on the website and in the booking
              form. Untick <em>Show</em> to hide one without deleting it.
            </p>

            <div className="mb-5">
              <ClassPaste mode="video" onAdd={addPastedVideos} busy={busy} />
            </div>

            <div className="space-y-3">
              {videos.map(v => (
                <div key={v.id} className="grid md:grid-cols-12 gap-3 p-3 rounded-xl border border-gray-200">
                  <div className="md:col-span-5">
                    <label className="block text-xs text-gray-500 mb-1">Title</label>
                    <input value={v.title} onChange={e => editVideo(v.id, { title: e.target.value })}
                      placeholder="IELTS Writing Task 2 — full course" className={input} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs text-gray-500 mb-1">Fee ({site.currency})</label>
                    <input type="number" value={v.fee}
                      onChange={e => editVideo(v.id, { fee: Number(e.target.value) })} className={input} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs text-gray-500 mb-1">Length</label>
                    <input value={v.lessons} onChange={e => editVideo(v.id, { lessons: e.target.value })}
                      placeholder="12 videos · 6 hours" className={input} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs text-gray-500 mb-1">Level</label>
                    <input value={v.level} onChange={e => editVideo(v.id, { level: e.target.value })}
                      placeholder="Intermediate up" className={input} />
                  </div>
                  <div className="md:col-span-1 flex items-center gap-2 pb-2">
                    <label className="flex items-center gap-1 text-xs text-gray-600">
                      <input type="checkbox" checked={v.visible}
                        onChange={e => editVideo(v.id, { visible: e.target.checked })} />
                      Show
                    </label>
                    <button onClick={async () => {
                      if (!confirm(`Remove ${v.title || 'this course'}?`)) return;
                      if (!v.id.startsWith('new-')) await deleteVideoCourse(v.id);
                      setVideos(prev => prev.filter(x => x.id !== v.id));
                    }} className="text-gray-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="md:col-span-6">
                    <input value={v.summary} onChange={e => editVideo(v.id, { summary: e.target.value })}
                      placeholder="What the course covers" className={`${input} text-xs`} />
                  </div>
                  <div className="md:col-span-6">
                    <input value={v.access_note} onChange={e => editVideo(v.id, { access_note: e.target.value })}
                      placeholder="What happens after they pay — e.g. we send the link on Telegram"
                      className={`${input} text-xs`} />
                  </div>
                </div>
              ))}
              {videos.length === 0 && (
                <p className="text-sm text-gray-500 py-8 text-center">
                  No video courses yet. The section stays hidden on the website until you add one.
                </p>
              )}
            </div>
          </section>
        )}

        {/* VOUCHERS */}
        {tab === 'vouchers' && (
          <>
            <section className="bg-white rounded-2xl border border-gray-200 p-5">
              <h2 className="font-bold text-gray-900 mb-1">Returning student codes</h2>
              <p className="text-sm text-gray-500 mb-5">
                Given out by the draw. Check the proof they uploaded — if someone has not really
                studied with you, cancel their code before they spend it.
              </p>

              {vouchers.length === 0 && (
                <p className="text-sm text-gray-500 py-8 text-center">No codes yet.</p>
              )}

              <div className="space-y-2">
                {vouchers.map(v => <VoucherCard key={v.id} row={v} onDone={refresh} />)}
              </div>
            </section>

            <section className="bg-white rounded-2xl border border-gray-200 p-5">
              <h2 className="font-bold text-gray-900 mb-1">Codes that did not work</h2>
              <p className="text-sm text-gray-500 mb-4">
                Every code typed at enrolment that we refused. A few are honest typos. The same
                wrong code over and over is someone guessing.
              </p>

              {attempts.length === 0 && (
                <p className="text-sm text-gray-500 py-6 text-center">Nothing to show.</p>
              )}

              <div className="divide-y divide-gray-100">
                {attempts.map(a => (
                  <div key={a.id} className="flex flex-wrap items-center gap-3 py-2 text-sm">
                    <span className="font-mono font-semibold text-gray-900">{a.code_tried || '(empty)'}</span>
                    <span className="text-gray-500">{a.reason}</span>
                    <span className="text-gray-400 ml-auto text-xs">
                      {new Date(a.created_at).toLocaleString('en-GB')}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {/* TEACHER PAY */}
        {tab === 'payments' && (
          <section className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-bold text-gray-900 mb-1">Teacher pay</h2>
              <button onClick={exportPayments} className={`${btn} bg-white border border-gray-300 text-gray-700 flex items-center gap-2`}>
                <Download className="w-4 h-4" /> Download for Excel
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-5">
              What your teachers have asked for. Their wallet details are shown with each
              request, so you can pay without hunting for them. Upload your transfer
              screenshot and the teacher sees it on their own page.
            </p>

            {requests.length === 0 && (
              <p className="text-sm text-gray-500 py-8 text-center">No requests yet.</p>
            )}

            <div className="space-y-3">
              {requests.map(r => (
                <PayRequestCard key={r.id} row={r}
                  name={teacherName(r.teacher_id)}
                  wallet={privateFor(r.teacher_id)}
                  onDone={refresh} onFlash={flash} />
              ))}
            </div>
          </section>
        )}

        {/* REVIEWS */}
        {tab === 'reviews' && (
          <section className="bg-white rounded-2xl border border-gray-200 p-5">
            <h2 className="font-bold text-gray-900 mb-1">Waiting for approval</h2>
            <p className="text-sm text-gray-500 mb-4">
              Students send these from the website. Nothing appears until you approve it.
            </p>

            {pendingReviews.length === 0 && <p className="text-sm text-gray-500 py-6 text-center">Nothing waiting.</p>}

            <div className="space-y-3">
              {pendingReviews.map(r => (
                <ReviewCard key={r.id} review={r}
                  onApprove={async () => { await setReviewStatus(r.id, 'approved'); refresh(); }}
                  onDelete={async () => { if (confirm('Delete this review?')) { await deleteReview(r.id); refresh(); } }} />
              ))}
            </div>

            <h2 className="font-bold text-gray-900 mt-8 mb-4">On the website</h2>
            <div className="space-y-3">
              {approvedReviews.map(r => (
                <ReviewCard key={r.id} review={r} approved
                  onHide={async () => { await setReviewStatus(r.id, 'pending'); refresh(); }}
                  onDelete={async () => { if (confirm('Delete this review?')) { await deleteReview(r.id); refresh(); } }} />
              ))}
              {approvedReviews.length === 0 && (
                <p className="text-sm text-gray-500 py-6 text-center">No reviews are showing on the website.</p>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

/* ── small pieces ──────────────────────────────────────────────────── */

/* The private side of a teacher: where you pay them, and the link that
   is theirs alone. Never rendered on the public site. */
function TeacherPrivatePanel({
  teacher, row, requests, onSaved,
}: {
  teacher: TeacherRow;
  row?: TeacherPrivateRow;
  requests: (PaymentRequest & { teacher_id: string })[];
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    phone: row?.phone ?? '', email: row?.email ?? '', telegram: row?.telegram ?? '',
    payout_method: row?.payout_method ?? '', payout_number: row?.payout_number ?? '',
    payout_name: row?.payout_name ?? '', agreed_rate: row?.agreed_rate ?? '',
    experience: row?.experience ?? '', note: row?.note ?? '',
  });

  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    setBusy(true);
    await saveTeacherPrivate({ teacher_id: teacher.id, ...form });
    setBusy(false);
    setOpen(false);
    onSaved();
  };

  const copy = async () => {
    await navigator.clipboard.writeText(teacherLink(teacher.token));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-4 pt-4 border-t border-dashed border-gray-300">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wide text-gray-500">Private</span>
        <span className="text-sm text-gray-700">
          {form.payout_method || form.payout_number
            ? `${form.payout_method} ${form.payout_number} · ${form.payout_name}`
            : 'No payment details yet'}
        </span>
        {form.agreed_rate && (
          <span className="text-sm text-gray-700">· {form.agreed_rate}</span>
        )}
        <button onClick={() => setOpen(o => !o)} className={`${btn} bg-white border border-gray-300 text-gray-700 ml-auto`}>
          {open ? 'Close' : 'Edit'}
        </button>
        <button onClick={copy} className={`${btn} bg-white border border-gray-300 text-gray-700`}>
          {copied ? 'Copied' : 'Copy their link'}
        </button>
      </div>

      <TeacherRecord teacher={teacher} row={row} requests={requests} />

      {open && (
        <div className="grid sm:grid-cols-2 gap-3 mt-3">
          {([
            ['payout_method', 'Wallet'], ['payout_number', 'Number'],
            ['payout_name', 'Name on account'], ['agreed_rate', 'Agreed rate'],
            ['phone', 'Phone'], ['telegram', 'Telegram'], ['email', 'Email'],
            ['experience', 'Experience'], ['note', 'Your note'],
          ] as [keyof typeof form, string][]).map(([key, label]) => (
            <div key={key}>
              <label className="block text-xs text-gray-500 mb-1">{label}</label>
              <input value={form[key]} onChange={e => set(key, e.target.value)} className={input} />
            </div>
          ))}
          <div className="sm:col-span-2">
            <button onClick={save} disabled={busy} className={`${btn} bg-brand-600 text-white hover:bg-brand-700`}>
              Save private details
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function VoucherCard({ row, onDone }: { row: VoucherRow; onDone: () => void }) {
  const [proof, setProof] = useState('');
  const [open, setOpen] = useState(false);

  const look = async () => {
    if (!proof) setProof(await voucherProofUrl(row.proof_file));
    setOpen(o => !o);
  };

  const expired = new Date(row.expires_at) < new Date();
  const tone = row.status === 'used' ? 'bg-gray-100 text-gray-700'
    : row.status === 'cancelled' ? 'bg-red-100 text-red-800'
    : expired ? 'bg-gray-100 text-gray-500'
    : 'bg-green-100 text-green-800';
  const word = row.status === 'used' ? `Used · ${row.used_reference}`
    : row.status === 'cancelled' ? 'Cancelled'
    : expired ? 'Expired' : 'Live';

  return (
    <div className="p-4 rounded-xl border border-gray-200">
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-mono font-bold text-gray-900">{row.code}</span>
        <span className="px-2 py-0.5 rounded bg-gold-100 text-brand-800 text-xs font-bold">
          {row.percent}% off
        </span>
        <span className={`px-2 py-0.5 rounded text-xs font-bold ${tone}`}>{word}</span>
        <span className="text-sm text-gray-600">
          {row.student_name} · {row.phone}{row.telegram && ` · ${row.telegram}`}
        </span>
        <span className="text-xs text-gray-400 ml-auto">
          expires {new Date(row.expires_at).toLocaleDateString('en-GB')}
        </span>
      </div>

      {open && proof && (
        <img src={proof} alt="Proof of a previous class"
          className="max-h-80 rounded-lg border border-gray-300 mt-3" />
      )}

      <div className="flex flex-wrap gap-2 mt-3">
        {row.proof_file && (
          <button onClick={look} className={`${btn} bg-white border border-gray-300 text-gray-700`}>
            {open ? 'Hide proof' : 'See their proof'}
          </button>
        )}
        {row.status === 'unused' && (
          <button onClick={async () => {
            if (confirm(`Cancel ${row.code}? They will not be able to use it.`)) {
              await cancelVoucher(row.id); onDone();
            }
          }} className={`${btn} text-red-600 hover:bg-red-50 ml-auto`}>
            Cancel this code
          </button>
        )}
      </div>
    </div>
  );
}

function PayRequestCard({
  row, name, wallet, onDone, onFlash,
}: {
  row: PaymentRequest & { teacher_id: string };
  name: string;
  wallet?: TeacherPrivateRow;
  onDone: () => void;
  onFlash: (m: string) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const pay = async () => {
    setBusy(true);
    let path = row.proof_file;
    if (file) {
      const up = await uploadPayoutProof(row.id, file);
      if (!up.ok) { setBusy(false); onFlash(up.message); return; }
      path = up.path;
    }
    await markRequestPaid(row.id, path, note);
    setBusy(false);
    onFlash(`${name} is marked paid. They can see your screenshot now.`);
    onDone();
  };

  const refuse = async () => {
    const why = prompt('What should the teacher be told?') ?? '';
    await rejectRequest(row.id, why);
    onDone();
  };

  return (
    <div className={`p-4 rounded-xl border ${
      row.status === 'requested' ? 'border-amber-300 bg-amber-50/40' : 'border-gray-200'
    }`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-semibold text-gray-900">
            {name}
            <span className={`ml-2 px-2 py-0.5 rounded text-xs font-bold ${
              row.status === 'paid' ? 'bg-green-100 text-green-800'
                : row.status === 'rejected' ? 'bg-red-100 text-red-800'
                : 'bg-amber-100 text-amber-900'
            }`}>
              {row.status === 'paid' ? 'Paid' : row.status === 'rejected' ? 'Not approved' : 'Asking'}
            </span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {row.period} · sent {new Date(row.created_at).toLocaleDateString('en-GB')}
          </div>
        </div>
        <div className="text-xl font-bold text-gray-900">{money(row.amount)}</div>
      </div>

      {row.detail && <p className="text-sm text-gray-700 mt-3">{row.detail}</p>}

      {/* where to send it — the whole point of this screen */}
      <div className="mt-3 px-4 py-3 rounded-lg bg-gray-900 text-gray-100 text-sm">
        {wallet?.payout_number ? (
          <>
            <div className="font-semibold">
              {wallet.payout_method} · <span className="font-mono">{wallet.payout_number}</span>
            </div>
            <div className="text-gray-300 text-xs mt-0.5">
              Account name: {wallet.payout_name || '—'}
              {wallet.telegram && ` · Telegram ${wallet.telegram}`}
              {wallet.agreed_rate && ` · agreed ${wallet.agreed_rate}`}
            </div>
          </>
        ) : (
          <span className="text-gray-300">
            No payment details on file. Ask them to add them on their teacher page.
          </span>
        )}
      </div>

      {row.admin_note && <p className="text-xs text-gray-600 mt-2">Your note: {row.admin_note}</p>}

      {row.status === 'paid' && row.proof_file && (
        <a href={payoutProofUrl(row.proof_file)} target="_blank" rel="noopener noreferrer"
          className="inline-block mt-3 text-sm font-semibold text-brand-700">
          See the screenshot you sent →
        </a>
      )}

      {row.status === 'requested' && (
        <div className="mt-4 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-gray-400 cursor-pointer bg-white text-sm">
              <span className="truncate">{file ? file.name : 'Your transfer screenshot'}</span>
              <input type="file" accept="image/*,application/pdf" className="hidden"
                onChange={e => setFile(e.target.files?.[0] ?? null)} />
            </label>
            <input value={note} onChange={e => setNote(e.target.value)}
              placeholder="Message to the teacher (optional)" className={input} />
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={pay} disabled={busy} className={`${btn} bg-brand-600 text-white hover:bg-brand-700 flex items-center gap-2`}>
              <Check className="w-4 h-4" /> {busy ? 'Saving…' : 'Mark as paid'}
            </button>
            <button onClick={refuse} className={`${btn} bg-white border border-gray-300 text-gray-700`}>
              Query it
            </button>
            <button onClick={async () => {
              if (confirm('Delete this request?')) { await deleteRequest(row.id); onDone(); }
            }} className={`${btn} text-red-600 hover:bg-red-50 ml-auto`}>Delete</button>
          </div>
        </div>
      )}
    </div>
  );
}

const statusStyle: Record<EnrolmentRow['status'], string> = {
  awaiting_payment: 'bg-gray-100 text-gray-700',
  checking: 'bg-amber-100 text-amber-900',
  confirmed: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

const statusWord: Record<EnrolmentRow['status'], string> = {
  awaiting_payment: 'Not paid yet',
  checking: 'Check this payment',
  confirmed: 'Paid',
  rejected: 'Rejected',
};

function EnrolmentCard({
  row, onConfirm, onReject, onDelete,
}: {
  row: EnrolmentRow;
  onConfirm: () => void;
  onReject: () => void;
  onDelete: () => void;
}) {
  const [shot, setShot] = useState('');
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const [link, setLink] = useState(row.access_url ?? '');
  const [linkNote, setLinkNote] = useState(row.access_note ?? '');
  const [saved, setSaved] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  /* For when Gmail is not your default mail app — paste it anywhere. */
  const copyEmail = async () => {
    const { subject, body } = studentEmail(row);
    await navigator.clipboard.writeText(`${subject}\n\n${body}`);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  const saveLink = async () => {
    await setEnrolmentAccess(row.id, link.trim(), linkNote.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const viewScreenshot = async () => {
    if (!shot) setShot(await screenshotUrl(row.payment_file));
    setOpen(o => !o);
  };

  /* The student's private link — paste it to them on Telegram. */
  const copyLink = async () => {
    await navigator.clipboard.writeText(receiptLink(row.token));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`p-4 rounded-xl border ${
      row.status === 'checking' ? 'border-amber-300 bg-amber-50/40' : 'border-gray-200'
    }`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-semibold text-gray-900">
            {row.first_name} {row.last_name}
            <span className={`ml-2 px-2 py-0.5 rounded text-xs font-bold ${statusStyle[row.status]}`}>
              {statusWord[row.status]}
            </span>
          </div>
          <div className="font-mono text-xs text-gray-500 mt-1">{row.reference}</div>
        </div>
        <div className="text-right">
          <div className="font-bold text-gray-900">{money(row.fee)}</div>
          <div className="text-xs text-gray-500">
            {new Date(row.created_at).toLocaleDateString('en-GB')}
          </div>
        </div>
      </div>

      <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm mt-3">
        <Row label="Course" value={`${row.booking_type} · ${row.course}`} />
        <Row label="Teacher" value={row.teacher} />
        <Row label="Times" value={(row.slots ?? []).join(' · ')} />
        <Row label="Start" value={row.start_date ?? ''} />
        <Row label="Phone" value={row.phone} />
        <Row label="Telegram" value={row.telegram} />
        <Row label="Email" value={row.email} />
        <Row label="Paid by" value={[row.payment_method, row.payment_last6].filter(Boolean).join(' · ')} />
      </dl>

      {row.notes && <p className="text-sm text-gray-700 mt-3">{row.notes}</p>}
      {row.admin_note && (
        <p className="text-xs text-red-700 mt-2">Your note: {row.admin_note}</p>
      )}

      {open && shot && (
        <div className="mt-3">
          <img src={shot} alt="Payment screenshot" className="max-h-96 rounded-lg border border-gray-300" />
        </div>
      )}

      {sending && (
        <div className="mt-4 p-4 rounded-xl border border-gray-300 bg-gray-50 space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Link to their class — Zoom room, video course, anything
            </label>
            <input value={link} onChange={e => setLink(e.target.value)}
              placeholder="https://zoom.us/j/… or https://t.me/…" className={input} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">What to tell them</label>
            <textarea rows={2} value={linkNote} onChange={e => setLinkNote(e.target.value)}
              placeholder="Your first lesson is Monday at 6 PM. Use this room every week."
              className={`${input} resize-none`} />
          </div>
          <div className="flex items-center gap-3">
            <button onClick={saveLink} className={`${btn} bg-brand-600 text-white hover:bg-brand-700`}>
              Save and send
            </button>
            {saved && <span className="text-sm text-green-700">Saved — it is on their page now.</span>}
          </div>
          <p className="text-xs text-gray-500">
            The student sees this on their own private link, and only because their payment
            is confirmed. Save it first, then press <strong>Email their receipt</strong> and the
            class link goes in the message too.
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mt-4">
        {row.payment_file && (
          <button onClick={viewScreenshot} className={`${btn} bg-white border border-gray-300 text-gray-700`}>
            {open ? 'Hide screenshot' : 'View screenshot'}
          </button>
        )}
        {row.status === 'confirmed' && (
          <button onClick={() => setSending(v => !v)} className={`${btn} bg-white border border-gray-300 text-gray-700`}>
            {sending ? 'Close' : row.access_url ? 'Change their class link' : 'Send their class link'}
          </button>
        )}
        {row.status === 'confirmed' && row.email && (
          <a href={gmailLink(row)} target="_blank" rel="noopener noreferrer"
            className={`${btn} bg-brand-600 text-white hover:bg-brand-700 flex items-center gap-2`}>
            <Mail className="w-4 h-4" /> Email their receipt
          </a>
        )}
        {row.status === 'confirmed' && row.email && (
          <button onClick={copyEmail} className={`${btn} bg-white border border-gray-300 text-gray-700`}>
            {copiedEmail ? 'Copied' : 'Copy the message'}
          </button>
        )}
        {row.status !== 'confirmed' && (
          <button onClick={onConfirm} className={`${btn} bg-brand-600 text-white hover:bg-brand-700 flex items-center gap-2`}>
            <Check className="w-4 h-4" /> Confirm payment
          </button>
        )}
        {row.status === 'checking' && (
          <button onClick={onReject} className={`${btn} bg-white border border-gray-300 text-gray-700`}>
            Cannot match it
          </button>
        )}
        <button onClick={copyLink} className={`${btn} bg-white border border-gray-300 text-gray-700`}>
          {copied ? 'Copied' : 'Copy their link'}
        </button>
        <button onClick={onDelete} className={`${btn} text-red-600 hover:bg-red-50 ml-auto`}>Delete</button>
      </div>
    </div>
  );
}

/** What a student pays for each level this teacher is listed under, next
 *  to what you have agreed to pay them. Untick a level here and students
 *  stop being offered that teacher for it. */
/** Agreeing the rate. You offer, they answer — or they ask and you
 *  accept. Only one offer is ever open at a time. */
function FeePanel({
  teacher, offers, agreed, onDone, onFlash,
}: {
  teacher: TeacherRow;
  offers: (FeeOffer & { teacher_id: string })[];
  agreed: string;
  onDone: () => void;
  onFlash: (m: string) => void;
}) {
  const [amount, setAmount] = useState('');
  const [unit, setUnit] = useState('per hour');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const open = offers.find(o => o.status === 'open');

  const send = async () => {
    if (!amount.trim()) { onFlash('Put in an amount first.'); return; }
    setBusy(true);
    const res = await proposeFee(teacher.id, Number(amount), unit, note.trim());
    setBusy(false);
    if (!res.ok) { onFlash(res.message); return; }
    setAmount(''); setNote('');
    onFlash(`Offer sent to ${teacher.name}. They see it on their own page.`);
    onDone();
  };

  const accept = async () => {
    if (!open) return;
    setBusy(true);
    const res = await acceptTeacherOffer(open);
    setBusy(false);
    onFlash(res.ok ? `Agreed with ${teacher.name}.` : res.message);
    onDone();
  };

  return (
    <div className="mt-4 pt-4 border-t border-dashed border-gray-300">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className="text-xs font-bold uppercase tracking-wide text-gray-500">Pay</span>
        {agreed
          ? <span className="text-sm font-semibold text-green-700">Agreed: {agreed}</span>
          : <span className="text-sm text-gray-500">Nothing agreed yet</span>}
      </div>

      {open && open.proposed_by === 'teacher' && (
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 mb-3">
          <div className="text-sm text-gray-900">
            They are asking <strong>{money(open.amount)} {open.unit}</strong>
          </div>
          {open.note && <div className="text-xs text-gray-600 mt-1">{open.note}</div>}
          <button onClick={accept} disabled={busy}
            className={`${btn} bg-brand-600 text-white hover:bg-brand-700 mt-2`}>
            Accept their figure
          </button>
        </div>
      )}

      {open && open.proposed_by === 'school' && (
        <p className="text-sm text-gray-600 mb-3">
          You offered {money(open.amount)} {open.unit} — waiting for their answer.
        </p>
      )}

      <div className="grid sm:grid-cols-4 gap-2">
        <input inputMode="numeric" value={amount} placeholder="Offer amount"
          onChange={e => setAmount(e.target.value.replace(/[^0-9]/g, ''))} className={input} />
        <select value={unit} onChange={e => setUnit(e.target.value)} className={input}>
          <option value="per hour">per hour</option>
          <option value="per session">per session</option>
          <option value="per level">per level</option>
          <option value="per month">per month</option>
        </select>
        <input value={note} onChange={e => setNote(e.target.value)}
          placeholder="Message (optional)" className={input} />
        <button onClick={send} disabled={busy} className={`${btn} bg-brand-600 text-white hover:bg-brand-700`}>
          Send offer
        </button>
      </div>
    </div>
  );
}

/** Everything that should be settled before a teacher goes live, with a
 *  button that emails them about whatever is still missing. */
function ReadyChecklist({
  teacher, priv, agreed,
}: {
  teacher: TeacherRow;
  priv?: TeacherPrivateRow;
  agreed: string;
}) {
  const items: { label: string; done: boolean }[] = [
    { label: 'Photo', done: Boolean(teacher.photo) },
    { label: 'Levels ticked', done: (teacher.levels ?? []).length > 0 },
    { label: 'Hours listed', done: (teacher.availability ?? []).length > 0 },
    { label: 'Experience', done: Boolean(teacher.experience) },
    { label: 'CV', done: Boolean(teacher.cv_file || priv?.cv_file) },
    { label: 'Certificates', done: (teacher.certificates ?? []).length > 0 },
    { label: 'Qualifications', done: (teacher.qualifications ?? []).length > 0 },
    { label: 'Payment details', done: Boolean(priv?.payout_number) },
    { label: 'Pay agreed', done: Boolean(agreed) },
  ];
  const missing = items.filter(i => !i.done);

  const email = () => {
    const subject = `${site.shortName} — before we put you on the website`;
    const body = [
      `Dear ${teacher.name.split(' ')[0]},`,
      ``,
      `Thank you for applying to teach with ${site.shortName}. Before your profile goes live we still need:`,
      ``,
      ...missing.map(m => `- ${m.label}`),
      ``,
      `You can add most of these yourself on your own page:`,
      teacherLink(teacher.token),
      ``,
      `Once everything is in place we will publish your profile and start sending you students.`,
      ``,
      `${site.shortName}`,
      site.phone,
    ].join('\n');
    const p = new URLSearchParams({
      view: 'cm', fs: '1', to: priv?.email ?? '', su: subject, body,
    });
    window.open(`https://mail.google.com/mail/?${p.toString()}`, '_blank');
  };

  return (
    <div className="mt-4 pt-4 border-t border-dashed border-gray-300">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className="text-xs font-bold uppercase tracking-wide text-gray-500">
          Before going live
        </span>
        {missing.length === 0
          ? <span className="text-sm font-semibold text-green-700">Everything is ready</span>
          : <span className="text-sm text-amber-800">{missing.length} still missing</span>}
        <button onClick={email} className={`${btn} bg-white border border-gray-300 text-gray-700 ml-auto flex items-center gap-2`}>
          <Mail className="w-4 h-4" /> Email them about it
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {items.map(i => (
          <span key={i.label} className={`px-2 py-1 rounded-md text-xs font-medium ${
            i.done ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
          }`}>
            {i.done ? '✓' : '○'} {i.label}
          </span>
        ))}
      </div>

      {teacher.status === 'pending' && missing.length === 0 && (
        <p className="text-xs text-gray-500 mt-2">
          Set them to <strong>Live</strong> above and press Save to put them in front of students.
        </p>
      )}
    </div>
  );
}

function MarginNote({
  levels, chosen, rate,
}: {
  levels: LevelRow[];
  chosen: string[];
  rate: string;
}) {
  const picked = levels.filter(l => chosen.includes(l.id));
  if (picked.length === 0 && !rate) return null;

  return (
    <div className="px-3 py-2 rounded-lg bg-gray-900 text-gray-100 text-xs">
      <div className="font-semibold mb-1">
        {rate ? `You pay them: ${rate}` : 'No rate agreed yet'}
      </div>
      {picked.length > 0 ? (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-gray-300">
          {picked.map(l => (
            <span key={l.id}>
              {l.name} <span className="text-white font-medium">{money(l.fee)}</span>
              {l.hours ? ` · ${l.hours}h` : ''}
            </span>
          ))}
        </div>
      ) : (
        <div className="text-gray-400">
          No levels ticked — students cannot book this teacher for anything.
        </div>
      )}
    </div>
  );
}

/** A link that opens a CV. The address lasts an hour and is made only
 *  when you ask for it, so a CV is never sitting on a public address. */
function CvLink({ path, label }: { path: string; label?: string }) {
  const [busy, setBusy] = useState(false);

  const open = async () => {
    setBusy(true);
    const url = await cvUrl(path);
    setBusy(false);
    if (url) window.open(url, '_blank', 'noopener');
  };

  return (
    <button onClick={open} disabled={busy}
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800 mt-2">
      <FileText className="w-4 h-4" /> {busy ? 'Opening…' : label ?? 'Open their CV'}
    </button>
  );
}

/** Everything you keep about a teacher after they are on the website:
 *  how to pay them, how to reach them, their CV, and what they have
 *  asked to be paid so far. */
function TeacherRecord({
  teacher, row, requests,
}: {
  teacher: TeacherRow;
  row?: TeacherPrivateRow;
  requests: (PaymentRequest & { teacher_id: string })[];
}) {
  const mine = requests.filter(r => r.teacher_id === teacher.id);
  const paid = mine.filter(r => r.status === 'paid');
  const total = paid.reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="mt-3 p-3 rounded-lg bg-gray-50 border border-gray-200 text-sm">
      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1">
        <Row label="Phone" value={row?.phone ?? ''} />
        <Row label="Email" value={row?.email ?? ''} />
        <Row label="Telegram" value={row?.telegram ?? ''} />
        <Row label="Applied" value={row?.applied_at
          ? new Date(row.applied_at).toLocaleDateString('en-GB') : ''} />
        <Row label="Agreed rate" value={row?.agreed_rate ?? ''} />
        <Row label="Paid so far" value={paid.length ? `${money(total)} over ${paid.length} payment${paid.length === 1 ? '' : 's'}` : 'nothing yet'} />
      </div>

      {(row?.experience || teacher.experience) && (
        <p className="text-gray-700 mt-2 whitespace-pre-line">
          <span className="text-gray-500">Experience:</span> {row?.experience || teacher.experience}
        </p>
      )}

      {row?.cv_file && <CvLink path={row.cv_file} />}
      {(teacher.certificates ?? []).length > 0 && (
        <div className="mt-2">
          <div className="text-xs text-gray-500 mb-1">Certificates</div>
          <div className="flex flex-wrap gap-2">
            {teacher.certificates.map((c, i) => (
              <CvLink key={c} path={c} label={`Certificate ${i + 1}`} />
            ))}
          </div>
        </div>
      )}

      {mine.length > 0 && (
        <details className="mt-3">
          <summary className="cursor-pointer text-xs font-semibold text-gray-600">
            Payment history ({mine.length})
          </summary>
          <ul className="mt-2 space-y-1 text-xs text-gray-600">
            {mine.map(r => (
              <li key={r.id} className="flex justify-between gap-3">
                <span>{r.period} · {r.status === 'paid' ? 'paid' : r.status}</span>
                <span className="font-medium text-gray-900">{money(r.amount)}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-200 p-8">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex gap-2">
      <dt className="text-gray-500 w-20 shrink-0">{label}</dt>
      <dd className="text-gray-900 font-medium break-words">{value}</dd>
    </div>
  );
}

function ReviewCard({
  review, approved, onApprove, onHide, onDelete,
}: {
  review: ReviewRow;
  approved?: boolean;
  onApprove?: () => void;
  onHide?: () => void;
  onDelete: () => void;
}) {
  return (
    <div className={`p-4 rounded-xl border ${approved ? 'border-gray-200' : 'border-amber-200 bg-amber-50/50'}`}>
      <div className="flex items-baseline justify-between gap-3">
        <div className="font-semibold text-gray-900">{review.name}</div>
        <div className="text-xs text-gray-500">
          {'★'.repeat(review.rating)} · {review.course || 'no course given'}
        </div>
      </div>
      <p className="text-sm text-gray-700 mt-2 leading-relaxed">{review.quote}</p>
      <div className="flex gap-2 mt-3">
        {onApprove && (
          <button onClick={onApprove} className={`${btn} bg-brand-600 text-white hover:bg-brand-700 flex items-center gap-2`}>
            <Check className="w-4 h-4" /> Publish
          </button>
        )}
        {onHide && (
          <button onClick={onHide} className={`${btn} bg-white border border-gray-300 text-gray-700 flex items-center gap-2`}>
            <X className="w-4 h-4" /> Hide
          </button>
        )}
        <button onClick={onDelete} className={`${btn} text-red-600 hover:bg-red-50 ml-auto`}>Delete</button>
      </div>
    </div>
  );
}
