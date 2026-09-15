import React from 'react';
import { payment, receipt, site } from '../data';
import {
  Enrolment, fullName, longDate, money, paymentRule,
} from '../contact';

/* The printed document.

   Before you confirm the payment it prints as a booking with the amount
   due. Once you confirm it, the same document becomes a receipt marked
   PAID. Everything outside it is hidden when the page is printed — see
   the @media print block in src/index.css. */

const maroon = site.brandColour;
const gold = site.brandAccent;

function Field({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex gap-3 py-[3px] text-sm">
      <span className="w-24 shrink-0 text-gray-500">{label}</span>
      <span className="font-medium text-gray-900 break-words">{value}</span>
    </div>
  );
}

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] mb-2 pb-1 border-b border-gray-300"
      style={{ color: maroon }}>
      {children}
    </h3>
  );
}

export default function Receipt({ enrolment }: { enrolment: Enrolment }) {
  const e = enrolment;
  const paid = e.status === 'confirmed';
  const checking = e.status === 'checking';
  const rejected = e.status === 'rejected';

  return (
    <article
      id="receipt-document"
      className="bg-white text-gray-900 border border-gray-300 rounded-lg p-6 sm:p-8 print:border-0 print:rounded-none print:p-0"
    >
      {/* masthead */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <img src={site.logoFull} alt="" className="h-16 w-auto" />
          <div>
            <div className="text-base font-bold leading-tight" style={{ color: maroon }}>
              {receipt.issuedBy}
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5">{receipt.issuedByLine}</div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-[11px] uppercase tracking-[0.14em] text-gray-500">
            {paid ? 'Official receipt' : 'Enrolment record'}
          </div>
          <div className="font-mono text-lg font-bold tracking-tight" style={{ color: maroon }}>
            {e.reference}
          </div>
          <div className="text-[11px] text-gray-500">
            Issued {longDate(e.issuedAt)}
          </div>
        </div>
      </div>

      <div className="h-[3px] mt-3 mb-5" style={{ backgroundColor: maroon }} />

      {/* status */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {paid && (
          <>
            <span className="px-3 py-1 rounded text-xs font-bold tracking-wide text-white"
              style={{ backgroundColor: '#15803d' }}>
              PAID
            </span>
            <span className="text-sm text-gray-600">
              Place confirmed{e.confirmedAt ? ` on ${longDate(e.confirmedAt)}` : ''}.
            </span>
          </>
        )}
        {checking && (
          <>
            <span className="px-3 py-1 rounded text-xs font-bold tracking-wide"
              style={{ backgroundColor: gold, color: '#3b2600' }}>
              PAYMENT SENT
            </span>
            <span className="text-sm text-gray-600">We are checking your transfer.</span>
          </>
        )}
        {rejected && (
          <>
            <span className="px-3 py-1 rounded text-xs font-bold tracking-wide text-white bg-red-700">
              NOT MATCHED
            </span>
            <span className="text-sm text-gray-600">Please message us about this booking.</span>
          </>
        )}
        {!paid && !checking && !rejected && (
          <>
            <span className="px-3 py-1 rounded text-xs font-bold tracking-wide border border-gray-400 text-gray-700">
              AWAITING PAYMENT
            </span>
            <span className="text-sm text-gray-600">Your place is held once payment is confirmed.</span>
          </>
        )}
      </div>

      {/* student + course */}
      <div className="grid sm:grid-cols-2 gap-6 sm:gap-10">
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

      {/* times */}
      {e.slots.length > 0 && (
        <section className="mt-6">
          <Heading>Class times · {site.timezoneLabel}</Heading>
          <ul className="text-sm space-y-1 mt-2">
            {e.slots.map(s => (
              <li key={s} className="flex gap-2">
                <span style={{ color: gold }}>◆</span>
                <span className="font-medium">{s}</span>
              </li>
            ))}
          </ul>
          {!paid && (
            <p className="text-[11px] text-gray-500 mt-2">
              Requested by the student and confirmed with the teacher before the first lesson.
            </p>
          )}
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
        <div className="flex items-center justify-between px-4 py-3 border-b-2"
          style={{ borderColor: gold, backgroundColor: '#faf7f2' }}>
          <span className="text-sm font-semibold">
            {paid ? 'Amount received' : 'Amount due'}
          </span>
          <span className="text-2xl font-bold" style={{ color: maroon }}>{money(e.fee)}</span>
        </div>

        {paid ? (
          <div className="px-4 py-4 text-sm">
            <div className="grid sm:grid-cols-3 gap-3">
              <Field label="Paid by" value={e.paymentMethod || '—'} />
              <Field label="Last 6 digits" value={e.paymentLast6 || '—'} />
              <Field label="Date paid" value={longDate(e.paidAt || '')} />
            </div>
            <p className="text-[11px] text-gray-500 mt-3">
              Received by {payment.accountName} for {receipt.issuedBy}.
            </p>
          </div>
        ) : (
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
            <ol className="text-[11px] text-gray-600 space-y-1 list-decimal list-inside">
              {payment.steps.map(s => <li key={s}>{s}</li>)}
            </ol>
            <p className="text-[11px] font-semibold mt-3 text-gray-900">{paymentRule(e)}</p>
          </div>
        )}
      </section>

      {/* terms */}
      <ul className="mt-5 text-[10px] leading-relaxed text-gray-500 space-y-0.5">
        {receipt.terms.map(t => <li key={t}>{t}</li>)}
        <li>Only ever transfer money to the number printed on this receipt.</li>
      </ul>

      {/* teacher slip */}
      {e.teacher && (
        <div className="mt-8 border-t border-dashed border-gray-400 pt-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
            <h3 className="text-sm font-bold" style={{ color: maroon }}>
              Teacher confirmation slip
            </h3>
            <span className="font-mono text-[11px] text-gray-500">{e.reference}</span>
          </div>

          <div className="grid sm:grid-cols-2 gap-x-10">
            <div>
              <Field label="Teacher" value={e.teacher} />
              <Field label="Student" value={fullName(e)} />
              <Field label="Course" value={e.course} />
            </div>
            <div>
              <Field label="Start" value={longDate(e.startDate) || '—'} />
              <Field label="Times" value={e.slots.join(' · ') || '—'} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-10 mt-6 text-[11px]">
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
      )}
    </article>
  );
}
