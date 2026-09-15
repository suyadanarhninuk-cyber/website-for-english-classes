import React, { useState } from 'react';
import { Upload, Check } from 'lucide-react';
import { payment, site } from '../data';
import { money } from '../contact';

/* Used twice: at the end of booking, and again on the student's private
   link if they chose to pay later. */

export interface PaymentDetails {
  method: string;
  last6: string;
  file: File | null;
}

export default function PaymentPanel({
  fee, reference, busy, onSend, onSkip, skipLabel,
}: {
  fee: number;
  reference: string;
  busy: boolean;
  onSend: (d: PaymentDetails) => void;
  onSkip?: () => void;
  skipLabel?: string;
}) {
  const [method, setMethod] = useState(payment.methods[0]?.name ?? '');
  const [last6, setLast6] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [touched, setTouched] = useState(false);

  const ready = Boolean(file) || last6.trim().length >= 4;

  const field =
    'w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-brand-600 focus:border-transparent outline-none transition-all';

  return (
    <div className="space-y-6">
      {/* what to transfer */}
      <div className="rounded-2xl border-2 p-5" style={{ borderColor: site.brandColour }}>
        <div className="flex items-baseline justify-between gap-4 mb-4">
          <span className="text-sm font-semibold text-gray-700">Amount to transfer</span>
          <span className="text-3xl font-bold" style={{ color: site.brandColour }}>{money(fee)}</span>
        </div>

        <div className="text-sm font-semibold text-gray-900 mb-2">
          To {payment.accountName}
        </div>
        <div className="space-y-1.5">
          {payment.methods.map(m => (
            <div key={m.name} className="flex justify-between gap-4 text-sm">
              <span className="text-gray-600">{m.name}</span>
              <span className="font-mono font-semibold text-gray-900">{m.number}</span>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-500 mt-4">
          Put your reference <span className="font-mono font-semibold text-gray-700">{reference}</span>
          {' '}in the transfer note if your app allows it.
        </p>
      </div>

      {/* what they paid with */}
      <div>
        <span className="block text-sm font-bold text-gray-900 mb-2">Which app did you use?</span>
        <div className="flex flex-wrap gap-2">
          {payment.methods.map(m => (
            <button key={m.name} type="button" onClick={() => setMethod(m.name)}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                method === m.name
                  ? 'text-white border-transparent'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
              }`}
              style={method === m.name ? { backgroundColor: site.brandColour } : undefined}>
              {m.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="last6" className="block text-sm font-bold text-gray-900 mb-2">
            Last 6 digits of the transaction
          </label>
          <input id="last6" inputMode="numeric" maxLength={12} value={last6}
            onChange={e => setLast6(e.target.value)} placeholder="123456" className={field} />
        </div>

        <div>
          <span className="block text-sm font-bold text-gray-900 mb-2">Screenshot of the transfer</span>
          <label className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-dashed border-gray-300 cursor-pointer hover:border-gray-500 transition-colors bg-gray-50">
            {file
              ? <Check className="w-5 h-5 text-green-600 shrink-0" />
              : <Upload className="w-5 h-5 text-gray-400 shrink-0" />}
            <span className="text-sm text-gray-700 truncate">
              {file ? file.name : 'Choose an image'}
            </span>
            <input type="file" accept="image/*,application/pdf" className="hidden"
              onChange={e => setFile(e.target.files?.[0] ?? null)} />
          </label>
          <p className="text-xs text-gray-500 mt-1">Up to 5 MB. Only we can see it.</p>
        </div>
      </div>

      {touched && !ready && (
        <p className="text-sm text-red-600">
          Please add the last 6 digits or a screenshot so we can find your transfer.
        </p>
      )}

      <div className="space-y-3">
        <button type="button" disabled={busy}
          onClick={() => { setTouched(true); if (ready) onSend({ method, last6: last6.trim(), file }); }}
          className="w-full px-6 py-4 text-white rounded-xl font-bold disabled:opacity-60 transition-opacity text-lg"
          style={{ backgroundColor: site.brandColour }}>
          {busy ? 'Sending…' : 'I have paid — send my booking'}
        </button>

        {onSkip && (
          <button type="button" onClick={onSkip} disabled={busy}
            className="w-full px-6 py-3 rounded-xl font-semibold text-gray-700 border border-gray-300 hover:border-gray-500 transition-colors">
            {skipLabel ?? 'Book now, pay later'}
          </button>
        )}
      </div>
    </div>
  );
}
