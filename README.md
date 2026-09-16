# Effortless Education — website

Live site built with React + Vite. No database, no server: it compiles to
plain files that any free host can serve.

## What happens when a student enrols

1. They pick one-to-one or a group course, then a level or a course.
2. For one-to-one they choose a teacher, tick the times they want from
   that teacher's real hours, and pick a start date.
3. They fill in name, phone, Gmail and Telegram.
4. **A receipt appears on screen** with a reference number like
   `EE-260914-4821`, the amount due, your KBZPay / AYA Pay / CB Pay
   number, and a teacher confirmation slip at the bottom.
5. They can print it, save it as a PDF, email it to you, send it on
   Messenger, or copy it.
6. The **Finish on the registration form** button opens your Jotform with
   the course, teacher, times, start date and the booking reference
   already filled in. They only have to add the payment screenshot and
   the last 6 digits.

So the same booking reaches you twice: once as the receipt the student
sends, and once as the Jotform submission with the screenshot attached.
They carry the same reference number, so they are easy to match.

### How you use the receipt

- The **teacher confirmation slip** at the bottom has the teacher, the
  student, the times and the start date, with a line for the teacher to
  agree. Send it to the teacher, or print it and keep it.
- Once the student has paid, fill in **Amount received / Date received /
  Received by** and print it again as the student's copy.

### Getting a copy by email automatically

Sign up at [formspree.io](https://formspree.io), create a form, and paste
the address it gives you into `formEndpoint` in `src/data.ts`. Every
receipt then lands in your inbox the moment it is created — before the
student has paid anything.

### If Jotform does not fill itself in

The booking page passes the answers to Jotform using each question's
**Unique Name**. To check one: open the form builder → click the question
→ gear icon → Advanced → Unique Name. Put the same word into
`forms.prefillKeys` in `src/data.ts`. If a name is wrong, Jotform just
ignores it and the student types that answer themselves — nothing breaks.

## Your admin page

`your-site.netlify.app/#admin` — sign in and you can change the monthly group
timetable, approve teachers who send in their hours, and approve student
reviews, without touching GitHub at all.

It needs a free Supabase database behind it. **See `SETUP-DATABASE.md`** for
the one-time setup. Until you do that, the admin page says "not connected"
and the website runs from `src/data.ts` as described below.

Once it is connected, these move to the admin page: group classes, teachers,
reviews. Everything else — one-to-one prices, payment numbers, contact
details, FAQ — stays in `src/data.ts`.

## Changing the information on the site

**Everything you can change lives in one file: `src/data.ts`.**

Prices, teachers, available hours, group courses, payment numbers, your
contact details, student reviews and the FAQ are all in there, with
instructions in plain English at the top of the file.

### The easy way (no software to install)

1. Go to your repository on github.com
2. Open `src` → `data.ts`
3. Click the pencil icon (top right)
4. Make your change
5. Scroll down, click **Commit changes**

Netlify rebuilds the site by itself. Your change is live in about a minute.

### Rules so nothing breaks

- Keep the "quote marks" around words — change only what is inside
- Fees are numbers with no quote marks and no commas: `200000`, not `200,000`
- Leave every comma at the end of a line where it is

If the site stops updating after an edit, you removed a quote mark, comma
or bracket. Go to the repository's **Commits** tab, open your last change
and revert it.

## Teachers updating their own details

The **Teaching with Effortless Education** section at the bottom of the site
is a form teachers fill in themselves — their hours, what they teach, what
they want to be paid.

With the database connected, it lands in your admin page under **Waiting for
you**. You press *Add to the website*, tick their levels, and switch them to
**Live**. Until you do, they are invisible: not in the teacher list, and not
bookable.

Without the database, that section falls back to your Jotform teacher form
and you add them by hand in section 4 of `src/data.ts`.

**Their pay never goes in `src/data.ts`.** The teacher form asks for a
fee per session — that is what *you pay them*, and it stays in Jotform.
Every fee on the website is what a *student pays you*. There is no field
for teacher pay anywhere in the site's code, so it cannot leak by
accident.

## Student reviews

With the database connected, students leave a review at the bottom of the
reviews section and it waits in your admin page until you publish it.

Without the database, reviews live in `src/data.ts` and each has an
`approved` line — set it to `false` to hide one while you check it.

## Running it on your own computer (optional)

Requires Node.js.

```
npm install
npm run dev      # preview at http://localhost:3000
npm run build    # produces the dist/ folder for uploading
```
