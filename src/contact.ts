/* Enrolment plumbing: builds the receipt, writes it out as text, and
   hands it on to Jotform, email and messaging apps.

   You should not need to edit this file. Everything you can change is
   in src/data.ts. */

import { site, payment, forms, receipt, Teacher, Availability } from './data';

export type EnrolmentStatus =
  | 'awaiting_payment'   // booked, nothing transferred yet
  | 'checking'           // screenshot sent, you have not checked it yet
  | 'confirmed'          // you confirmed the money arrived — this is a real receipt
  | 'rejected';          // something was wrong with the payment

export interface Enrolment {
  reference: string;
  token?: string;            // the secret in the student's private link
  issuedAt: string;          // ISO timestamp, set when the booking is made
  status?: EnrolmentStatus;
  paymentMethod?: string;
  paymentLast6?: string;
  paidAt?: string | null;
  confirmedAt?: string | null;

  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  telegram: string;
  facebook: string;
  notes: string;

  bookingType: 'One-to-One' | 'Group course';
  course: string;
  hours: number | null;

  teacher: string;
  slots: string[];           // e.g. ["Monday 6:00–8:00 PM", "Thursday 5:00–7:00 PM"]
  startDate: string;         // yyyy-mm-dd, or ""

  fee: number;
}

/* ── small helpers ─────────────────────────────────────────────────── */

export const money = (n: number) =>
  `${n.toLocaleString('en-US')} ${site.currencySymbol}`;

/** A teacher's "8:00–10:00 AM, 6:00–8:00 PM" becomes two tickable slots. */
export function expandSlots(teacher: Teacher): Availability[] {
  const out: Availability[] = [];
  teacher.availability.forEach(a => {
    a.times.split(',').forEach(part => {
      const times = part.trim();
      if (times) out.push({ day: a.day, times, onRequest: a.onRequest });
    });
  });
  return out;
}

export const slotLabel = (a: Availability) =>
  `${a.day} ${a.times}${a.onRequest ? ' (on request)' : ''}`;

/** EE-260914-4821 — the date, then four digits so two students booking
 *  on the same day never share a reference. */
export function makeReference(): string {
  const d = new Date();
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const tail = String(Math.floor(1000 + Math.random() * 9000));
  return `${receipt.prefix}-${yy}${mm}${dd}-${tail}`;
}

export function longDate(value: string): string {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

export const fullName = (e: Enrolment) =>
  `${e.firstName} ${e.lastName}`.trim();

export const paymentRule = (e: Enrolment) =>
  e.bookingType === 'One-to-One' ? payment.oneToOneRule : payment.groupRule;

export const statusText = (e: Enrolment): string => {
  switch (e.status) {
    case 'confirmed': return 'PAID — place confirmed';
    case 'checking':  return 'Payment sent — we are checking it';
    case 'rejected':  return 'Payment could not be matched — please contact us';
    default:          return 'Awaiting payment';
  }
};

/** A long random string for the student's private link. Not guessable. */
export function makeToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(36).padStart(2, '0')).join('').slice(0, 40);
}

/** The address a student uses to come back to their booking. */
export const receiptLink = (token: string) =>
  `${window.location.origin}${window.location.pathname}#receipt/${token}`;

/* ── the receipt as plain text ─────────────────────────────────────── */

/** Everything on the printed receipt, as text — used for the email, the
 *  messaging buttons and the "copy" button. */
export function receiptText(e: Enrolment): string {
  const lines: string[] = [
    `${receipt.issuedBy} — enrolment receipt`,
    `Reference: ${e.reference}`,
    `Issued: ${longDate(e.issuedAt)}`,
    ``,
    `STUDENT`,
    `Name: ${fullName(e)}`,
    `Phone: ${e.phone}`,
    `Email: ${e.email}`,
  ];
  if (e.telegram) lines.push(`Telegram: ${e.telegram}`);
  if (e.facebook) lines.push(`Facebook: ${e.facebook}`);

  lines.push(
    ``,
    `COURSE`,
    `Type: ${e.bookingType}`,
    `Course: ${e.course}`,
  );
  if (e.hours) lines.push(`Length: ${e.hours} hours`);
  if (e.teacher) lines.push(`Teacher: ${e.teacher}`);
  if (e.slots.length) {
    lines.push(`Requested times (${site.timezoneLabel}):`);
    e.slots.forEach(s => lines.push(`  · ${s}`));
  }
  if (e.startDate) lines.push(`Preferred start: ${longDate(e.startDate)}`);

  lines.push(
    ``,
    `AMOUNT DUE`,
    `${money(e.fee)}`,
    `Pay to: ${payment.accountName}`,
    `${payment.methods.map(m => `${m.name} ${m.number}`).join(' · ')}`,
    paymentRule(e),
  );

  if (e.notes) lines.push(``, `NOTES`, e.notes);

  lines.push(``, `Status: ${statusText(e)}`);
  if (e.status !== 'confirmed') {
    lines.push(`Teacher confirmation: ______________________  Date: ____________`);
  }

  return lines.join('\n');
}

/** The short version, for a Messenger or Viber message. */
export function enrolmentText(e: Enrolment): string {
  const lines = [
    `New enrolment — ${site.name}`,
    `Ref ${e.reference}`,
    `${fullName(e)} · ${e.phone}`,
    `${e.bookingType}: ${e.course}`,
  ];
  if (e.teacher) lines.push(`Teacher: ${e.teacher}`);
  if (e.slots.length) lines.push(`Times: ${e.slots.join('; ')}`);
  if (e.startDate) lines.push(`Start: ${longDate(e.startDate)}`);
  lines.push(`Fee: ${money(e.fee)}`);
  if (e.notes) lines.push(`Notes: ${e.notes}`);
  return lines.join('\n');
}

export function mailtoLink(e: Enrolment): string {
  const subject = encodeURIComponent(`Enrolment ${e.reference} — ${e.course}`);
  const body = encodeURIComponent(receiptText(e));
  return `mailto:${site.email}?subject=${subject}&body=${body}`;
}

/** Messaging buttons to show on the receipt screen. Only the channels
 *  filled in inside src/data.ts appear. */
export function messagingLinks(e: Enrolment) {
  const text = encodeURIComponent(enrolmentText(e));
  const out: { label: string; href: string }[] = [];

  if (site.viber)     out.push({ label: 'Send on Viber',     href: site.viber });
  if (site.messenger) out.push({ label: 'Send on Messenger', href: site.messenger });
  if (site.telegram)  out.push({ label: 'Send on Telegram',  href: site.telegram });
  if (site.whatsapp) {
    const sep = site.whatsapp.includes('?') ? '&' : '?';
    out.push({ label: 'Send on WhatsApp', href: `${site.whatsapp}${sep}text=${text}` });
  }
  return out;
}

/* ── Jotform ───────────────────────────────────────────────────────── */

/** The registration form with the booking already filled in, so the
 *  student only has to add their payment screenshot. */
export function registrationLink(e: Enrolment): string {
  const k = forms.prefillKeys;
  const p = new URLSearchParams();

  p.set(k.course, e.bookingType === 'Group course'
    ? e.course
    : `One-to-One — ${e.course}`);

  if (e.teacher) p.set(k.teacher, e.teacher);
  p.set(k.level, e.course);
  if (e.slots.length) p.set(k.times, e.slots.join('; '));
  if (e.startDate) p.set(k.startDate, e.startDate);

  const note = [`Booking ref ${e.reference}`, e.notes.trim()]
    .filter(Boolean)
    .join(' — ');
  p.set(k.notes, note);

  return `${forms.studentRegistration}?${p.toString()}`;
}

/* ── delivery ──────────────────────────────────────────────────────── */

/** Emails you a copy of the receipt through the address set in
 *  site.formEndpoint. Returns true only if it was definitely delivered. */
export async function deliverEnrolment(e: Enrolment): Promise<boolean> {
  if (!site.formEndpoint) return false;
  try {
    const res = await fetch(site.formEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        _subject: `Enrolment ${e.reference} — ${e.course}`,
        reference: e.reference,
        name: fullName(e),
        phone: e.phone,
        email: e.email,
        telegram: e.telegram,
        facebook: e.facebook,
        bookingType: e.bookingType,
        course: e.course,
        teacher: e.teacher,
        times: e.slots.join('; '),
        startDate: e.startDate,
        fee: money(e.fee),
        notes: e.notes,
        receipt: receiptText(e),
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
