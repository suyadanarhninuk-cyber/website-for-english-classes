import React, { useCallback, useEffect, useState } from 'react';
import { Camera, CheckCircle2, Clock, Loader2, PlayCircle, Wallet } from 'lucide-react';
import { payment, site } from '../data';
import { money } from '../contact';
import {
  TeacherHome, isTelegramLink, payoutProofUrl, teacherHome, teacherPhotoUrl,
  teacherRequestPayment, teacherSetPhoto, teacherSetVideo, teacherSubmitHours,
  teacherUpdatePayout, uploadTeacherPhoto,
} from '../supabase';

/* Lives at  effortlesseducation.uk/#teacher/<their token>

   Each teacher gets their own link once you approve them. On it they can
   see the hours students are being shown, send you new ones, keep their
   payment details right, and ask to be paid. Nobody sees anybody else's. */

const field =
  'w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-600 focus:border-transparent outline-none';
const card = 'bg-white rounded-2xl border border-gray-200 p-6';

const toText = (a: TeacherHome['availability']) =>
  (a ?? []).map(x => `${x.day} | ${x.times}${x.onRequest ? ' | on request' : ''}`).join('\n');

const statusChip: Record<string, string> = {
  requested: 'bg-amber-100 text-amber-900',
  paid: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

const statusWord: Record<string, string> = {
  requested: 'Waiting',
  paid: 'Paid',
  rejected: 'Not approved',
};

export default function TeacherPage({ token }: { token: string }) {
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<TeacherHome | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setMe(await teacherHome(token));
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const flash = (m: string) => { setNote(m); setTimeout(() => setNote(''), 4000); };

  /* hours */
  const [hours, setHours] = useState('');
  const [hoursNote, setHoursNote] = useState('');
  useEffect(() => { if (me) setHours(toText(me.availability)); }, [me]);

  const sendHours = async () => {
    setBusy(true);
    const res = await teacherSubmitHours(token, hours, hoursNote);
    setBusy(false);
    flash(res.ok
      ? 'Sent. Your new hours go live once Effortless Education approves them.'
      : res.message);
    if (res.ok) setHoursNote('');
  };

  /* photo */
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  useEffect(() => { if (me) setConsent(Boolean(me.photo_consent)); }, [me]);

  const sendPhoto = async () => {
    if (!photoFile) { flash('Choose a photo first.'); return; }
    if (!consent) { flash('Please tick the box to say we may show your photo.'); return; }
    setBusy(true);
    const up = await uploadTeacherPhoto(token, photoFile);
    if (!up.ok) { setBusy(false); flash(up.message); return; }
    const res = await teacherSetPhoto(token, up.path, consent);
    setBusy(false);
    if (!res.ok) { flash(res.message); return; }
    setPhotoFile(null);
    flash('Sent. Your photo appears once Effortless Education approves it.');
    load();
  };

  /* recorded video classes */
  const [wantsVideo, setWantsVideo] = useState(false);
  const [videoDemo, setVideoDemo] = useState('');
  useEffect(() => {
    if (!me) return;
    setWantsVideo(Boolean(me.teaches_video));
    setVideoDemo(me.demo_url ?? '');
  }, [me]);

  const sendVideoOffer = async () => {
    if (videoDemo.trim() && !isTelegramLink(videoDemo)) {
      flash('The demo must be a Telegram link, starting https://t.me/');
      return;
    }
    setBusy(true);
    const res = await teacherSetVideo(token, wantsVideo, videoDemo.trim());
    setBusy(false);
    flash(res.ok
      ? 'Sent. We will look at your demo and message you.'
      : res.message);
  };

  /* payout details */
  const [method, setMethod] = useState('');
  const [number, setNumber] = useState('');
  const [payName, setPayName] = useState('');
  const [telegram, setTelegram] = useState('');
  useEffect(() => {
    if (!me) return;
    setMethod(me.payout_method || payment.methods[0]?.name || '');
    setNumber(me.payout_number);
    setPayName(me.payout_name);
    setTelegram(me.telegram);
  }, [me]);

  const savePayout = async () => {
    setBusy(true);
    const res = await teacherUpdatePayout(token, method, number, payName, telegram);
    setBusy(false);
    flash(res.ok ? 'Your payment details are saved.' : res.message);
    if (res.ok) load();
  };

  /* asking to be paid */
  const [period, setPeriod] = useState('');
  const [detail, setDetail] = useState('');
  const [amount, setAmount] = useState('');

  const askForPay = async () => {
    if (!period.trim() || !amount.trim()) { flash('Add the month and the amount.'); return; }
    setBusy(true);
    const res = await teacherRequestPayment(token, period.trim(), detail.trim(), Number(amount) || 0);
    setBusy(false);
    if (!res.ok) { flash(res.message); return; }
    setPeriod(''); setDetail(''); setAmount('');
    flash('Sent. You will see it marked Paid here once the transfer is made.');
    load();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!me) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <h1 className="text-lg font-bold text-gray-900 mb-2">We cannot find that page</h1>
          <p className="text-sm text-gray-600">
            Copy the whole link from the message we sent you, or contact {site.shortName}.
          </p>
        </div>
      </div>
    );
  }

  const waiting = me.requests.filter(r => r.status === 'requested');

  return (
    <div className="min-h-screen bg-gray-100 pb-16">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 h-20 flex items-center gap-3">
          <img src={site.logoMark} alt="" className="w-11 h-11 rounded-xl object-cover" />
          <div>
            <div className="font-bold text-gray-900">{me.name}</div>
            <div className="text-xs text-gray-500">
              Teacher page · {site.shortName}
              {me.status === 'pending' && ' · not yet published'}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        {note && (
          <div className="px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-sm text-green-900">
            {note}
          </div>
        )}

        {me.status === 'pending' && (
          <div className="px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-900">
            Your profile is not on the website yet. We will message you once it is live.
          </div>
        )}

        {/* photo */}
        <section className={card}>
          <div className="flex items-center gap-2 mb-1">
            <Camera className="w-5 h-5 text-brand-600" />
            <h2 className="text-lg font-bold text-gray-900">Your photo</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Optional. Students choosing a one-to-one teacher like to see who they will be
            learning with. Without one, your initials are shown instead.
          </p>

          <div className="flex items-center gap-5">
            {me.photo ? (
              <img src={teacherPhotoUrl(me.photo)} alt=""
                className="w-20 h-20 rounded-full object-cover border border-gray-200" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-xl">
                {me.name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase()}
              </div>
            )}

            <div className="flex-1">
              <label className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-dashed border-gray-300 cursor-pointer hover:border-gray-500 bg-gray-50 text-sm">
                <span className="truncate">{photoFile ? photoFile.name : 'Choose a photo'}</span>
                <input type="file" accept="image/*" className="hidden"
                  onChange={e => setPhotoFile(e.target.files?.[0] ?? null)} />
              </label>
              {me.photo_pending && (
                <p className="text-xs text-amber-700 mt-2">
                  A new photo is waiting to be approved.
                </p>
              )}
            </div>
          </div>

          <label className="flex items-start gap-2 mt-4 text-sm text-gray-700">
            <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)}
              className="mt-1" />
            <span>
              I am happy for {site.shortName} to show this photo publicly on the website.
              I can ask for it to be removed at any time.
            </span>
          </label>

          <button onClick={sendPhoto} disabled={busy}
            className="mt-4 px-5 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:opacity-60">
            Send my photo
          </button>
        </section>

        {/* hours */}
        <section className={card}>
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-5 h-5 text-brand-600" />
            <h2 className="text-lg font-bold text-gray-900">Your hours</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            This is what students see when they book you. Send changes here and we will
            update it after checking with you.
          </p>

          <textarea rows={7} value={hours} onChange={e => setHours(e.target.value)}
            className={`${field} resize-none font-mono text-xs`}
            placeholder={'Monday | 6:00–8:00 PM\nSaturday | 1:00–5:00 PM'} />
          <p className="text-xs text-gray-500 mt-1 mb-4">
            One line per day: the day, a straight line, then the times. Put a comma between
            two blocks in the same day.
          </p>

          <input value={hoursNote} onChange={e => setHoursNote(e.target.value)}
            placeholder="Anything we should know (optional)" className={field} />

          <button onClick={sendHours} disabled={busy}
            className="mt-4 px-5 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:opacity-60">
            Send my new hours
          </button>
        </section>

        {/* recorded video classes */}
        <section className={card}>
          <div className="flex items-center gap-2 mb-1">
            <PlayCircle className="w-5 h-5 text-brand-600" />
            <h2 className="text-lg font-bold text-gray-900">Video classes</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Lessons you record once, that students buy and watch whenever they like. Tell us
            if you would like to make them and send a short demo on Telegram.
          </p>

          <label className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 cursor-pointer hover:border-brand-400 transition-colors mb-4">
            <input type="checkbox" checked={wantsVideo} className="mt-1"
              onChange={e => setWantsVideo(e.target.checked)} />
            <span className="text-sm text-gray-900 font-medium">
              I would like to teach recorded video classes
            </span>
          </label>

          <label htmlFor="v-demo" className="block text-sm font-medium text-gray-700 mb-1">
            Your demo on Telegram
          </label>
          <input id="v-demo" value={videoDemo} onChange={e => setVideoDemo(e.target.value)}
            placeholder="https://t.me/yourchannel/12" className={field} />
          <p className="text-xs text-gray-500 mt-1">
            Upload the video to Telegram, then paste the link here. Telegram links only.
          </p>

          <button onClick={sendVideoOffer} disabled={busy}
            className="mt-4 px-5 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:opacity-60">
            Send to Effortless Education
          </button>

          {me.teaches_video && (
            <p className="text-xs text-green-700 mt-3">
              You are currently listed as recording video classes.
            </p>
          )}
        </section>

        {/* payment details */}
        <section className={card}>
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="w-5 h-5 text-brand-600" />
            <h2 className="text-lg font-bold text-gray-900">How we pay you</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Only {site.shortName} can see this. It is never shown on the website.
          </p>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="p-method" className="block text-sm font-medium text-gray-700 mb-1">Wallet</label>
              <select id="p-method" value={method} onChange={e => setMethod(e.target.value)} className={field}>
                {payment.methods.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
                <option value="Bank transfer">Bank transfer</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label htmlFor="p-number" className="block text-sm font-medium text-gray-700 mb-1">Number</label>
              <input id="p-number" value={number} onChange={e => setNumber(e.target.value)}
                placeholder="09…" className={field} />
            </div>
            <div>
              <label htmlFor="p-name" className="block text-sm font-medium text-gray-700 mb-1">
                Name on the account
              </label>
              <input id="p-name" value={payName} onChange={e => setPayName(e.target.value)} className={field} />
            </div>
            <div>
              <label htmlFor="p-tg" className="block text-sm font-medium text-gray-700 mb-1">
                Your Telegram
              </label>
              <input id="p-tg" value={telegram} onChange={e => setTelegram(e.target.value)}
                placeholder="@yourname" className={field} />
            </div>
          </div>

          {me.agreed_rate && (
            <p className="text-sm text-gray-700 mt-4 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200">
              Agreed rate: <strong>{me.agreed_rate}</strong>
            </p>
          )}

          <button onClick={savePayout} disabled={busy}
            className="mt-4 px-5 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:opacity-60">
            Save payment details
          </button>
        </section>

        {/* ask to be paid */}
        <section className={card}>
          <h2 className="text-lg font-bold text-gray-900 mb-1">Ask to be paid</h2>
          <p className="text-sm text-gray-600 mb-4">
            When you have finished your classes, tell us the month, what you taught and how
            much is due. We transfer it and put the screenshot here.
          </p>

          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="r-period" className="block text-sm font-medium text-gray-700 mb-1">Month</label>
              <input id="r-period" value={period} onChange={e => setPeriod(e.target.value)}
                placeholder="September 2026" className={field} />
            </div>
            <div>
              <label htmlFor="r-amount" className="block text-sm font-medium text-gray-700 mb-1">
                Amount ({site.currency})
              </label>
              <input id="r-amount" inputMode="numeric" value={amount}
                onChange={e => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="150000" className={field} />
            </div>
          </div>

          <label htmlFor="r-detail" className="block text-sm font-medium text-gray-700 mb-1">
            Which classes
          </label>
          <textarea id="r-detail" rows={3} value={detail} onChange={e => setDetail(e.target.value)}
            placeholder="12 hours with Thuya (Intermediate), 8 hours with Su Su (Basic)"
            className={`${field} resize-none`} />

          <button onClick={askForPay} disabled={busy}
            className="mt-4 px-5 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:opacity-60">
            Send my request
          </button>
        </section>

        {/* history */}
        <section className={card}>
          <h2 className="text-lg font-bold text-gray-900 mb-1">Your payments</h2>
          <p className="text-sm text-gray-600 mb-4">
            {waiting.length > 0
              ? `${waiting.length} request${waiting.length > 1 ? 's' : ''} waiting.`
              : 'Everything you have asked for is dealt with.'}
          </p>

          {me.requests.length === 0 && (
            <p className="text-sm text-gray-500 py-6 text-center">Nothing yet.</p>
          )}

          <div className="space-y-3">
            {me.requests.map(r => (
              <div key={r.id} className="p-4 rounded-xl border border-gray-200">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="font-semibold text-gray-900">
                    {r.period}
                    <span className={`ml-2 px-2 py-0.5 rounded text-xs font-bold ${statusChip[r.status]}`}>
                      {statusWord[r.status]}
                    </span>
                  </div>
                  <div className="font-bold text-gray-900">{money(r.amount)}</div>
                </div>

                {r.detail && <p className="text-sm text-gray-600 mt-2">{r.detail}</p>}
                {r.admin_note && (
                  <p className="text-sm text-gray-700 mt-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200">
                    {r.admin_note}
                  </p>
                )}

                {r.status === 'paid' && (
                  <div className="mt-3">
                    <div className="flex items-center gap-2 text-sm text-green-700 font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      Paid{r.paid_at ? ` on ${new Date(r.paid_at).toLocaleDateString('en-GB')}` : ''}
                    </div>
                    {r.proof_file && (
                      <a href={payoutProofUrl(r.proof_file)} target="_blank" rel="noopener noreferrer"
                        className="inline-block mt-2 text-sm font-semibold text-brand-700 hover:text-brand-800">
                        See the transfer screenshot →
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
