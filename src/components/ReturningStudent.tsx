import React, { useState } from 'react';
import { Check, Gift, Loader2, Upload } from 'lucide-react';
import { site } from '../data';
import { claimVoucher, isLive, uploadVoucherProof } from '../supabase';

/* Lives at  effortlesseducation.uk/#returning

   A student who has studied with you before proves it, spins once, and
   gets a single-use code worth 5% or 10% off.

   The result is decided inside the database, not in this page — nothing
   a student does on their phone can change what they get. The odds are
   set in supabase/schema-4-extras.sql, in the claim_voucher function. */

type Stage = 'form' | 'spinning' | 'won';

const field =
  'w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-600 focus:border-transparent outline-none';

export default function ReturningStudent() {
  const [stage, setStage] = useState<Stage>('form');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [telegram, setTelegram] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [code, setCode] = useState('');
  const [percent, setPercent] = useState(0);
  const [expires, setExpires] = useState('');
  const [again, setAgain] = useState(false);
  const [reel, setReel] = useState(5);
  const [copied, setCopied] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { setError('Please add a screenshot of a class you took with us.'); return; }
    setBusy(true);
    setError('');

    const up = await uploadVoucherProof(phone, file);
    if (!up.ok) { setBusy(false); setError(`Your screenshot would not upload: ${up.message}`); return; }

    const res = await claimVoucher(name.trim(), phone.trim(), telegram.trim(), up.path);
    setBusy(false);

    if (!res.ok) { setError(res.message || 'That did not work. Please try again.'); return; }

    setCode(res.code ?? '');
    setPercent(res.percent ?? 5);
    setExpires(res.expires_at ?? '');
    setAgain(Boolean(res.again));

    // a short shuffle, then the real result the database gave us
    setStage('spinning');
    let ticks = 0;
    const timer = setInterval(() => {
      setReel(r => (r === 5 ? 10 : 5));
      ticks += 1;
      if (ticks > 11) {
        clearInterval(timer);
        setStage('won');
      }
    }, 130);
  };

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!isLive) {
    return (
      <Shell>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Not open yet</h1>
        <p className="text-sm text-gray-600">
          Please message {site.shortName} and we will sort your discount by hand.
        </p>
      </Shell>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-xl mx-auto">
        <a href="#" className="inline-block text-sm font-semibold text-gray-600 hover:text-gray-900 mb-5">
          ← {site.shortName}
        </a>

        {stage === 'form' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-700 flex items-center justify-center mb-5">
              <Gift className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Studied with us before?</h1>
            <p className="text-gray-600 mb-6">
              Show us a class you took with us and spin once for your discount — 5% or 10% off
              your next course. One code per student, and it lasts 30 days.
            </p>

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label htmlFor="v-name" className="block text-sm font-medium text-gray-700 mb-1">Your name</label>
                <input id="v-name" required value={name} onChange={e => setName(e.target.value)} className={field} />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="v-phone" className="block text-sm font-medium text-gray-700 mb-1">Phone number</label>
                  <input id="v-phone" required value={phone} onChange={e => setPhone(e.target.value)}
                    placeholder="09…" className={field} />
                  <p className="text-xs text-gray-500 mt-1">We use this to find your old classes.</p>
                </div>
                <div>
                  <label htmlFor="v-tg" className="block text-sm font-medium text-gray-700 mb-1">
                    Telegram <span className="text-gray-400">(optional)</span>
                  </label>
                  <input id="v-tg" value={telegram} onChange={e => setTelegram(e.target.value)}
                    placeholder="@yourname" className={field} />
                </div>
              </div>

              <div>
                <span className="block text-sm font-medium text-gray-700 mb-1">
                  Proof of a class you took with us
                </span>
                <label className="flex items-center gap-3 px-4 py-3 rounded-lg border border-dashed border-gray-300 cursor-pointer hover:border-gray-500 bg-gray-50">
                  {file ? <Check className="w-5 h-5 text-green-600 shrink-0" />
                        : <Upload className="w-5 h-5 text-gray-400 shrink-0" />}
                  <span className="text-sm text-gray-700 truncate">
                    {file ? file.name : 'Choose an image'}
                  </span>
                  <input type="file" accept="image/*,application/pdf" className="hidden"
                    onChange={e => setFile(e.target.files?.[0] ?? null)} />
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  An old receipt, a Zoom screenshot, a payment screenshot — anything that shows you
                  studied with us. Only we can see it.
                </p>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button type="submit" disabled={busy}
                className="w-full py-4 bg-brand-600 text-white rounded-xl font-bold text-lg hover:bg-brand-700 disabled:opacity-60 transition-colors">
                {busy ? 'Checking…' : 'Spin for my discount'}
              </button>
            </form>
          </div>
        )}

        {stage === 'spinning' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <div className="text-7xl font-bold text-brand-600 mb-4 tabular-nums">{reel}%</div>
            <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> Drawing your discount…
            </div>
          </div>
        )}

        {stage === 'won' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
            {again && (
              <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 mb-6">
                You already have a code — here it is again.
              </p>
            )}

            <div className="text-sm font-semibold uppercase tracking-widest text-gray-500 mb-2">
              You get
            </div>
            <div className="text-7xl font-bold text-brand-600 mb-6">{percent}%</div>

            <div className="border-2 border-dashed border-brand-300 rounded-xl p-5 mb-5">
              <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">Your code</div>
              <div className="font-mono text-2xl font-bold text-gray-900 tracking-wider">{code}</div>
            </div>

            <button onClick={copy}
              className="w-full py-3 bg-brand-600 text-white rounded-xl font-semibold hover:bg-brand-700 transition-colors mb-3">
              {copied ? 'Copied' : 'Copy my code'}
            </button>
            <a href="#booking"
              className="block w-full py-3 border border-gray-300 rounded-xl font-semibold text-gray-800 hover:border-brand-400 transition-colors">
              Book my course
            </a>

            <p className="text-xs text-gray-500 mt-5 leading-relaxed">
              Type this code into the voucher box when you enrol and the discount comes off
              straight away. It works once{expires ? `, and expires on ${new Date(expires).toLocaleDateString('en-GB')}` : ''}.
              Take a screenshot so you do not lose it.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-200 p-8 text-center">
        {children}
      </div>
    </div>
  );
}
