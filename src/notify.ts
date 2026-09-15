import { site } from './data';

/* Email alerts.

   A website like this cannot log in to your Gmail and send mail as you —
   that would mean putting your Google password in a public file. Instead
   it hands the message to a small forwarding service (Formspree), which
   emails it to whatever address you signed up with. Your Gmail receives
   it normally.

   Set it up once:
     1. Sign up free at formspree.io with your Gmail address
     2. Create a form, it gives you an address like
        https://formspree.io/f/abcdwxyz
     3. Paste that into formEndpoint in src/data.ts

   Leave formEndpoint empty and nothing breaks — you just check the admin
   page instead of your inbox. */

export async function notify(subject: string, fields: Record<string, string>) {
  if (!site.formEndpoint) return false;
  try {
    const res = await fetch(site.formEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ ...fields, _subject: subject }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
