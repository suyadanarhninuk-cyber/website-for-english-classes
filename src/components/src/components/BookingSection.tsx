import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  CheckCircle2, ChevronRight, Clock, Copy, Check, Printer, User, Users, ExternalLink,
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
  messagingLinks,
  money,
  registrationLink,
  slotLabel,
} from '../contact';
import Receipt from './Receipt';

type BookingMode = 'one-to-one' | 'group' | null;

export default function BookingSection() {
  const { teachers, groupClasses, months } = useContent();

  const [step, setStep] = useState(1);
  const [mode, setMode] = useState<BookingMode>(null);

  const [levelId, setLevelId] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [groupCourse, setGroupCourse] = useState('');
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
  const fee = levelObj?.fee ?? groupObj?.fee ?? 0;

  const toggleSlot = (i: number) =>
    setSlotIdxs(prev =>
      prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i].sort((a, b) => a - b),
    );

  const step1Done = mode === 'group' ? !!groupCourse : !!levelId;
  const step2Done =
    mode === 'group' ? true : !!teacherName && chosenSlots.length > 0 && !!startDate;

  const selectionLabel = () => {
    if (!mode) return 'Choose one-to-one or group';
    if (mode === 'group') return groupCourse || 'Select a group course';
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
      bookingType: mode === 'group' ? 'Group course' : 'One-to-One',
      course: mode === 'group' ? groupCourse : levelObj?.name || '',
      hours: mode === 'group' ? null : levelObj?.hours ?? null,
      teacher: mode === 'group' ? '' : teacherName,
      slots: mode === 'group'
        ? (groupObj?.schedule ? [groupObj.schedule] : [])
        : chosenSlots,
      startDate: mode === 'group' ? (groupObj?.start_date ?? '') : startDate,
      fee,
    };

    setSending(true);
    await deliverEnrolment(enrolment);   // emails you a copy if Formspree is set up
    setSending(false);
    setIssued(enrolment);
    setStep(4);
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
    setStep(1);
    setMode(null);
    setLevelId(''); setTeacherName(''); setGroupCourse('');
    setSlotIdxs([]); setStartDate('');
    setFirstName(''); setLastName(''); setEmail(''); setPhone('');
    setTelegram(''); setFacebook(''); setNotes('');
  };

  const stepLabels = ['Course', 'Teacher & times', 'Your details', 'Receipt'];
  const field =
    'w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all';

  return (
    <section id="booking" className="py-24 bg-indigo-900 relative overflow-hidden print:bg-white print:py-0">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 no-print">
        <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-indigo-800/50 blur-3xl"></div>
        <div className="absolute -bottom-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-800/50 blur-3xl"></div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 no-print">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">Book your classes</h2>
          <p className="text-lg text-indigo-200">
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
                      done ? 'bg-green-500 text-white' : current ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-400'
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
                        {n === 4 && (issued ? issued.reference : 'Print it or send it to us')}
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

                <div className="grid sm:grid-cols-2 gap-4 mb-8">
                  <button type="button" onClick={() => chooseMode('one-to-one')}
                    className={`text-left p-5 rounded-2xl border-2 transition-colors ${
                      mode === 'one-to-one' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'
                    }`}>
                    <User className="w-6 h-6 text-indigo-600 mb-3" />
                    <div className="font-bold text-gray-900">One-to-one</div>
                    <div className="text-sm text-gray-600 mt-1">You choose the teacher and the hours.</div>
                  </button>

                  <button type="button" onClick={() => chooseMode('group')}
                    className={`text-left p-5 rounded-2xl border-2 transition-colors ${
                      mode === 'group' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'
                    }`}>
                    <Users className="w-6 h-6 text-indigo-600 mb-3" />
                    <div className="font-bold text-gray-900">Group course</div>
                    <div className="text-sm text-gray-600 mt-1">Fixed timetable, learn with others.</div>
                  </button>
                </div>

                {mode === 'one-to-one' && (
                  <div className="space-y-2 flex-grow">
                    {oneToOneLevels.map(l => (
                      <button key={l.id} type="button" onClick={() => chooseLevel(l.id)}
                        className={`w-full flex items-center justify-between gap-4 p-4 rounded-xl border transition-colors text-left ${
                          levelId === l.id ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'
                        }`}>
                        <span>
                          <span className="block font-semibold text-gray-900">{l.name}</span>
                          {l.hours && (
                            <span className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                              <Clock className="w-3 h-3" /> {l.hours} hours
                            </span>
                          )}
                        </span>
                        <span className="font-bold text-indigo-600 whitespace-nowrap">{money(l.fee)}</span>
                      </button>
                    ))}
                  </div>
                )}

                {mode === 'group' && (
                  <div className="space-y-2 flex-grow">
                    {groupMonth && (
                      <p className="text-sm font-semibold text-indigo-700 mb-2">
                        {monthLabel(groupMonth)} timetable
                      </p>
                    )}
                    {bookableGroup.map(g => (
                      <button key={g.id} type="button" onClick={() => setGroupCourse(g.name)}
                        className={`w-full flex items-center justify-between gap-4 p-4 rounded-xl border transition-colors text-left ${
                          groupCourse === g.name ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'
                        }`}>
                        <span>
                          <span className="block font-semibold text-gray-900">{g.name}</span>
                          {(g.schedule || g.seats) && (
                            <span className="block text-xs text-gray-500 mt-1">
                              {g.schedule}{g.schedule && g.seats ? ' · ' : ''}{g.seats}
                            </span>
                          )}
                        </span>
                        <span className="font-bold text-indigo-600 whitespace-nowrap">{money(g.fee)}</span>
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

                <div className="mt-8 flex justify-end pt-4 border-t border-gray-100">
                  <button type="button" onClick={() => setStep(2)} disabled={!step1Done}
                    className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2">
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
                    {mode === 'group' ? 'Your group timetable' : 'Choose your teacher and times'}
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
                            className={`text-left p-4 rounded-xl border transition-colors ${
                              teacherName === t.name ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'
                            }`}>
                            <div className="font-semibold text-gray-900">{t.name}</div>
                            <div className="text-xs text-gray-600 mt-1 leading-relaxed">{t.blurb}</div>
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
                                  ? 'border-indigo-600 bg-indigo-600 text-white'
                                  : 'border-gray-200 text-gray-700 hover:border-indigo-300'
                              }`}>
                              <span className="font-semibold">{s.day}</span>{' '}
                              <span className={slotIdxs.includes(i) ? 'text-indigo-100' : 'text-gray-500'}>{s.times}</span>
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
                ) : (
                  <div className="flex-grow flex flex-col items-center justify-center text-center p-8 bg-gray-50 rounded-xl border border-gray-100">
                    <Users className="w-12 h-12 text-indigo-300 mb-4" />
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
                    className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2">
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

                  <div className="pt-4 mt-auto">
                    <button type="submit" disabled={sending}
                      className="w-full px-6 py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-60 transition-colors shadow-lg shadow-indigo-200 text-lg">
                      {sending ? 'Making your receipt…' : 'Get my receipt'}
                    </button>
                    <p className="text-xs text-center text-gray-500 mt-3">
                      Nothing to pay yet. Your receipt shows the amount and how to transfer it.
                    </p>
                  </div>
                </form>
              </motion.div>
            )}

            {/* STEP 4 — the receipt */}
            {step === 4 && issued && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="h-full flex flex-col">
                <div className="no-print">
                  <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-5">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h4 className="text-2xl font-bold text-gray-900 mb-2">
                    Your receipt is ready, {issued.firstName}.
                  </h4>
                  <p className="text-gray-600 mb-6">
                    Your reference is <span className="font-mono font-semibold text-gray-900">{issued.reference}</span>.
                    Print it or save it, then finish on the registration form so we have your payment screenshot.
                  </p>
                </div>

                <Receipt enrolment={issued} />

                <div className="no-print">
                  <div className="flex flex-wrap gap-3 mt-6">
                    <a href={registrationLink(issued)} target="_blank" rel="noopener noreferrer"
                      className="px-5 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-2">
                      Finish on the registration form <ExternalLink className="w-4 h-4" />
                    </a>
                    <button type="button" onClick={() => window.print()}
                      className="px-5 py-3 bg-white border border-gray-300 text-gray-800 rounded-xl font-semibold hover:border-indigo-400 transition-colors flex items-center gap-2">
                      <Printer className="w-4 h-4" /> Print or save as PDF
                    </button>
                    <a href={mailtoLink(issued)}
                      className="px-5 py-3 bg-white border border-gray-300 text-gray-800 rounded-xl font-semibold hover:border-indigo-400 transition-colors">
                      Email it to us
                    </a>
                    {messagingLinks(issued).map(link => (
                      <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer"
                        className="px-5 py-3 bg-white border border-gray-300 text-gray-800 rounded-xl font-semibold hover:border-indigo-400 transition-colors">
                        {link.label}
                      </a>
                    ))}
                    <button type="button" onClick={copyReceipt}
                      className="px-5 py-3 bg-white border border-gray-300 text-gray-800 rounded-xl font-semibold hover:border-indigo-400 transition-colors flex items-center gap-2">
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
