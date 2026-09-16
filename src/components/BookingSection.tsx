import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  CheckCircle2, ChevronRight, Clock, Copy, Check, Printer, PlayCircle, User, Users,
  ExternalLink, Link2,
} from 'lucide-react';
import { oneToOneLevels, site, payment } from '../data';
import { monthLabel, thisMonth, useContent } from '../content';
import {
  Enrolment,
  deliverEnrolment,
  enrolmentText,
  expandSlots,
  mailtoLink,
  makeReference,
  makeToken,
  messagingLinks,
  money,
  receiptLink,
  registrationLink,
  slotLabel,
} from '../contact';
import {
  checkVoucher, createEnrolment, isLive, loadVideoCourses, redeemVoucher,
  teacherPhotoUrl, uploadPaymentFile, VideoCourseRow,
} from '../supabase';
import Receipt from './Receipt';
import PaymentPanel, { PaymentDetails } from './PaymentPanel';

type BookingMode = 'one-to-one' | 'group' | 'video' | null;

export default function BookingSection() {
  const { teachers, groupClasses, months, videoCourses } = useContent();

  const [step, setStep] = useState(1);
  const [mode, setMode] = useState<BookingMode>(null);

  const [levelId, setLevelId] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [groupCourse, setGroupCourse] = useState('');
  const [videoCourse, setVideoCourse] = useState('');

  const [voucher, setVoucher] = useState('');
  const [voucherPct, setVoucherPct] = useState(0);
  const [voucherMsg, setVoucherMsg] = useState('');
  const [checking, setChecking] = useState(false);
  const [slotIdxs, setSlotIdxs] = useState<number[]>([]);
  const [startDate, setStartDate] = useState('');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [telegram, setTelegram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [notes, setNotes] = useState('');

  const [sending, setSending] = useState(false);
  const [issued, setIssued] = useState<Enrolment | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [saveError, setSaveError] = useState('');

  /* The group courses on offer: this month's batch when the database is
     driving things, otherwise everything in src/data.ts. */
  const bookableGroup = useMemo(() => {
    if (months.length === 0) return groupClasses;
    const now = thisMonth();
    const month = months.find(m => m >= now) ?? months[months.length - 1];
    return groupClasses.filter(c => c.month === month);
  }, [groupClasses, months]);

  const groupMonth = months.length
    ? (months.find(m => m >= thisMonth()) ?? months[months.length - 1])
    : '';

  /* "Book with this teacher" buttons in the teachers section land here. */
  useEffect(() => {
    const handler = (ev: Event) => {
      const name = (ev as CustomEvent<{ name: string }>).detail?.name;
      const t = teachers.find(x => x.name === name);
      if (!t) return;
      setIssued(null);
      setMode('one-to-one');
      setGroupCourse('');
      setLevelId(t.levels[0] ?? '');
      setTeacherName(t.name);
      setSlotIdxs([]);
      setStep(2);
    };
    window.addEventListener('ee:select-teacher', handler);
    return () => window.removeEventListener('ee:select-teacher', handler);
  }, [teachers]);

  const chooseMode = (m: BookingMode) => {
    setMode(m);
    setLevelId('');
    setTeacherName('');
    setGroupCourse('');
    setVideoCourse('');
    setSlotIdxs([]);
  };

  const chooseLevel = (id: string) => {
    setLevelId(id);
    if (teacherName) {
      const t = teachers.find(x => x.name === teacherName);
      if (!t || !t.levels.includes(id)) setTeacherName('');
    }
    setSlotIdxs([]);
  };

  const matchingTeachers = useMemo(
    () => (levelId ? teachers.filter(t => t.levels.includes(levelId)) : []),
    [levelId, teachers],
  );

  const teacher = teachers.find(t => t.name === teacherName) || null;
  const slots = useMemo(() => (teacher ? expandSlots(teacher) : []), [teacher]);
  const chosenSlots = slotIdxs.map(i => slots[i]).filter(Boolean).map(slotLabel);

  const levelObj = oneToOneLevels.find(l => l.id === levelId);
  const groupObj = bookableGroup.find(g => g.name === groupCourse);
  const videoObj = videoCourses.find(v => v.title === videoCourse);

  const fullFee = levelObj?.fee ?? groupObj?.fee ?? videoObj?.fee ?? 0;
  const fee = voucherPct
    ? Math.round((fullFee * (100 - voucherPct)) / 100)
    : fullFee;

  const applyVoucher = async () => {
    const code = voucher.trim().toUpperCase();
    if (!code) { setVoucherPct(0); setVoucherMsg(''); return; }
    setChecking(true);
    const res = await checkVoucher(code);
    setChecking(false);
    if (res.valid) {
      setVoucherPct(res.percent ?? 0);
      setVoucherMsg(`${res.percent}% off applied.`);
    } else {
      setVoucherPct(0);
      setVoucherMsg(res.message || 'That code did not work.');
    }
  };

  const toggleSlot = (i: number) =>
    setSlotIdxs(prev =>
      prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i].sort((a, b) => a - b),
    );

  const step1Done =
    mode === 'group' ? !!groupCourse
    : mode === 'video' ? !!videoCourse
    : !!levelId;

  const step2Done =
    mode === 'one-to-one' ? !!teacherName && chosenSlots.length > 0 && !!startDate : true;

  const selectionLabel = () => {
    if (!mode) return 'One-to-one, group or video';
    if (mode === 'group') return groupCourse || 'Select a group course';
    if (mode === 'video') return videoCourse || 'Select a video course';
    return levelObj ? levelObj.name : 'Select a level';
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (sending) return;

    const enrolment: Enrolment = {
      reference: makeReference(),
      issuedAt: new Date().toISOString(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      telegram: telegram.trim(),
      facebook: facebook.trim(),
      notes: notes.trim(),
      bookingType: mode === 'group' ? 'Group course' : mode === 'video' ? 'Video course' : 'One-to-One',
      course: mode === 'group' ? groupCourse : mode === 'video' ? videoCourse : levelObj?.name || '',
      hours: mode === 'one-to-one' ? levelObj?.hours ?? null : null,
      teacher: mode === 'one-to-one' ? teacherName : '',
      slots: mode === 'group'
        ? (groupObj?.schedule ? [groupObj.schedule] : [])
        : mode === 'video' ? [] : chosenSlots,
      startDate: mode === 'group' ? (groupObj?.start_date ?? '')
        : mode === 'video' ? '' : startDate,
      fee,
      fullFee,
      voucherCode: voucherPct ? voucher.trim().toUpperCase() : '',
      discountPercent: voucherPct,
    };

    if (!isLive) {
      setSending(true);
      await deliverEnrolment(enrolment);   // emails you a copy if Formspree is set up
      setSending(false);
      setIssued(enrolment);
      setStep(4);
      return;
    }

    enrolment.token = makeToken();
    enrolment.status = 'awaiting_payment';
    setIssued(enrolment);
    setSaveError('');
    setStep(4);
  };

  /** Saves the booking. Called whether they pay now or pay later. */
  const saveBooking = async (details: PaymentDetails | null) => {
    if (!issued?.token) return;
    setSending(true);
    setSaveError('');

    let filePath = '';
    if (details?.file) {
      const up = await uploadPaymentFile(issued.token, details.file);
      if (!up.ok) {
        setSending(false);
        setSaveError(`Your screenshot would not upload: ${up.message}`);
        return;
      }
      filePath = up.path;
    }

    const status = details ? 'checking' : 'awaiting_payment';
    const res = await createEnrolment({
      reference: issued.reference,
      token: issued.token,
      first_name: issued.firstName,
      last_name: issued.lastName,
      phone: issued.phone,
      email: issued.email,
      telegram: issued.telegram,
      facebook: issued.facebook,
      notes: issued.notes,
      booking_type: issued.bookingType,
      course: issued.course,
      hours: issued.hours,
      teacher: issued.teacher,
      slots: issued.slots,
      start_date: issued.startDate || null,
      fee: issued.fee,
      payment_method: details?.method ?? '',
      payment_last6: details?.last6 ?? '',
      payment_file: filePath,
      status,
      voucher_code: issued.voucherCode ?? '',
      discount_percent: issued.discountPercent ?? 0,
      full_fee: issued.fullFee ?? issued.fee,
    });

    setSending(false);
    if (!res.ok) { setSaveError(res.message); return; }

    if (issued.voucherCode) await redeemVoucher(issued.voucherCode, issued.reference);

    const saved: Enrolment = {
      ...issued,
      status,
      paymentMethod: details?.method ?? '',
      paymentLast6: details?.last6 ?? '',
      paidAt: details ? new Date().toISOString() : null,
    };
    setIssued(saved);
    deliverEnrolment(saved);   // emails you a copy too, if Formspree is set up
    setStep(5);
  };

  const copyLink = async () => {
    if (!issued?.token) return;
    try {
      await navigator.clipboard.writeText(receiptLink(issued.token));
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      setCopiedLink(false);
    }
  };

  const copyReceipt = async () => {
    if (!issued) return;
    try {
      await navigator.clipboard.writeText(enrolmentText(issued));
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  const startOver = () => {
    setIssued(null);
    setSaveError('');
    setStep(1);
    setMode(null);
    setLevelId(''); setTeacherName(''); setGroupCourse(''); setVideoCourse('');
    setSlotIdxs([]); setStartDate('');
    setVoucher(''); setVoucherPct(0); setVoucherMsg('');
    setFirstName(''); setLastName(''); setEmail(''); setPhone('');
    setTelegram(''); setFacebook(''); setNotes('');
  };

  const stepLabels = isLive
    ? ['Course', 'Teacher & times', 'Your details', 'Payment', 'Done']
    : ['Course', 'Teacher & times', 'Your details', 'Receipt'];
  const lastStep = isLive ? 5 : 4;
  const field =
    'w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-brand-600 focus:border-transparent outline-none transition-all';

  return (
    <section id="booking" className="scroll-mt-20 py-24 bg-brand-900 relative overflow-hidden print:bg-white print:py-0">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 no-print">
        <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-brand-800/50 blur-3xl"></div>
        <div className="absolute -bottom-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-brand-800/50 blur-3xl"></div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 no-print">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">Book your classes</h2>
          <p className="text-lg text-brand-200">
            Pick your course, your teacher and your times. You get a receipt with your
            reference number straight away.
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px] print:shadow-none print:rounded-none print:block">
          {/* progress rail */}
          <div className="bg-gray-50 p-8 md:w-1/3 border-r border-gray-100 flex flex-col no-print">
            <h3 className="font-bold text-gray-900 mb-8 text-xl">Enrolment process</h3>

            <div className="space-y-8 flex-grow">
              {stepLabels.map((label, i) => {
                const n = i + 1;
                const done = step > n;
                const current = step === n;
                return (
                  <div className="flex gap-4" key={label}>
                    <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                      done ? 'bg-green-500 text-white' : current ? 'bg-brand-600 text-white' : 'bg-gray-200 text-gray-400'
                    }`}>
                      {done ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-xs font-bold">{n}</span>}
                    </div>
                    <div>
                      <div className={`font-semibold ${step >= n ? 'text-gray-900' : 'text-gray-400'}`}>{label}</div>
                      <div className="text-sm text-gray-500 mt-1">
                        {n === 1 && selectionLabel()}
                        {n === 2 && (mode === 'group'
                          ? 'Fixed group timetable'
                          : teacherName || 'Pick a teacher and times')}
                        {n === 3 && (firstName ? `${firstName} ${lastName}`.trim() : 'Name and contact')}
                        {n === 4 && (isLive
                          ? (issued ? `${money(issued.fee)} · ${issued.reference}` : 'Transfer and upload')
                          : (issued ? issued.reference : 'Print it or send it to us'))}
                        {n === 5 && (issued?.status === 'checking'
                          ? 'We are checking your payment'
                          : 'Keep your reference')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200 text-xs text-gray-500 leading-relaxed">
              Pay by {payment.methods.map(m => m.name).join(', ')} to {payment.accountName}.
              One-to-one students pay only after we confirm the timetable.
            </div>
          </div>

          {/* panel */}
          <div className="p-8 md:p-10 md:w-2/3 flex flex-col print:p-0 print:w-full">

            {/* STEP 1 */}
            {step === 1 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="h-full flex flex-col">
                <h4 className="text-2xl font-bold text-gray-900 mb-6">What would you like to study?</h4>

                <div className="grid sm:grid-cols-3 gap-4 mb-8">
                  <button type="button" onClick={() => chooseMode('one-to-one')}
                    className={`text-left p-5 rounded-2xl border-2 transition-colors ${
                      mode === 'one-to-one' ? 'border-brand-600 bg-brand-50' : 'border-gray-200 hover:border-brand-300'
                    }`}>
                    <User className="w-6 h-6 text-brand-600 mb-3" />
                    <div className="font-bold text-gray-900">One-to-one</div>
                    <div className="text-sm text-gray-600 mt-1">You choose the teacher and the hours.</div>
                  </button>

                  <button type="button" onClick={() => chooseMode('group')}
                    className={`text-left p-5 rounded-2xl border-2 transition-colors ${
                      mode === 'group' ? 'border-brand-600 bg-brand-50' : 'border-gray-200 hover:border-brand-300'
                    }`}>
                    <Users className="w-6 h-6 text-brand-600 mb-3" />
                    <div className="font-bold text-gray-900">Group course</div>
                    <div className="text-sm text-gray-600 mt-1">Fixed timetable, learn with others.</div>
                  </button>

                  {videoCourses.length > 0 && (
                    <button type="button" onClick={() => chooseMode('video')}
                      className={`text-left p-5 rounded-2xl border-2 transition-colors ${
                        mode === 'video' ? 'border-brand-600 bg-brand-50' : 'border-gray-200 hover:border-brand-300'
                      }`}>
                      <PlayCircle className="w-6 h-6 text-brand-600 mb-3" />
                      <div className="font-bold text-gray-900">Video course</div>
                      <div className="text-sm text-gray-600 mt-1">Recorded. Watch whenever you like.</div>
                    </button>
                  )}
                </div>

                {mode === 'one-to-one' && (
                  <div className="space-y-2 flex-grow">
                    {oneToOneLevels.map(l => (
                      <button key={l.id} type="button" onClick={() => chooseLevel(l.id)}
                        className={`w-full flex items-center justify-between gap-4 p-4 rounded-xl border transition-colors text-left ${
                          levelId === l.id ? 'border-brand-600 bg-brand-50' : 'border-gray-200 hover:border-brand-300'
                        }`}>
                        <span>
                          <span className="block font-semibold text-gray-900">{l.name}</span>
                          {l.hours && (
                            <span className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                              <Clock className="w-3 h-3" /> {l.hours} hours
                            </span>
                          )}
                        </span>
                        <span className="font-bold text-brand-600 whitespace-nowrap">{money(l.fee)}</span>
                      </button>
                    ))}
                  </div>
                )}

                {mode === 'group' && (
                  <div className="space-y-2 flex-grow">
                    {groupMonth && (
                      <p className="text-sm font-semibold text-brand-700 mb-2">
                        {monthLabel(groupMonth)} timetable
                      </p>
                    )}
                    {bookableGroup.map(g => (
                      <button key={g.id} type="button" onClick={() => setGroupCourse(g.name)}
                        className={`w-full flex items-center justify-between gap-4 p-4 rounded-xl border transition-colors text-left ${
                          groupCourse === g.name ? 'border-brand-600 bg-brand-50' : 'border-gray-200 hover:border-brand-300'
                        }`}>
                        <span>
                          <span className="block font-semibold text-gray-900">{g.name}</span>
                          {(g.schedule || g.seats) && (
                            <span className="block text-xs text-gray-500 mt-1">
                              {g.schedule}{g.schedule && g.seats ? ' · ' : ''}{g.seats}
                            </span>
                          )}
                        </span>
                        <span className="font-bold text-brand-600 whitespace-nowrap">{money(g.fee)}</span>
                      </button>
                    ))}
                    {bookableGroup.length === 0 && (
                      <p className="text-sm text-gray-600 py-6">
                        No group classes are open at the moment. Message us and we will tell you when the
                        next batch starts.
                      </p>
                    )}
                  </div>
                )}

                {mode === 'video' && (
                  <div className="space-y-2 flex-grow">
                    {videoCourses.map(v => (
                      <button key={v.id} type="button" onClick={() => setVideoCourse(v.title)}
                        className={`w-full flex items-center justify-between gap-4 p-4 rounded-xl border transition-colors text-left ${
                          videoCourse === v.title ? 'border-brand-600 bg-brand-50' : 'border-gray-200 hover:border-brand-300'
                        }`}>
                        <span>
                          <span className="block font-semibold text-gray-900">{v.title}</span>
                          {(v.lessons || v.level) && (
                            <span className="block text-xs text-gray-500 mt-1">
                              {[v.lessons, v.level].filter(Boolean).join(' · ')}
                            </span>
                          )}
                        </span>
                        <span className="font-bold text-brand-600 whitespace-nowrap">{money(v.fee)}</span>
                      </button>
                    ))}
                  </div>
                )}

                <div className="mt-8 flex justify-end pt-4 border-t border-gray-100">
                  <button type="button" onClick={() => setStep(2)} disabled={!step1Done}
                    className="px-8 py-3 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2">
                    Continue <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="h-full flex flex-col">
                <div className="flex items-center gap-4 mb-6">
                  <button type="button" onClick={() => setStep(1)} className="text-sm font-medium text-gray-500 hover:text-gray-900">Back</button>
                  <h4 className="text-2xl font-bold text-gray-900">
                    {mode === 'group' ? 'Your group timetable'
                      : mode === 'video' ? 'Your video course'
                      : 'Choose your teacher and times'}
                  </h4>
                </div>

                {mode === 'one-to-one' ? (
                  <div className="flex-grow space-y-6">
                    <div>
                      <div className="text-sm font-bold text-gray-900 mb-2">Teacher</div>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {matchingTeachers.map(t => (
                          <button key={t.name} type="button"
                            onClick={() => { setTeacherName(t.name); setSlotIdxs([]); }}
                            className={`text-left p-4 rounded-xl border transition-colors flex gap-3 ${
                              teacherName === t.name ? 'border-brand-600 bg-brand-50' : 'border-gray-200 hover:border-brand-300'
                            }`}>
                            {t.photo ? (
                              <img src={teacherPhotoUrl(t.photo)} alt=""
                                className="w-12 h-12 rounded-full object-cover shrink-0" />
                            ) : (
                              <span className="w-12 h-12 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold shrink-0">
                                {t.name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase()}
                              </span>
                            )}
                            <span>
                              <span className="block font-semibold text-gray-900">{t.name}</span>
                              <span className="block text-xs text-gray-600 mt-1 leading-relaxed">{t.blurb}</span>
                            </span>
                          </button>
                        ))}
                        {matchingTeachers.length === 0 && (
                          <p className="text-sm text-gray-600">
                            No teacher is listed for this level yet. Choose another level, or message us and
                            we will find someone for you.
                          </p>
                        )}
                      </div>
                    </div>

                    {teacher && (
                      <div>
                        <div className="text-sm font-bold text-gray-900 mb-1">
                          Tick the times you want · {site.timezoneLabel}
                        </div>
                        <p className="text-xs text-gray-500 mb-3">
                          Choose as many as you like. We confirm them with {teacher.name.split(' ')[0]} before your first lesson.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {slots.map((s, i) => (
                            <button key={`${s.day}-${s.times}-${i}`} type="button" onClick={() => toggleSlot(i)}
                              className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
                                slotIdxs.includes(i)
                                  ? 'border-brand-600 bg-brand-600 text-white'
                                  : 'border-gray-200 text-gray-700 hover:border-brand-300'
                              }`}>
                              <span className="font-semibold">{s.day}</span>{' '}
                              <span className={slotIdxs.includes(i) ? 'text-brand-100' : 'text-gray-500'}>{s.times}</span>
                              {s.onRequest && <span className="text-xs italic"> (on request)</span>}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {teacher && (
                      <div className="max-w-xs">
                        <label htmlFor="start-date" className="block text-sm font-bold text-gray-900 mb-2">
                          When would you like to start?
                        </label>
                        <input id="start-date" type="date" value={startDate}
                          onChange={e => setStartDate(e.target.value)} className={field} />
                      </div>
                    )}
                  </div>
                ) : mode === 'video' ? (
                  <div className="flex-grow flex flex-col items-center justify-center text-center p-8 bg-gray-50 rounded-xl border border-gray-100">
                    <PlayCircle className="w-12 h-12 text-brand-300 mb-4" />
                    <h5 className="text-lg font-bold text-gray-900 mb-2">{videoCourse}</h5>
                    {videoObj?.summary && <p className="text-gray-600 max-w-md">{videoObj.summary}</p>}
                    <p className="text-sm text-gray-600 max-w-md mt-3">
                      {videoObj?.access_note
                        || 'Once your payment is confirmed we send you the lessons and you can start straight away.'}
                    </p>
                  </div>
                ) : (
                  <div className="flex-grow flex flex-col items-center justify-center text-center p-8 bg-gray-50 rounded-xl border border-gray-100">
                    <Users className="w-12 h-12 text-brand-300 mb-4" />
                    <h5 className="text-lg font-bold text-gray-900 mb-2">{groupCourse}</h5>
                    {groupObj?.schedule && <p className="text-gray-900 font-medium">{groupObj.schedule}</p>}
                    {groupObj?.start_date && (
                      <p className="text-gray-600 mt-1">
                        Starts {new Date(groupObj.start_date).toLocaleDateString('en-GB', {
                          day: 'numeric', month: 'long', year: 'numeric',
                        })}
                      </p>
                    )}
                    {!groupObj?.schedule && (
                      <p className="text-gray-600 max-w-md">
                        Group courses run on a fixed timetable. Send your details and we will reply with the
                        next batch times before you pay.
                      </p>
                    )}
                  </div>
                )}

                <div className="mt-8 flex justify-end pt-4 border-t border-gray-100">
                  <button type="button" onClick={() => setStep(3)} disabled={!step2Done}
                    className="px-8 py-3 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2">
                    Continue <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="h-full flex flex-col">
                <div className="flex items-center gap-4 mb-6">
                  <button type="button" onClick={() => setStep(2)} className="text-sm font-medium text-gray-500 hover:text-gray-900">Back</button>
                  <h4 className="text-2xl font-bold text-gray-900">Your details</h4>
                </div>

                <form className="flex-grow flex flex-col space-y-5" onSubmit={handleSubmit}>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="first-name" className="block text-sm font-medium text-gray-700 mb-1">First name</label>
                      <input id="first-name" type="text" required value={firstName}
                        onChange={e => setFirstName(e.target.value)} className={field} />
                    </div>
                    <div>
                      <label htmlFor="last-name" className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
                      <input id="last-name" type="text" required value={lastName}
                        onChange={e => setLastName(e.target.value)} className={field} />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone number</label>
                      <input id="phone" type="tel" required placeholder="09…" value={phone}
                        onChange={e => setPhone(e.target.value)} className={field} />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Gmail address</label>
                      <input id="email" type="email" required value={email}
                        onChange={e => setEmail(e.target.value)} className={field} />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="telegram" className="block text-sm font-medium text-gray-700 mb-1">
                        Telegram username
                      </label>
                      <input id="telegram" type="text" placeholder="@yourname" value={telegram}
                        onChange={e => setTelegram(e.target.value)} className={field} />
                      <p className="text-xs text-gray-500 mt-1">This is where we confirm your class.</p>
                    </div>
                    <div>
                      <label htmlFor="facebook" className="block text-sm font-medium text-gray-700 mb-1">
                        Facebook profile <span className="text-gray-400">(optional)</span>
                      </label>
                      <input id="facebook" type="text" value={facebook}
                        onChange={e => setFacebook(e.target.value)} className={field} />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                      Anything else we should know <span className="text-gray-400">(optional)</span>
                    </label>
                    <textarea id="notes" rows={3} placeholder="Your goals, your current level, questions…"
                      value={notes} onChange={e => setNotes(e.target.value)} className={`${field} resize-none`} />
                  </div>

                  {isLive && (
                    <div className="p-4 rounded-xl border border-gold-300 bg-gold-100/40">
                      <label htmlFor="voucher" className="block text-sm font-bold text-gray-900 mb-1">
                        Returning student? Enter your voucher code
                      </label>
                      <p className="text-xs text-gray-600 mb-3">
                        Leave this empty if you do not have one.
                      </p>
                      <div className="flex gap-2">
                        <input id="voucher" value={voucher} placeholder="EE1A2B3C"
                          onChange={e => { setVoucher(e.target.value.toUpperCase()); setVoucherPct(0); setVoucherMsg(''); }}
                          className={`${field} font-mono uppercase`} />
                        <button type="button" onClick={applyVoucher} disabled={checking || !voucher.trim()}
                          className="px-5 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-semibold disabled:opacity-50 whitespace-nowrap">
                          {checking ? 'Checking…' : 'Apply'}
                        </button>
                      </div>
                      {voucherMsg && (
                        <p className={`text-sm mt-2 font-medium ${voucherPct ? 'text-green-700' : 'text-red-600'}`}>
                          {voucherMsg}
                        </p>
                      )}
                      {voucherPct > 0 && (
                        <p className="text-sm text-gray-800 mt-2">
                          {money(fullFee)} → <strong>{money(fee)}</strong>
                        </p>
                      )}
                    </div>
                  )}

                  <div className="pt-4 mt-auto">
                    <button type="submit" disabled={sending}
                      className="w-full px-6 py-4 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 disabled:opacity-60 transition-colors shadow-lg shadow-brand-200 text-lg">
                      {sending ? 'Making your receipt…' : 'Get my receipt'}
                    </button>
                    <p className="text-xs text-center text-gray-500 mt-3">
                      Nothing to pay yet. Your receipt shows the amount and how to transfer it.
                    </p>
                  </div>
                </form>
              </motion.div>
            )}

            {/* STEP 4 — pay (only when the database is connected) */}
            {step === 4 && issued && isLive && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="h-full flex flex-col">
                <div className="flex items-center gap-4 mb-2">
                  <button type="button" onClick={() => setStep(3)} className="text-sm font-medium text-gray-500 hover:text-gray-900">Back</button>
                  <h4 className="text-2xl font-bold text-gray-900">Payment</h4>
                </div>
                <p className="text-sm text-gray-600 mb-6">
                  Your reference is{' '}
                  <span className="font-mono font-semibold text-gray-900">{issued.reference}</span>.
                  {' Transfer the fee, then send us the screenshot so we can confirm your place.'}
                </p>

                <PaymentPanel
                  fee={issued.fee}
                  reference={issued.reference}
                  busy={sending}
                  onSend={d => saveBooking(d)}
                />

                {saveError && (
                  <p className="mt-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                    {saveError}
                  </p>
                )}
              </motion.div>
            )}

            {/* FINAL STEP — the document */}
            {step === lastStep && issued && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="h-full flex flex-col">
                <div className="no-print">
                  <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-5">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h4 className="text-2xl font-bold text-gray-900 mb-2">
                    {issued.status === 'checking'
                      ? `Got it, ${issued.firstName}.`
                      : `You are booked, ${issued.firstName}.`}
                  </h4>
                  <p className="text-gray-600 mb-4">
                    Your reference is <span className="font-mono font-semibold text-gray-900">{issued.reference}</span>.{' '}
                    {!isLive && 'Print it or save it, then finish on the registration form so we have your payment screenshot.'}
                    {isLive && issued.status === 'checking' &&
                      'We will check your transfer and confirm your place on Telegram. Your receipt appears on the link below as soon as we do.'}
                    {isLive && issued.status === 'awaiting_payment' &&
                      'When you are ready to pay, come back through the link below and upload your screenshot.'}
                  </p>

                  {isLive && issued.token && (
                    <div className="mb-6 p-4 rounded-xl bg-gray-50 border border-gray-200">
                      <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-1">
                        <Link2 className="w-4 h-4" /> Your private link — keep it
                      </div>
                      <p className="text-xs text-gray-600 mb-3">
                        Save this. It shows your booking, and turns into your receipt once we confirm payment.
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <code className="text-xs bg-white border border-gray-200 rounded px-2 py-1.5 break-all flex-1 min-w-0">
                          {receiptLink(issued.token)}
                        </code>
                        <button type="button" onClick={copyLink}
                          className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
                          style={{ backgroundColor: site.brandColour }}>
                          {copiedLink ? 'Copied' : 'Copy link'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <Receipt enrolment={issued} />

                <div className="no-print">
                  <div className="flex flex-wrap gap-3 mt-6">
                    {!isLive && (
                      <a href={registrationLink(issued)} target="_blank" rel="noopener noreferrer"
                        className="px-5 py-3 bg-brand-600 text-white rounded-xl font-semibold hover:bg-brand-700 transition-colors flex items-center gap-2">
                        Finish on the registration form <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    <button type="button" onClick={() => window.print()}
                      className="px-5 py-3 bg-white border border-gray-300 text-gray-800 rounded-xl font-semibold hover:border-brand-400 transition-colors flex items-center gap-2">
                      <Printer className="w-4 h-4" /> Print or save as PDF
                    </button>
                    <a href={mailtoLink(issued)}
                      className="px-5 py-3 bg-white border border-gray-300 text-gray-800 rounded-xl font-semibold hover:border-brand-400 transition-colors">
                      Email it to us
                    </a>
                    {messagingLinks(issued).map(link => (
                      <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer"
                        className="px-5 py-3 bg-white border border-gray-300 text-gray-800 rounded-xl font-semibold hover:border-brand-400 transition-colors">
                        {link.label}
                      </a>
                    ))}
                    <button type="button" onClick={copyReceipt}
                      className="px-5 py-3 bg-white border border-gray-300 text-gray-800 rounded-xl font-semibold hover:border-brand-400 transition-colors flex items-center gap-2">
                      {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                      {copied ? 'Copied' : 'Copy details'}
                    </button>
                  </div>

                  <button type="button" onClick={startOver}
                    className="mt-8 text-sm font-medium text-gray-500 hover:text-gray-900 self-start">
                    Book another course
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
