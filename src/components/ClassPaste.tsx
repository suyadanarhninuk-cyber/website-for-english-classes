import React, { useState } from 'react';
import { AlertTriangle, ClipboardPaste, X } from 'lucide-react';
import { site } from '../data';
import { money } from '../contact';

/* Paste your classes the way you already write them out, and this reads
   them. Nothing is saved until you have looked at what it understood. */

export interface ParsedClass {
  name: string;
  schedule: string;
  fee: number;
  startDate: string;      // yyyy-mm-dd, or ''
  seats: string;
  month: string;          // yyyy-mm, taken from the start date
  problems: string[];
}

const monthOf = (iso: string) => (iso ? iso.slice(0, 7) : '');

/** 5.10.26 · 5/10/26 · 05-10-2026 — day first, the way you write it. */
function parseDate(text: string): string {
  const m = text.match(/(\d{1,2})\s*[./-]\s*(\d{1,2})\s*[./-]\s*(\d{2,4})/);
  if (!m) return '';
  const day = Number(m[1]);
  const month = Number(m[2]);
  let year = Number(m[3]);
  if (year < 100) year += 2000;
  if (day < 1 || day > 31 || month < 1 || month > 12) return '';
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** 395000MMK · 100,000 MMK · 375000Mmk · 395000 Ks */
function parseFee(line: string): number | null {
  const cleaned = line.replace(/,/g, '');
  const m = cleaned.match(/(\d{4,9})\s*(mmk|ks|kyat)?/i);
  if (!m) return null;
  const hasCurrency = /mmk|ks\b|kyat/i.test(cleaned);
  const value = Number(m[1]);
  // a bare number only counts as a fee if it is large enough to be one
  if (!hasCurrency && value < 1000) return null;
  return value;
}

export function parseClasses(text: string): ParsedClass[] {
  const blocks = text
    .split(/\n\s*\n/)
    .map(b => b.trim())
    .filter(Boolean);

  return blocks.map(block => {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);

    let name = '';
    let startDate = '';
    let weeks = '';
    let classSize = '';
    let fee: number | null = null;
    const scheduleParts: string[] = [];

    lines.forEach(line => {
      if (/start\s*date/i.test(line)) {
        startDate = parseDate(line);
        return;
      }
      if (/class\s*size|seats|places/i.test(line)) {
        const m = line.match(/(\d{1,3})/);
        if (m) classSize = m[1];
        return;
      }
      if (/weeks?\b/i.test(line) && /\d/.test(line)) {
        const m = line.match(/(\d{1,2})/);
        if (m) weeks = m[1];
        return;
      }
      const maybeFee = parseFee(line);
      if (maybeFee !== null && /mmk|ks\b|kyat|^\s*[\d,]+\s*$/i.test(line)) {
        fee = maybeFee;
        return;
      }
      if (!name) { name = line; return; }
      scheduleParts.push(line);
    });

    const schedule = [scheduleParts.join(' · '), weeks ? `${weeks} weeks` : '']
      .filter(Boolean)
      .join(' · ');

    const problems: string[] = [];
    if (!name) problems.push('no course name');
    if (fee === null) problems.push('no fee');
    if (!startDate) problems.push('no start date');
    if (!schedule) problems.push('no days or times');

    return {
      name,
      schedule,
      fee: fee ?? 0,
      startDate,
      seats: classSize ? `Class size ${classSize}` : '',
      month: monthOf(startDate),
      problems,
    };
  });
}

const sample = `Intensive Preparation (Tr Mary)
Start Date - 5.10.26
Mon to Fri (Sat) - 9 to 10:30 Pm
4 Weeks
Class Size - 12
395000MMK`;

export default function ClassPaste({
  onAdd, busy,
}: {
  onAdd: (rows: ParsedClass[]) => void;
  busy: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const parsed = text.trim() ? parseClasses(text) : [];
  const usable = parsed.filter(p => p.name && p.fee > 0);

  const monthLabels = Array.from(new Set(usable.map(p => p.month).filter(Boolean)))
    .sort()
    .map(m => new Date(`${m}-01`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }));

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)}
        className="px-4 py-2 rounded-lg text-sm font-semibold bg-white border border-gray-300 text-gray-700 flex items-center gap-2">
        <ClipboardPaste className="w-4 h-4" /> Paste a list of classes
      </button>
    );
  }

  return (
    <div className="w-full p-5 rounded-2xl border-2 border-gray-300 bg-gray-50">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <h3 className="font-bold text-gray-900">Paste your classes</h3>
          <p className="text-sm text-gray-600 mt-0.5">
            Write them the way you always do. Leave an empty line between each course.
            Nothing is saved until you press the button at the bottom.
          </p>
        </div>
        <button type="button" onClick={() => { setOpen(false); setText(''); }}
          className="text-gray-400 hover:text-gray-900">
          <X className="w-5 h-5" />
        </button>
      </div>

      <textarea rows={10} value={text} onChange={e => setText(e.target.value)}
        placeholder={sample}
        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-sm font-mono resize-y outline-none focus:ring-2 focus:ring-brand-600" />

      {parsed.length > 0 && (
        <div className="mt-4">
          <div className="text-sm font-bold text-gray-900 mb-2">
            {usable.length} class{usable.length === 1 ? '' : 'es'} understood
            {monthLabels.length > 0 && ` · ${monthLabels.join(', ')}`}
          </div>

          <div className="space-y-2">
            {parsed.map((p, i) => (
              <div key={i} className={`p-3 rounded-lg border text-sm ${
                p.problems.length ? 'border-amber-300 bg-amber-50' : 'border-gray-200 bg-white'
              }`}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-semibold text-gray-900">{p.name || '(no name)'}</span>
                  <span className="font-bold text-gray-900">
                    {p.fee ? money(p.fee) : '—'}
                  </span>
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {p.schedule || 'no days or times'}
                  {p.startDate && ` · starts ${new Date(p.startDate).toLocaleDateString('en-GB', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })}`}
                  {p.seats && ` · ${p.seats}`}
                </div>
                {p.problems.length > 0 && (
                  <div className="flex items-center gap-1.5 text-xs text-amber-800 mt-2">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    Missing: {p.problems.join(', ')}. Add it by hand after.
                  </div>
                )}
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-500 mt-3">
            Each class is filed under the month its start date falls in. Fees are read as {site.currency}.
          </p>

          <button type="button" disabled={busy || usable.length === 0}
            onClick={() => { onAdd(usable); setText(''); setOpen(false); }}
            className="mt-4 px-5 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:opacity-50">
            {busy ? 'Adding…' : `Add ${usable.length} class${usable.length === 1 ? '' : 'es'}`}
          </button>
        </div>
      )}
    </div>
  );
}
