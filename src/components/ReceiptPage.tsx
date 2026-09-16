import React, { useCallback, useEffect, useState } from 'react';
import { Loader2, Printer, RefreshCw } from 'lucide-react';
import { site } from '../data';
import { Enrolment } from '../contact';
import { attachPayment, getEnrolment, uploadPaymentFile } from '../supabase';
import Receipt from './Receipt';
import PaymentPanel, { PaymentDetails } from './PaymentPanel';

/* Lives at  yoursite.netlify.app/#receipt/<the student's token>

   The link is the only way in, and it only ever shows that one booking.
   While payment is outstanding the student can upload their transfer
   here. Once you confirm it in the admin page, this page becomes their
   receipt, marked PAID, ready to print. */

const toEnrolment = (r: Record<string, unknown>): Enrolment => ({
  reference: String(r.reference ?? ''),
  issuedAt: String(r.created_at ?? ''),
  status: (r.status as Enrolment['status']) ?? 'awaiting_payment',
  paymentMethod: String(r.payment_method ?? ''),
  paymentLast6: String(r.payment_last6 ?? ''),
  paidAt: (r.paid_at as string) ?? null,
  confirmedAt: (r.confirmed_at as string) ?? null,
  accessUrl: String(r.access_url ?? ''),
  accessNote: String(r.access_note ?? ''),
  firstName: String(r.first_name ?? ''),
  lastName: String(r.last_name ?? ''),
  email: String(r.email ?? ''),
  phone: String(r.phone ?? ''),
  telegram: String(r.telegram ?? ''),
  facebook: String(r.facebook ?? ''),
  notes: String(r.notes ?? ''),
  bookingType: (r.booking_type as Enrolment['bookingType']) ?? 'One-to-One',
  course: String(r.course ?? ''),
  hours: (r.hours as number) ?? null,
  teacher: String(r.teacher ?? ''),
  slots: (r.slots as string[]) ?? [],
  startDate: (r.start_date as string) ?? '',
  fee: Number(r.fee ?? 0),
});

export default function ReceiptPage({ token }: { token: string }) {
  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState<Enrolment | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const row = await getEnrolment(token);
    setRecord(row ? toEnrolment(row as Record<string, unknown>) : null);
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const pay = async (d: PaymentDetails) => {
    setBusy(true);
    setError('');
    let path = '';
    if (d.file) {
      const up = await uploadPaymentFile(token, d.file);
      if (!up.ok) { setBusy(false); setError(`Your screenshot would not upload: ${up.message}`); return; }
      path = up.path;
    }
    const res = await attachPayment(token, d.method, d.last6, path);
    setBusy(false);
    if (!res.ok) { setError(res.message); return; }
    load();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!record) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <h1 className="text-lg font-bold text-gray-900 mb-2">We cannot find that booking</h1>
          <p className="text-sm text-gray-600 mb-6">
            The link may be incomplete. Copy the whole address from the message we sent you,
            or contact us with your reference number.
          </p>
          <a href="#" className="text-sm font-semibold" style={{ color: site.brandColour }}>
            Go to {site.shortName}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 print:bg-white print:p-0">
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5 no-print">
          <a href="#" className="text-sm font-semibold text-gray-600 hover:text-gray-900">
            ← {site.shortName}
          </a>
          <div className="flex gap-2">
            <button onClick={load}
              className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-sm font-semibold text-gray-700 flex items-center gap-2">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
            <button onClick={() => window.print()}
              className="px-4 py-2 rounded-lg text-white text-sm font-semibold flex items-center gap-2"
              style={{ backgroundColor: site.brandColour }}>
              <Printer className="w-4 h-4" /> Print
            </button>
          </div>
        </div>

        {record.status === 'confirmed' && (
          <p className="mb-5 px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-sm text-green-800 no-print">
            Your payment is confirmed. This is your receipt — print it or save it as a PDF.
          </p>
        )}

        {record.status === 'confirmed' && (record.accessUrl || record.accessNote) && (
          <div className="mb-5 p-5 rounded-2xl bg-white border-2 no-print"
            style={{ borderColor: site.brandColour }}>
            <h2 className="font-bold text-gray-900 mb-1">Your class</h2>
            {record.accessNote && (
              <p className="text-sm text-gray-600 mb-3 whitespace-pre-line">{record.accessNote}</p>
            )}
            {record.accessUrl && (
              <a href={record.accessUrl} target="_blank" rel="noopener noreferrer"
                className="inline-block px-5 py-3 rounded-xl text-white font-semibold"
                style={{ backgroundColor: site.brandColour }}>
                Open my class
              </a>
            )}
            <p className="text-xs text-gray-500 mt-3">
              This link is yours. Please do not share it.
            </p>
          </div>
        )}
        {record.status === 'checking' && (
          <p className="mb-5 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-900 no-print">
            We have your transfer and are checking it. Come back to this link — it becomes your
            receipt once we confirm.
          </p>
        )}
        {record.status === 'rejected' && (
          <p className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800 no-print">
            We could not match your transfer. Please message us with your reference number.
          </p>
        )}

        <Receipt enrolment={record} />

        {record.status === 'awaiting_payment' && (
          <div className="mt-8 bg-white rounded-2xl border border-gray-200 p-6 no-print">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Send your payment</h2>
            <p className="text-sm text-gray-600 mb-6">
              Transfer the amount above, then tell us which app you used and add your screenshot.
            </p>
            <PaymentPanel fee={record.fee} reference={record.reference} busy={busy} onSend={pay} />
            {error && (
              <p className="mt-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                {error}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
