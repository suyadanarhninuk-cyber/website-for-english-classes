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
