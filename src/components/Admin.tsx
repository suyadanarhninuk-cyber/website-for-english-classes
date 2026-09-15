import React, { useEffect, useState } from 'react';
import {
  Check, ChevronLeft, Loader2, LogOut, Plus, RefreshCw, Trash2, X,
} from 'lucide-react';
import {
  EnrolmentRow, GroupClassRow, ReviewRow, SubmissionRow, TeacherRow,
  adminLoadAll, adminLoadEnrolments, deleteEnrolment, deleteGroupClass, deleteReview,
  deleteSubmission, deleteTeacher, isLive, markSubmissionHandled, saveGroupClass,
  saveTeacher, screenshotUrl, setEnrolmentStatus, setReviewStatus,
  signIn, signOut, supabase,
} from '../supabase';
import { money, receiptLink } from '../contact';
import { oneToOneLevels, site } from '../data';
import { monthLabel, thisMonth } from '../content';
import { Availability } from '../data';

/* Your admin page. It lives at  yoursite.com/#admin

   Nothing here works without signing in, and the security rules in the
   database are what enforce that — not this page. Even if someone opened
   this screen, without your login the database refuses every change. */

type Tab = 'enrolments' | 'classes' | 'teachers' | 'reviews';

const input =
  'w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none';
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
    const [data, bookings] = await Promise.all([adminLoadAll(), adminLoadEnrolments()]);
    setEnrolments(bookings);
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
          <button type="submit" disabled={busy} className={`${btn} w-full bg-indigo-600 text-white hover:bg-indigo-700 py-3`}>
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

  const saveClasses = async () => {
    setBusy(true);
    for (const c of monthClasses) {
      if (!c.name.trim()) continue;
      const row: Partial<GroupClassRow> = {
        month: c.month, name: c.name.trim(), fee: Number(c.fee) || 0,
        schedule: c.schedule, start_date: c.start_date || null,
        seats: c.seats, visible: c.visible, sort_order: c.sort_order,
      };
      if (!c.id.startsWith('new-')) row.id = c.id;
      await saveGroupClass(row);
    }
    await refresh();
    setBusy(false);
    flash('Saved. Students can see it now.');
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
      status: 'pending',
      sort_order: teacherRows.length + 1,
    });
    if (res.error) { flash(res.error.message); return; }
    await markSubmissionHandled(s.id, true);
    await refresh();
    setTab('teachers');
    flash(`${s.name} added below. Tick their levels, then set them to Live.`);
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

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'enrolments', label: 'Enrolments', count: waitingPayments.length },
    { id: 'classes', label: 'Group classes' },
    { id: 'teachers', label: 'Teachers', count: waiting.length },
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
                tab === t.id ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500 hover:text-gray-900'
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
            <h2 className="font-bold text-gray-900 mb-1">Student bookings</h2>
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
              <button onClick={saveClasses} disabled={busy} className={`${btn} bg-indigo-600 text-white hover:bg-indigo-700 ml-auto`}>
                {busy ? 'Saving…' : 'Save this month'}
              </button>
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
                      <button onClick={() => publishSubmission(s)} className={`${btn} bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-2`}>
                        <Check className="w-4 h-4" /> Add to the website
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
              <h2 className="font-bold text-gray-900 mb-1">On the website</h2>
              <p className="text-sm text-gray-500 mb-4">
                Only teachers set to <strong>Live</strong> can be seen and booked by students.
              </p>

              <div className="space-y-4">
                {teacherRows.map(t => (
                  <div key={t.id} className="p-4 rounded-xl border border-gray-200">
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
                        <select value={t.status} onChange={e => editTeacher(t.id, { status: e.target.value as 'pending' | 'live' })} className={input}>
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
                          {oneToOneLevels.map(l => {
                            const on = t.levels?.includes(l.id);
                            return (
                              <button key={l.id} type="button"
                                onClick={() => editTeacher(t.id, {
                                  levels: on ? t.levels.filter(x => x !== l.id) : [...(t.levels ?? []), l.id],
                                })}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                                  on ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-300'
                                }`}>
                                {l.name}
                              </button>
                            );
                          })}
                        </div>
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

                    <div className="flex gap-2 mt-3">
                      <button onClick={() => persistTeacher(t)} disabled={busy} className={`${btn} bg-indigo-600 text-white hover:bg-indigo-700`}>
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

      <div className="flex flex-wrap gap-2 mt-4">
        {row.payment_file && (
          <button onClick={viewScreenshot} className={`${btn} bg-white border border-gray-300 text-gray-700`}>
            {open ? 'Hide screenshot' : 'View screenshot'}
          </button>
        )}
        {row.status !== 'confirmed' && (
          <button onClick={onConfirm} className={`${btn} bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-2`}>
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
          <button onClick={onApprove} className={`${btn} bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-2`}>
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
