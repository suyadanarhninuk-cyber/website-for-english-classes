import React, { useState } from 'react';
import { CheckCircle2, ExternalLink } from 'lucide-react';
import { forms, site } from '../data';
import { isLive, sendTeacherForm } from '../supabase';

/* Teachers fill this in themselves. It lands in your admin page as
   "Waiting for you" — never on the website. You decide what gets
   published, and what they ask to be paid stays private. */

export default function TeacherPortal() {
  const [kind, setKind] = useState<'new' | 'update'>('new');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [telegram, setTelegram] = useState('');
  const [courses, setCourses] = useState('');
  const [blurb, setBlurb] = useState('');
  const [availability, setAvailability] = useState('');
  const [feeRequest, setFeeRequest] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const field =
    'w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError('');
    const res = await sendTeacherForm({
      kind, name: name.trim(), phone: phone.trim(), email: email.trim(),
      telegram: telegram.trim(), courses: courses.trim(), blurb: blurb.trim(),
      availability_text: availability.trim(), fee_request: feeRequest.trim(),
    });
    setSending(false);
    if (res.ok) setSent(true); else setError(res.message);
  };

  return (
    <section id="teach" className="py-20 bg-gray-50 border-t border-gray-100 no-print">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-10 items-start">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight mb-4">
              Teaching with {site.shortName}
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Tell us what you teach and the hours you are free, and we will match you with students.
              Already teaching with us? Use the same form whenever your hours change.
            </p>
            <p className="text-sm text-gray-500 leading-relaxed">
              We read everything that comes in and confirm it with you before your name appears on
              the site. What we agree to pay you is private and never published.
            </p>
          </div>

          {/* Database not connected yet — fall back to the Jotform */}
          {!isLive && (
            <div className="space-y-3">
              <a href={forms.teacherRegistration} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-gray-200 hover:border-indigo-400 transition-colors">
                <span>
                  <span className="block font-semibold text-gray-900">New teacher</span>
                  <span className="block text-sm text-gray-600 mt-0.5">Register your courses and hours.</span>
                </span>
                <ExternalLink className="w-4 h-4 text-gray-400 shrink-0" />
              </a>
              <a href={forms.teacherUpdate || forms.teacherRegistration} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-gray-200 hover:border-indigo-400 transition-colors">
                <span>
                  <span className="block font-semibold text-gray-900">Already teaching with us</span>
                  <span className="block text-sm text-gray-600 mt-0.5">Change your hours or your classes.</span>
                </span>
                <ExternalLink className="w-4 h-4 text-gray-400 shrink-0" />
              </a>
            </div>
          )}

          {isLive && sent && (
            <div className="p-8 rounded-2xl bg-white border border-gray-200 text-center">
              <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-4" />
              <h3 className="font-bold text-gray-900 mb-2">Thank you, {name.split(' ')[0]}.</h3>
              <p className="text-sm text-gray-600">
                We have your details and will be in touch on Telegram or by phone.
              </p>
            </div>
          )}

          {isLive && !sent && (
            <form onSubmit={submit} className="space-y-4 p-6 rounded-2xl bg-white border border-gray-200">
              <div className="flex gap-2">
                {(['new', 'update'] as const).map(k => (
                  <button key={k} type="button" onClick={() => setKind(k)}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                      kind === k ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-200'
                    }`}>
                    {k === 'new' ? 'I am new' : 'Updating my hours'}
                  </button>
                ))}
              </div>

              <div>
                <label htmlFor="t-name" className="block text-sm font-medium text-gray-700 mb-1">Your name</label>
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
                <label htmlFor="t-email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input id="t-email" type="email" value={email} onChange={e => setEmail(e.target.value)} className={field} />
              </div>

              <div>
                <label htmlFor="t-courses" className="block text-sm font-medium text-gray-700 mb-1">
                  What can you teach?
                </label>
                <input id="t-courses" required placeholder="IELTS Foundation, General English Basic to Intermediate"
                  value={courses} onChange={e => setCourses(e.target.value)} className={field} />
              </div>

              <div>
                <label htmlFor="t-hours" className="block text-sm font-medium text-gray-700 mb-1">
                  Hours you are free
                </label>
                <textarea id="t-hours" rows={4} required value={availability}
                  onChange={e => setAvailability(e.target.value)}
                  placeholder={'Monday | 6:00–8:00 PM\nWednesday | 6:00–9:00 PM\nSaturday | 1:00–5:00 PM'}
                  className={`${field} resize-none font-mono text-xs`} />
                <p className="text-xs text-gray-500 mt-1">One line per day: the day, a line, then the times.</p>
              </div>

              <div>
                <label htmlFor="t-blurb" className="block text-sm font-medium text-gray-700 mb-1">
                  A sentence about how you teach
                </label>
                <textarea id="t-blurb" rows={2} value={blurb} onChange={e => setBlurb(e.target.value)}
                  className={`${field} resize-none`} />
              </div>

              <div>
                <label htmlFor="t-fee" className="block text-sm font-medium text-gray-700 mb-1">
                  What would you like to be paid per session?
                </label>
                <input id="t-fee" value={feeRequest} onChange={e => setFeeRequest(e.target.value)}
                  placeholder="e.g. 15000 MMK per hour" className={field} />
                <p className="text-xs text-gray-500 mt-1">
                  Private between you and us. It is never shown on the website.
                </p>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button type="submit" disabled={sending}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-60 transition-colors">
                {sending ? 'Sending…' : 'Send to Effortless Education'}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
