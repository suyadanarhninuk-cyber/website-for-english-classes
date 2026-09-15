import React from 'react';
import { payment, receipt, site } from '../data';
import {
  Enrolment,
  fullName,
  longDate,
  money,
  paymentRule,
} from '../contact';

/* The printed document. Everything outside it is hidden when the page is
   printed — see the @media print block at the bottom of src/index.css. */

function Field({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex gap-3 py-1 text-sm">
      <span className="w-28 shrink-0 text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-bold tracking-wide text-gray-900 mb-2 pb-1 border-b border-gray-300">
      {children}
    </h3>
  );
}

export default function Receipt({ enrolment }: { enrolment: Enrolment }) {
  const e = enrolment;

  return (
    <article
      id="receipt-document"
      className="bg-white text-gray-900 border border-gray-300 rounded-lg p-6 sm:p-8 print:border-0 print:rounded-none print:p-0"
    >
      {/* masthead */}
      <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b-2 border-gray-900">
        <div className="flex items-center gap-3">
          <img src={site.logoFull} alt="" className="h-14 w-auto rounded" />
          <div>
            <div className="text-lg font-bold">{receipt.issuedBy}</div>
            <div className="text-xs text-gray-500 mt-0.5">{receipt.issuedByLine}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500">Enrolment receipt</div>
          <div className="font-mono text-base font-bold tracking-tight">{e.reference}</div>
          <div className="text-xs text-gray-500 mt-0.5">Issued {longDate(e.issuedAt)}</div>
        </div>
      </div>

      {/* student + course */}
      <div className="grid sm:grid-cols-2 gap-6 sm:gap-10 mt-6">
        <section>
          <Heading>Student</Heading>
          <Field label="Name" value={fullName(e)} />
          <Field label="Phone" value={e.phone} />
          <Field label="Email" value={e.email} />
          <Field label="Telegram" value={e.telegram} />
          <Field label="Facebook" value={e.facebook} />
        </section>

        <section>
          <Heading>Course</Heading>
          <Field label="Type" value={e.bookingType} />
          <Field label="Course" value={e.course} />
          <Field label="Length" value={e.hours ? `${e.hours} hours` : ''} />
          <Field label="Teacher" value={e.teacher} />
          <Field label="Platform" value="Zoom" />
          <Field label="Start" value={longDate(e.startDate)} />
        </section>
      </div>

      {/* requested times */}
      {e.slots.length > 0 && (
        <section className="mt-6">
          <Heading>Requested class times · {site.timezoneLabel}</Heading>
          <ul className="text-sm space-y-1 mt-2">
            {e.slots.map(s => (
              <li key={s} className="flex gap-2">
                <span className="text-gray-400">—</span>
                <span className="font-medium">{s}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-gray-500 mt-2">
            Requested by the student. Confirmed with the teacher before the first lesson.
          </p>
        </section>
      )}

      {e.notes && (
        <section className="mt-6">
          <Heading>Student notes</Heading>
          <p className="text-sm mt-2 whitespace-pre-line">{e.notes}</p>
        </section>
      )}

      {/* amount */}
      <section className="mt-6 border border-gray-300 rounded-md overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 print:bg-white border-b border-gray-300">
          <span className="text-sm font-semibold">Amount due</span>
          <span className="text-xl font-bold">{money(e.fee)}</span>
        </div>

        <div className="px-4 py-4 text-sm">
          <div className="font-semibold mb-2">Pay to {payment.accountName}</div>
          <ul className="space-y-1 mb-3">
            {payment.methods.map(m => (
              <li key={m.name} className="flex justify-between gap-4">
                <span className="text-gray-600">{m.name}</span>
                <span className="font-mono font-medium">{m.number}</span>
              </li>
            ))}
          </ul>

          <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside">
            {payment.steps.map(s => <li key={s}>{s}</li>)}
          </ol>

          <p className="text-xs font-semibold mt-3 text-gray-900">{paymentRule(e)}</p>
        </div>

        <div className="grid grid-cols-3 border-t border-gray-300 text-xs">
          <div className="px-4 py-3 border-r border-gray-300">
            <div className="text-gray-500 mb-4">Amount received</div>
            <div className="border-b border-gray-400" />
          </div>
          <div className="px-4 py-3 border-r border-gray-300">
            <div className="text-gray-500 mb-4">Date received</div>
            <div className="border-b border-gray-400" />
          </div>
          <div className="px-4 py-3">
            <div className="text-gray-500 mb-4">Received by</div>
            <div className="border-b border-gray-400" />
          </div>
        </div>
      </section>

      {/* terms */}
      <ul className="mt-5 text-[11px] leading-relaxed text-gray-500 space-y-0.5">
        {receipt.terms.map(t => <li key={t}>{t}</li>)}
      </ul>

      {/* teacher slip */}
      <div className="mt-8 border-t border-dashed border-gray-400 pt-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
          <h3 className="text-sm font-bold">Teacher confirmation slip</h3>
          <span className="font-mono text-xs text-gray-500">{e.reference}</span>
        </div>

        <div className="grid sm:grid-cols-2 gap-x-10">
          <div>
            <Field label="Teacher" value={e.teacher || '—'} />
            <Field label="Student" value={fullName(e)} />
            <Field label="Course" value={e.course} />
          </div>
          <div>
            <Field label="Start" value={longDate(e.startDate) || '—'} />
            <Field label="Times" value={e.slots.join(' · ') || '—'} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-10 mt-6 text-xs">
          <div>
            <div className="border-b border-gray-400 h-6" />
            <div className="text-gray-500 mt-1">Teacher agrees these times</div>
          </div>
          <div>
            <div className="border-b border-gray-400 h-6" />
            <div className="text-gray-500 mt-1">Date</div>
          </div>
        </div>
      </div>
    </article>
  );
}
