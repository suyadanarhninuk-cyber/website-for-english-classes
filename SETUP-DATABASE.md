# Turning on the admin page

Follow this once. About 20 minutes. Until you finish it, the website keeps
working exactly as it does now, reading everything from `src/data.ts`.

---

## 1. Make a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign up — the free plan is
   all you need.
2. Click **New project**.
   - Name: `effortless-education`
   - Database password: let it generate one, and **save it in your password
     manager**. You will rarely need it, but it cannot be recovered.
   - Region: **Southeast Asia (Singapore)** — closest to your students.
3. Wait two minutes while it builds.

## 2. Create the tables

1. In the left menu click **SQL Editor** → **New query**.
2. Open `supabase/schema.sql` from your repository, copy the whole file,
   paste it into the box.
3. Click **Run**. You should see "Success".

That created your tables, the security rules, and your five current teachers.

## 2b. Add enrolments and payments

Same again: **SQL Editor** → **New query** → paste the whole of
`supabase/schema-2-enrolments.sql` → **Run**.

That adds the bookings table, the private bucket where payment screenshots
are kept, and the two functions that let a student open their own booking
without being able to see anybody else's.

## 2c. Add the teacher area and teacher pay

Once more: **SQL Editor** → **New query** → paste the whole of
`supabase/schema-3-teachers.sql` → **Run**.

That gives every teacher a private page of their own, a place to keep their
wallet details where only you can read them, and the request-to-be-paid
system.

## 2d. Add photos, vouchers and video courses

Last one: **SQL Editor** → **New query** → paste the whole of
`supabase/schema-4-extras.sql` → **Run**.

## 3. Create your login

1. Left menu → **Authentication** → **Users** → **Add user** → *Create new user*.
2. Use your own email and a strong password. Tick *Auto Confirm User*.
3. Then go to **Authentication** → **Sign In / Providers** and turn
   **Allow new users to sign up** OFF.

That last step matters: it means yours is the only account that can ever
exist. Nobody can register themselves into your admin page.

## 4. Connect the website

1. Left menu → **Project Settings** → **API**.
2. Copy the **Project URL** and the **anon public** key.
3. In your GitHub repository open `src/supabase.ts`, click the pencil, and
   paste them into the two lines near the top:

   ```
   export const SUPABASE_URL = 'https://xxxxxxxx.supabase.co';
   export const SUPABASE_ANON_KEY = 'eyJhbGciOi...';
   ```

4. Commit. Netlify rebuilds in about a minute.

**Is it safe to have those in a public file?** Yes. The anon key is designed
to be public — it can only do what the rules in `schema.sql` permit, which is
read published classes and send you a teacher form or a review. Changing
anything requires your login. The key you must never publish is the
**service_role** key on that same settings page. Don't copy that one.

## 5. Sign in

Go to `your-site.netlify.app/#admin` and sign in with the email and password
from step 3. Bookmark it.

---

# Using it

## Group classes, every month

**Group classes** tab. Pick the month at the top, then either **Copy
[last month]** and adjust the dates, or **Add a class**. Fill in the course,
the fee, the days and times, and the start date. Press **Save this month**.

Students see that month's timetable on the website immediately — the pricing
card and the booking form both switch to it. Untick **Show** to hide one
class without deleting it.

The website always displays the current month, or the next month that has
classes in it. So setting up October in September is safe: students keep
seeing September until October arrives.

## Enrolments — the part students see

A student books on the website, transfers the fee, and uploads their
screenshot. Their booking lands in your **Enrolments** tab, and they get a
private link of their own.

Open the booking, press **View screenshot**, check the transfer arrived, then
press **Confirm payment**. That is the moment their link turns into a proper
receipt marked PAID, which they can print themselves. Press **Copy their
link** and send it on Telegram so they know.

If a transfer does not match, press **Cannot match it** and write yourself a
note. The student is told to contact you.

Students booking one-to-one can also choose **Book now, pay later** — useful
while you are still agreeing times with the teacher. Their booking shows as
*Not paid yet*, and they come back through the same link to upload the
transfer when they are ready.

## Teachers

**Teachers** tab. Anything a teacher sends through the website appears at the
top under **Waiting for you**, with a number badge. You see their phone,
Telegram, hours and what they want to be paid.

Press **Add to the website** and they are created as **Pending** — invisible.
Tick the levels they teach, check their hours, then switch them to **Live**
and press Save. Only then can students see or book them.

What they asked to be paid is shown to you on the dark line and is never
copied to the website. There is no field for it in the public teacher table
at all.

## Teacher pay

Each approved teacher has a private page of their own, at a long secret
address. Find it in the **Teachers** tab: open a teacher, look under
**Private**, and press **Copy their link**. Send it to them on Telegram once.
They should keep it.

On that page a teacher can see the hours students are being shown, send you
new ones, keep their wallet details correct, and ask to be paid.

When they ask, it appears in your **Teacher pay** tab with a number badge.
Each request shows the amount, which classes it covers, and — on the dark
line — exactly where to send the money: their wallet, their number, the name
on the account, and their Telegram. Transfer the money, attach your
screenshot, press **Mark as paid**. The teacher sees the screenshot on their
own page.

Their wallet details and the rate you agreed are in a separate table that the
public cannot read at all, under any circumstances.

## Returning student discounts

The gold **Studied with us before?** button in the menu takes an old student
to a page where they upload proof of a class they took with you, then spin
once for 5% or 10% off. They get a single-use code that lasts 30 days.

The draw is real. The result is decided inside the database, so nothing on a
student's phone can change it. Roughly 7 in 10 get 5% and 3 in 10 get 10%. To
change that, edit `odds_five` in the `claim_voucher` function in
`supabase/schema-4-extras.sql` and run that function again in the SQL Editor.
`valid_days` on the line below controls how long a code lasts.

In your **Vouchers** tab you see every code given out, with the proof the
student uploaded. If someone never studied with you, press **Cancel this
code** before they spend it. Underneath, every code typed at enrolment that
was refused — a few are honest typos; the same wrong code over and over is
someone guessing.

A student enters their code in the voucher box when they enrol. The discount
comes off immediately and the receipt shows the full fee, the discount and
what they actually owe. Each code works once.

## Video courses

**Video courses** tab. Add a title, a fee, how long it is, and a note saying
what happens after they pay. They appear on the website and as a third choice
in the booking form, so a student buys one the same way they book a class,
and it lands in your Enrolments tab like everything else.

## Teacher photos

A teacher uploads their own photo on their private page and ticks a box
saying they are happy to be shown publicly. It appears in your **Teachers**
tab marked *Waiting* — press **Use this photo** and it goes live, or **Refuse
it**. If a teacher has no photo, students see their initials instead, so a
card never looks broken. You can take a photo down at any time.

## Reviews

**Reviews** tab. Students leave reviews at the bottom of the reviews section.
They arrive as pending and appear on the site only when you press **Publish**.
You can **Hide** a published one at any time without deleting it.

---

# If something goes wrong

**The site shows old prices after saving.** Your browser cached the page.
Refresh with Cmd+Shift+R.

**The admin page says "Not connected yet".** The two lines in
`src/supabase.ts` are empty, or the commit has not finished deploying.

**Wrong email or password.** Reset it in Supabase → Authentication → Users →
click your user → Reset password.

**The whole site suddenly shows the old `data.ts` content.** That is the
safety net working: Supabase was unreachable, so the site fell back to the
file instead of showing an error to your students. Check
[status.supabase.com](https://status.supabase.com) and try again.

**Free plan note.** Supabase pauses a project that gets no traffic for a
week. A live website with visitors keeps it awake. If it ever pauses, you
restore it with one click in the dashboard — and while it is paused, the
website falls back to `src/data.ts` rather than breaking.
