import React, { useState } from 'react';
import { ArrowLeft, Camera, CheckCircle2, ClipboardList, ExternalLink, RefreshCw, Upload, UserPlus } from 'lucide-react';
import { forms, payment, site, teachableCourses } from '../data';
import {
  isLive, isTelegramLink, sendTeacherForm, uploadApplicationPhoto, uploadTeacherCv,
} from '../supabase';
import { notify } from '../notify';

/* Teachers fill this in themselves.

   They choose what they are here to do, read what they will be asked for,
   then fill the form. It lands in your admin page as "Waiting for you" —
   never on the website. You decide what gets published, and what they
   ask to be paid stays private. */

type Mode = 'new' | 'update';
type Stage = 'choose' | 'form' | 'sent';

const guidance: Record<Mode, { title: string; lead: string; steps: string[] }> = {
  new: {
    title: 'Joining as a new teacher',
    lead: 'Takes about five minutes. Have these ready before you start.',
    steps: [
      'Your name as you want students to see it',
      'A phone number and, if you have one, your Telegram username',
      'The courses and levels you can teach — General English, IELTS, and which levels',
      'The hours you are free each week, written one day per line',
      'What you would like to be paid per session',
      'The wallet you want to be paid into — KBZPay, AYA Pay or CB Pay — and the name on it',
      'A photograph of yourself, if you are happy for students to see it',
      'How long you have been teaching, and what you have taught',
      'Your CV, if you have one — a PDF or Word file',
      'Photographs or scans of your certificates — TKT, CELTA, a degree',
      'Your teaching qualifications, if you have any — TKT, CELTA, a degree',
      'A short demo lesson, uploaded to Telegram, so students can hear you teach',
      'Whether you would also like to record video classes students watch in their own time',
    ],
  },
  update: {
    title: 'Changing your hours',
    lead: 'Send us your new hours and we will move your students. Have these ready.',
    steps: [
      'Your name, exactly as it appears on our website',
      'Your phone or Telegram so we can confirm',
      'Your complete new hours — send all of them, not only what changed',
      'Anything else that has changed, such as the levels you teach',
    ],
  },
};

export default function TeacherPortal() {
  const [stage, setStage] = useState<Stage>('choose');
  const [mode, setMode] = useState<Mode>('new');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [telegram, setTelegram] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  const [otherCourses, setOtherCourses] = useState('');
  const courses = [...picked, otherCourses.trim()].filter(Boolean).join(', ');

  const togglePicked = (name: string) =>
    setPicked(prev => prev.includes(name)
      ? prev.filter(x => x !== name)
      : [...prev, name]);
  const [blurb, setBlurb] = useState('');
  const [availability, setAvailability] = useState('');
  const [feeRequest, setFeeRequest] = useState('');
  const [payoutMethod, setPayoutMethod] = useState('');
  const [payoutNumber, setPayoutNumber] = useState('');
  const [payoutName, setPayoutName] = useState('');
  const [quals, setQuals] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [teachesVideo, setTeachesVideo] = useState(false);
  const [experience, setExperience] = useState('');
  const [cv, setCv] = useState<File | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [certs, setCerts] = useState<File[]>([]);
  const [photoOk, setPhotoOk] = useState(false);
  const [preview, setPreview] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const field =
    'w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-600 focus:border-transparent outline-none';

  const start = (m: Mode) => { setMode(m); setStage('form'); setError(''); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courses.trim()) {
      setError('Please tick what you can teach, or write it in the box.');
      return;
    }
    if (demoUrl.trim() && !isTelegramLink(demoUrl)) {
      setError('The demo lesson must be a Telegram link, starting https://t.me/');
      return;
    }
    if (photo && !photoOk) {
      setError('Please tick the box to say we may show your photo, or remove it.');
      return;
    }

    setSending(true);
    setError('');

    let cvPath = '';
    if (cv) {
      const up = await uploadTeacherCv(cv);
      if (!up.ok) { setSending(false); setError(`Your CV would not upload: ${up.message}`); return; }
      cvPath = up.path;
    }

    const certPaths: string[] = [];
    for (const c of certs) {
      const up = await uploadTeacherCv(c);
      if (!up.ok) {
        setSending(false);
        setError(`A certificate would not upload: ${up.message}`);
        return;
      }
      certPaths.push(up.path);
    }

    let photoPath = '';
    if (photo) {
      const up = await uploadApplicationPhoto(photo);
      if (!up.ok) {
        setSending(false);
        setError(`Your photo would not upload: ${up.message}`);
        return;
      }
      photoPath = up.path;
    }

    const res = await sendTeacherForm({
      kind: mode, name: name.trim(), phone: phone.trim(), email: email.trim(),
      telegram: telegram.trim(), courses: courses.trim(), blurb: blurb.trim(),
      availability_text: availability.trim(), fee_request: feeRequest.trim(),
      payout_method: payoutMethod.trim(),
      payout_number: payoutNumber.trim(),
      payout_name: payoutName.trim(),
      qualifications: quals.trim(),
      demo_url: demoUrl.trim(),
      teaches_video: teachesVideo,
      certificates: certPaths,
      photo: photoPath,
      photo_consent: photoOk,
    });
    setSending(false);
    if (!res.ok) { setError(res.message); return; }

    setStage('sent');
    notify(
      mode === 'new'
        ? `New teacher application — ${name.trim()}`
        : `${name.trim()} has changed their hours`,
      {
        teacher: name.trim(),
        phone: phone.trim(),
        telegram: telegram.trim(),
        email: email.trim(),
        teaches: courses.trim(),
        hours: availability.trim(),
        asking_to_be_paid: feeRequest.trim(),
        pay_into: [payoutMethod, payoutNumber, payoutName].filter(Boolean).join(' · '),
        qualifications: quals.trim(),
        experience: experience.trim(),
        cv_attached: cv ? 'Yes — open the admin page to read it' : 'No',
        demo_lesson: demoUrl.trim(),
        wants_video_classes: teachesVideo ? 'Yes' : 'No',
        sent_a_photo: photo ? 'Yes' : 'No',
        action: 'Open your admin page, Teachers tab, to approve or reply.',
      },
    );
  };

  return (
    <section id="teach" className="py-20 bg-gray-50 border-t-4 border-gold-500 scroll-mt-24 no-print">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-10 items-start">

          {/* left column */}
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-gold-100 text-brand-700 text-xs font-bold tracking-wide uppercase mb-4">
              For teachers
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight mb-4">
              Teaching with {site.shortName}
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Tell us what you teach and the hours you are free, and we will match you with
              students. Already teaching with us? Send your new hours the same way whenever
              they change.
            </p>
            <p className="text-sm text-gray-500 leading-relaxed">
              We read everything that comes in and confirm it with you before your name appears
              on the site. What we agree to pay you is private and never published.
            </p>
          </div>

          {/* right column */}
          <div>
            {/* no database yet — fall back to the Jotform */}
            {!isLive && (
              <div className="space-y-3">
                <a href={forms.teacherRegistration} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-gray-200 hover:border-brand-400 transition-colors">
                  <span>
                    <span className="block font-semibold text-gray-900">New teacher</span>
                    <span className="block text-sm text-gray-600 mt-0.5">Register your courses and hours.</span>
                  </span>
                  <ExternalLink className="w-4 h-4 text-gray-400 shrink-0" />
                </a>
                <a href={forms.teacherUpdate || forms.teacherRegistration} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-gray-200 hover:border-brand-400 transition-colors">
                  <span>
                    <span className="block font-semibold text-gray-900">Update my hours</span>
                    <span className="block text-sm text-gray-600 mt-0.5">Change your hours or your classes.</span>
                  </span>
                  <ExternalLink className="w-4 h-4 text-gray-400 shrink-0" />
                </a>
              </div>
            )}

            {/* 1. choose what you came to do */}
            {isLive && stage === 'choose' && (
              <div className="space-y-3">
                <button type="button" onClick={() => start('new')}
                  className="w-full text-left flex items-start gap-4 p-5 rounded-2xl bg-white border-2 border-gray-200 hover:border-brand-600 transition-colors">
                  <span className="w-11 h-11 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center shrink-0">
                    <UserPlus className="w-5 h-5" />
                  </span>
                  <span>
                    <span className="block font-bold text-gray-900">New teacher</span>
                    <span className="block text-sm text-gray-600 mt-1 leading-relaxed">
                      You have not taught with us before. Register your courses, your hours
                      and your rate.
                    </span>
                  </span>
                </button>

                <button type="button" onClick={() => start('update')}
                  className="w-full text-left flex items-start gap-4 p-5 rounded-2xl bg-white border-2 border-gray-200 hover:border-brand-600 transition-colors">
                  <span className="w-11 h-11 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center shrink-0">
                    <RefreshCw className="w-5 h-5" />
                  </span>
                  <span>
                    <span className="block font-bold text-gray-900">Update my hours</span>
                    <span className="block text-sm text-gray-600 mt-1 leading-relaxed">
                      You already teach with us and your free times have changed.
                    </span>
                  </span>
                </button>
              </div>
            )}

            {/* 2. what you will be asked for, then the form */}
            {isLive && stage === 'form' && (
              <div>
                <button type="button" onClick={() => setStage('choose')}
                  className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 mb-4">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>

                <div className="p-5 rounded-2xl bg-white border border-gray-200 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ClipboardList className="w-4 h-4 text-brand-600" />
                    <h3 className="font-bold text-gray-900">{guidance[mode].title}</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{guidance[mode].lead}</p>
                  <ul className="space-y-1.5">
                    {guidance[mode].steps.map(s => (
                      <li key={s} className="flex gap-2 text-sm text-gray-700">
                        <span className="text-gold-500 shrink-0">◆</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-gray-500 mt-4 pt-3 border-t border-gray-100">
                    After you send it we check the details and message you. Nothing appears on
                    the website until then.
                  </p>
                </div>

                <form onSubmit={submit} className="space-y-4 p-5 rounded-2xl bg-white border border-gray-200">
                  <div>
                    <label htmlFor="t-name" className="block text-sm font-medium text-gray-700 mb-1">
                      Your name
                    </label>
                    <input id="t-name" required value={name} onChange={e => setName(e.target.value)} className={field} />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="t-phone" className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input id="t-phone" required value={phone} onChange={e => setPhone(e.target.value)} className={field} />
                    </div>
                    <div>
                      <label htmlFor="t-telegram" className="block text-sm font-medium text-gray-700 mb-1">Telegram</label>
                      <input id="t-telegram" placeholder="@yourname" value={telegram}
                        onChange={e => setTelegram(e.target.value)} className={field} />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="t-hours" className="block text-sm font-medium text-gray-700 mb-1">
                      {mode === 'update' ? 'Your new hours — all of them' : 'Hours you are free'}
                    </label>
                    <textarea id="t-hours" rows={5} required value={availability}
                      onChange={e => setAvailability(e.target.value)}
                      placeholder={'Monday | 6:00–8:00 PM\nWednesday | 6:00–9:00 PM\nSaturday | 1:00–5:00 PM'}
                      className={`${field} resize-none font-mono text-xs`} />
                    <p className="text-xs text-gray-500 mt-1">
                      One line for each day: the day, then a straight line, then the times.
                    </p>
                  </div>

                  <div>
                    <span className="block text-sm font-medium text-gray-700 mb-2">
                      What can you teach? Tick everything that applies.
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {teachableCourses.map(c => {
                        const on = picked.includes(c);
                        return (
                          <button key={c} type="button" onClick={() => togglePicked(c)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                              on ? 'bg-brand-600 text-white border-brand-600'
                                 : 'bg-white text-gray-700 border-gray-200 hover:border-brand-400'
                            }`}>
                            {c}
                          </button>
                        );
                      })}
                    </div>
                    <input value={otherCourses} onChange={e => setOtherCourses(e.target.value)}
                      placeholder="Anything else you teach that is not listed"
                      className={`${field} mt-3`} />
                    {picked.length === 0 && !otherCourses.trim() && (
                      <p className="text-xs text-gray-500 mt-1">Tick at least one, or write it in.</p>
                    )}
                  </div>

                  {mode === 'new' && (
                    <>
                      <div>
                        <label htmlFor="t-email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input id="t-email" type="email" value={email}
                          onChange={e => setEmail(e.target.value)} className={field} />
                      </div>

                      <div>
                        <label htmlFor="t-blurb" className="block text-sm font-medium text-gray-700 mb-1">
                          A sentence about how you teach
                        </label>
                        <textarea id="t-blurb" rows={2} value={blurb} onChange={e => setBlurb(e.target.value)}
                          className={`${field} resize-none`} />
                        <p className="text-xs text-gray-500 mt-1">Students read this when choosing a teacher.</p>
                      </div>

                      <div>
                        <label htmlFor="t-fee" className="block text-sm font-medium text-gray-700 mb-1">
                          What would you like to be paid per session?
                        </label>
                        <input id="t-fee" value={feeRequest} onChange={e => setFeeRequest(e.target.value)}
                          placeholder="e.g. 15000 MMK per hour" className={field} />
                        <p className="text-xs text-gray-500 mt-1">
                          Private between you and us. Never shown on the website.
                        </p>
                      </div>

                      <div className="pt-4 border-t border-gray-100">
                        <span className="block text-sm font-medium text-gray-700 mb-1">
                          Your photo <span className="text-gray-400">(optional)</span>
                        </span>
                        <p className="text-xs text-gray-500 mb-3">
                          Students choosing a one-to-one teacher like to see who they will be
                          learning with. A clear head and shoulders photo works best.
                        </p>

                        <div className="flex items-center gap-4">
                          {preview
                            ? <img src={preview} alt="" className="w-20 h-20 rounded-xl object-cover border border-gray-200" />
                            : <div className="w-20 h-20 rounded-xl bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                                <Camera className="w-6 h-6" />
                              </div>}

                          <label className="px-4 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 cursor-pointer hover:border-brand-400 transition-colors">
                            {photo ? 'Choose a different photo' : 'Choose a photo'}
                            <input type="file" accept="image/*" className="hidden"
                              onChange={e => {
                                const f = e.target.files?.[0] ?? null;
                                setPhoto(f);
                                setPreview(f ? URL.createObjectURL(f) : '');
                                if (!f) setPhotoOk(false);
                              }} />
                          </label>
                        </div>

                        {photo && (
                          <label className="flex items-start gap-2 mt-3 text-xs text-gray-700 cursor-pointer">
                            <input type="checkbox" checked={photoOk} className="mt-0.5"
                              onChange={e => setPhotoOk(e.target.checked)} />
                            <span>
                              I am happy for {site.shortName} to show this photo on the website.
                              You can ask us to remove it at any time.
                            </span>
                          </label>
                        )}
                      </div>

                      <div>
                        <label htmlFor="t-exp" className="block text-sm font-medium text-gray-700 mb-1">
                          Your teaching experience
                        </label>
                        <textarea id="t-exp" rows={3} value={experience}
                          onChange={e => setExperience(e.target.value)}
                          placeholder="Four years teaching IELTS, two years General English at a language centre in Yangon"
                          className={`${field} resize-none`} />
                      </div>

                      <div>
                        <span className="block text-sm font-medium text-gray-700 mb-1">
                          Your CV <span className="text-gray-400">(optional)</span>
                        </span>
                        <label className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-dashed border-gray-300 cursor-pointer hover:border-gray-500 transition-colors bg-gray-50">
                          <Upload className="w-4 h-4 text-gray-400 shrink-0" />
                          <span className="text-sm text-gray-700 truncate">
                            {cv ? cv.name : 'Choose a PDF or Word file'}
                          </span>
                          <input type="file" className="hidden"
                            accept=".pdf,.doc,.docx,image/png,image/jpeg"
                            onChange={e => setCv(e.target.files?.[0] ?? null)} />
                        </label>
                        <p className="text-xs text-gray-500 mt-1">
                          Up to 10 MB. Only Effortless Education can open it.
                        </p>
                      </div>
                      <div>
                        <span className="block text-sm font-medium text-gray-700 mb-1">
                          Your certificates <span className="text-gray-400">(optional)</span>
                        </span>
                        <label className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-dashed border-gray-300 cursor-pointer hover:border-gray-500 bg-gray-50">
                          <span className="text-sm text-gray-700 truncate">
                            {certs.length
                              ? `${certs.length} file${certs.length === 1 ? '' : 's'} chosen`
                              : 'Choose your certificates'}
                          </span>
                          <input type="file" multiple className="hidden"
                            accept="application/pdf,.doc,.docx,image/png,image/jpeg"
                            onChange={e => setCerts(Array.from(e.target.files ?? []))} />
                        </label>
                        <p className="text-xs text-gray-500 mt-1">
                          TKT, CELTA, a degree — photographs are fine. Only {site.shortName} can open them.
                        </p>
                      </div>


                      <div>
                        <label htmlFor="t-quals" className="block text-sm font-medium text-gray-700 mb-1">
                          Your qualifications <span className="text-gray-400">(optional)</span>
                        </label>
                        <input id="t-quals" value={quals} onChange={e => setQuals(e.target.value)}
                          placeholder="TKT Band 3, CELTA, BA English" className={field} />
                        <p className="text-xs text-gray-500 mt-1">
                          Separate them with commas. Students see these once we have checked them.
                        </p>
                      </div>

                      <div>
                        <label htmlFor="t-demo" className="block text-sm font-medium text-gray-700 mb-1">
                          Demo lesson <span className="text-gray-400">(optional)</span>
                        </label>
                        <input id="t-demo" value={demoUrl} onChange={e => setDemoUrl(e.target.value)}
                          placeholder="https://t.me/yourchannel/12" className={field} />
                        <p className="text-xs text-gray-500 mt-1">
                          Upload a short video to Telegram, then paste the link to it here.
                          Telegram links only — anything else is refused.
                        </p>
                      </div>

                      <label className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 cursor-pointer hover:border-brand-400 transition-colors">
                        <input type="checkbox" checked={teachesVideo} className="mt-1"
                          onChange={e => setTeachesVideo(e.target.checked)} />
                        <span>
                          <span className="block text-sm font-semibold text-gray-900">
                            I would also like to record video classes
                          </span>
                          <span className="block text-xs text-gray-600 mt-0.5 leading-relaxed">
                            Lessons you record once, that students buy and watch in their own time.
                            Send your demo on Telegram above and we will talk it through with you.
                          </span>
                        </span>
                      </label>

                      <div className="pt-4 border-t border-gray-100">
                        <p className="text-sm font-semibold text-gray-900 mb-1">Where should we send your pay?</p>
                        <p className="text-xs text-gray-500 mb-3">
                          Only we can see this. You can change it later on your own teacher page.
                        </p>

                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="t-wallet" className="block text-sm font-medium text-gray-700 mb-1">Wallet</label>
                            <select id="t-wallet" value={payoutMethod}
                              onChange={e => setPayoutMethod(e.target.value)} className={field}>
                              <option value="">Choose…</option>
                              {payment.methods.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
                              <option value="Bank transfer">Bank transfer</option>
                            </select>
                          </div>
                          <div>
                            <label htmlFor="t-wallet-no" className="block text-sm font-medium text-gray-700 mb-1">Number</label>
                            <input id="t-wallet-no" value={payoutNumber} placeholder="09…"
                              onChange={e => setPayoutNumber(e.target.value)} className={field} />
                          </div>
                          <div className="sm:col-span-2">
                            <label htmlFor="t-wallet-name" className="block text-sm font-medium text-gray-700 mb-1">
                              Name on the account
                            </label>
                            <input id="t-wallet-name" value={payoutName}
                              onChange={e => setPayoutName(e.target.value)} className={field} />
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {mode === 'update' && (
                    <div>
                      <label htmlFor="t-note" className="block text-sm font-medium text-gray-700 mb-1">
                        Anything else that has changed <span className="text-gray-400">(optional)</span>
                      </label>
                      <textarea id="t-note" rows={2} value={blurb} onChange={e => setBlurb(e.target.value)}
                        className={`${field} resize-none`} />
                    </div>
                  )}

                  {error && <p className="text-sm text-red-600">{error}</p>}

                  <button type="submit" disabled={sending}
                    className="w-full py-3 bg-brand-600 text-white rounded-xl font-semibold hover:bg-brand-700 disabled:opacity-60 transition-colors">
                    {sending ? 'Sending…' : mode === 'new' ? 'Send my application' : 'Send my new hours'}
                  </button>
                </form>
              </div>
            )}

            {/* 3. done */}
            {isLive && stage === 'sent' && (
              <div className="p-8 rounded-2xl bg-white border border-gray-200 text-center">
                <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-4" />
                <h3 className="font-bold text-gray-900 mb-2">
                  Thank you, {name.split(' ')[0]}.
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  {mode === 'new'
                    ? 'We have your details and will be in touch on Telegram or by phone.'
                    : 'We have your new hours and will confirm before we change anything for your students.'}
                </p>
                <button type="button"
                  onClick={() => { setStage('choose'); setName(''); setPhone(''); setEmail('');
                    setTelegram(''); setPicked([]); setOtherCourses(''); setBlurb(''); setAvailability(''); setFeeRequest(''); }}
                  className="text-sm font-semibold text-brand-700 hover:text-brand-800">
                  Send something else
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
