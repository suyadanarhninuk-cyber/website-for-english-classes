/* ═══════════════════════════════════════════════════════════════════════
   EFFORTLESS EDUCATION — ALL WEBSITE CONTENT
   ───────────────────────────────────────────────────────────────────────
   THIS IS THE ONLY FILE YOU NEED TO EDIT.

   Prices, teachers, timetables, course names, your contact details,
   payment numbers and student reviews all live here. Change the text
   between the "quote marks", save, and the website updates itself.

   Three rules so nothing breaks:
     1. Keep the "quote marks" around words. Change only what is inside.
     2. Numbers (fees) have NO quote marks and NO commas. 200000, not 200,000.
     3. Keep every comma at the end of a line exactly where it is.

   If the site ever fails to update after an edit, you have almost
   certainly removed a quote mark, a comma or a curly bracket. Undo your
   last change and try again.

   ⚠ ONE RULE THAT MATTERS MORE THAN ANY OTHER ⚠
   Every fee in this file is what a STUDENT PAYS YOU.
   What YOU PAY A TEACHER never goes in this file, and never goes
   anywhere on this website. Teacher pay stays in your Jotform teacher
   registration submissions, which only you can open.
   ═══════════════════════════════════════════════════════════════════════ */


/* ───────────────────────────────────────────────────────────────────────
   1. YOUR SCHOOL — name, contact details and where enquiries go
   ─────────────────────────────────────────────────────────────────────── */

export const site = {
  name: "Effortless Education",
  shortName: "Effortless Education",

  // The big sentence on the front page.
  heroHeadline: "Master English with",
  heroHighlight: "Effortless Education",
  heroSubtitle:
    "One-to-One and group English courses built around your goals. Learn live with experienced teachers on Zoom, from Basic to IELTS.",

  // The small pill above the headline. Set to "" to hide it.
  heroBadge: "New IELTS & General English intakes open",

  currency: "MMK",
  currencySymbol: "Ks",
  timezoneLabel: "Myanmar Time (MMT)",
  location: "Yangon, Myanmar",

  // ── Your logo ────────────────────────────────────────────────────
  // The image files live in the "public" folder. To change your logo,
  // upload a new image over the old one keeping the same file name.
  logoMark: "./logo-mark.png",   // the square badge, used in the header
  logoFull: "./logo-full.png",   // logo with the name, printed on receipts

  // ── Your brand colours ───────────────────────────────────────────
  // Used on the receipt. Taken from your logo.
  brandColour: "#6d0101",   // deep red
  brandAccent: "#e8a800",   // gold

  // ── Contact details ──────────────────────────────────────────────
  email: "support@effortlesseducation.com",
  phone: "+95 9 959 887 855",

  // ── Messaging links ──────────────────────────────────────────────
  // Fill in the ones you use. Leave "" for any you don't — the button
  // disappears on its own.
  //   Viber:     viber://chat?number=%2B959XXXXXXXXX   (%2B means "+")
  //   Telegram:  https://t.me/your_username
  //   Messenger: https://m.me/your_page_name
  //   WhatsApp:  https://wa.me/959XXXXXXXXX
  viber: "",
  telegram: "",
  messenger: "https://m.me/100063772011423",
  whatsapp: "",

  // ── Social pages shown in the footer ─────────────────────────────
  // CHECK THIS: the id below should be your Facebook PAGE, not your
  // personal account. Swap it if I have them the wrong way round.
  facebook: "https://www.facebook.com/profile.php?id=100063772011423",
  // The name students will see and can search for on Facebook. If you
  // claim a short username on your page (facebook.com/yourname), paste
  // that address into "facebook" above instead of the long id one.
  facebookName: "Effortless English",
  instagram: "",

  // ── Email alerts to your Gmail ───────────────────────────────────
  // Paste a Formspree address here (https://formspree.io/f/abcdwxyz)
  // and you get an email the moment a student enrols, a teacher applies
  // or changes their hours, or a student leaves a review.
  //
  // To set it up: sign up free at formspree.io using your Gmail address,
  // create a form, and paste the address it gives you below.
  //
  // Leave "" and nothing breaks — everything still arrives in your admin
  // page, you just have to look rather than be told.
  formEndpoint: ""
};


/* ───────────────────────────────────────────────────────────────────────
   2. ONE-TO-ONE COURSES AND FEES  —  what the STUDENT pays you
   To change a price, edit the number after "fee:". No commas in numbers.
   ─────────────────────────────────────────────────────────────────────── */

export interface LevelInfo {
  id: string;
  course: 'general' | 'ielts';
  name: string;
  fee: number;
  hours: number | null;
  description?: string;
}

export const oneToOneLevels: LevelInfo[] = [
  { id: "basic",      course: "general", name: "Basic",              fee: 200000, hours: 12 },
  { id: "preInt",     course: "general", name: "Pre-Intermediate",   fee: 230000, hours: 12 },
  { id: "int",        course: "general", name: "Intermediate",       fee: 280000, hours: 12 },
  { id: "upperInt",   course: "general", name: "Upper-Intermediate", fee: 330000, hours: 12 },
  {
    id: "foundation",
    course: "ielts",
    name: "IELTS Foundation (One-to-One)",
    fee: 350000,
    hours: null,
    description: "Covers the test format with Reading and Listening practice."
  },
  {
    id: "testPrep",
    course: "ielts",
    name: "IELTS Test Preparation",
    fee: 350000,
    hours: null,
    description: "Moves on to full review and analysis after covering the foundation."
  }
];

// The note shown on the General English card. Set to "" to hide it.
export const generalEnglishNote = {
  burmese: "Level တခုချင်းဆီအလိုက် ပျမ်းမျှ ၄ လ ကြာမြင့်နိုင်ပါတယ်",
  english: "(Takes roughly 4 months per level)"
};


/* ───────────────────────────────────────────────────────────────────────
   3. GROUP COURSES AND FEES  —  what the STUDENT pays you
   To add a course, copy a whole line and change the name and fee.
   To remove one, delete its whole line.
   ─────────────────────────────────────────────────────────────────────── */

export interface GroupCourse {
  name: string;
  fee: number;
}

export const groupCourses: GroupCourse[] = [
  { name: "TKT Crash Course",            fee: 280000 },
  { name: "Basic Speaking",              fee: 100000 },
  { name: "Duolingo",                    fee: 100000 },
  { name: "Grammar for IELTS Writing",   fee: 120000 },
  { name: "IELTS Foundation (Group)",    fee: 375000 },
  { name: "IELTS Intensive Preparation", fee: 395000 },
  { name: "Intensive Speaking",          fee: 200000 }
];


/* ───────────────────────────────────────────────────────────────────────
   4. TEACHERS AND THEIR AVAILABLE HOURS
   ───────────────────────────────────────────────────────────────────────
   "levels" controls which courses a teacher appears under. Use the id
   values from section 2 above:
       basic · preInt · int · upperInt · foundation · testPrep

   "status" is how you approve a teacher:
       "pending"  → nobody can see them, and nobody can book them.
                    Use this when their form first arrives.
       "live"     → students can see them and choose them.
   A teacher with no "status" line is treated as live.

   Notice there is no fee line for a teacher anywhere in here. That is
   deliberate. What you pay a teacher must never reach this file.

   To change someone's hours, edit the "times" text. Separate different
   blocks in the same day with a comma and the student can tick them one
   at a time: "8:00–10:00 AM, 6:00–8:00 PM".
   ─────────────────────────────────────────────────────────────────────── */

export interface Availability {
  day: string;
  times: string;
  onRequest?: boolean;
}

export interface Teacher {
  name: string;
  photo?: string;          // filled in from the database, not from this file
  qualifications?: string[];
  demoUrl?: string;
  course: 'general' | 'ielts';
  levels: string[];
  platform: string;
  blurb: string;
  status?: 'live' | 'pending';
  availability: Availability[];
}

export const teachers: Teacher[] = [
  {
    name: "Phyu Phyu Thant",
    course: "general",
    levels: ["basic", "preInt", "int"],
    platform: "Zoom",
    status: "live",
    blurb: "Builds overall proficiency across the four skills using the Headway coursebook.",
    availability: [
      { day: "Monday to Friday", times: "8:00 AM – 1:00 PM" }
    ]
  },
  {
    name: "Thin Thandar Zaw",
    course: "general",
    levels: ["basic", "preInt", "int", "upperInt"],
    platform: "Zoom",
    status: "live",
    blurb: "Headway textbook across all four skills, from Basic through to Upper-Intermediate.",
    availability: [
      { day: "Monday",    times: "8:00–10:00 AM, 6:00–8:00 PM" },
      { day: "Tuesday",   times: "8:00 AM–3:00 PM, 5:00–8:00 PM" },
      { day: "Wednesday", times: "6:00–9:00 PM" },
      { day: "Thursday",  times: "1:00–3:00 PM, 5:00–9:00 PM" },
      { day: "Friday",    times: "8:00–10:00 AM, 6:00–9:00 PM" },
      { day: "Saturday",  times: "1:00–5:00 PM" },
      { day: "Sunday",    times: "8:00 AM–5:00 PM" }
    ]
  },
  {
    name: "Hay Mar Thet",
    course: "general",
    levels: ["basic", "preInt", "int"],
    platform: "Zoom",
    status: "live",
    blurb: "Teaches every day of the week, evenings only.",
    availability: [
      { day: "Every day", times: "7:00–9:00 PM" },
      { day: "Every day", times: "9:00–11:30 PM", onRequest: true }
    ]
  },
  {
    name: "Kaung Myat Chit",
    course: "general",
    levels: ["basic", "preInt", "int", "upperInt"],
    platform: "Zoom",
    status: "live",
    blurb: "Focused on practical communication, grammar and vocabulary.",
    availability: [
      { day: "Monday & Tuesday",   times: "5:00–8:00 PM" },
      { day: "Wednesday & Sunday", times: "5:00–7:00 PM" }
    ]
  },
  {
    name: "Htoo Myat Eaindray",
    course: "ielts",
    levels: ["foundation", "testPrep"],
    platform: "Zoom",
    status: "live",
    blurb: "Foundation covers the test format with Reading and Listening practice. Preparation moves on to full review and analysis.",
    availability: [
      { day: "Mon to Wed", times: "8:00 AM–12:00 PM, 2:00–4:00 PM, 8:00–9:00 PM" },
      { day: "Thursday",   times: "8:00 AM–12:00 PM, 2:00–3:00 PM, 8:00–9:00 PM" },
      { day: "Friday",     times: "8:00–11:00 AM, 2:00–4:00 PM, 8:00–9:00 PM" },
      { day: "Sat & Sun",  times: "2:00–4:00 PM" }
    ]
  }
];


/* ───────────────────────────────────────────────────────────────────────
   5. HOW STUDENTS PAY YOU
   ───────────────────────────────────────────────────────────────────────
   These details are printed on every receipt. They are copied from your
   Jotform registration page — if you change them there, change them
   here too.
   ─────────────────────────────────────────────────────────────────────── */

export interface PaymentMethod {
  name: string;
  number: string;
}

export const payment = {
  accountName: "Su Yadanar Hnin",

  methods: [
    { name: "KBZPay",  number: "09 959 887 855" },
    { name: "AYA Pay", number: "09 959 887 855" },
    { name: "CB Pay",  number: "09 959 887 855" }
  ] as PaymentMethod[],

  // Printed on the receipt, in this order.
  steps: [
    "Transfer the amount on this receipt to the number above.",
    "Take a screenshot of the transfer.",
    "Upload the screenshot and the last 6 digits of the transaction on the registration form.",
    "We confirm your place on Telegram and send you the Zoom link."
  ],

  // One-to-one students must not pay until you have confirmed a teacher
  // and a time. Group students can pay straight away.
  oneToOneRule:
    "Do not transfer anything yet. We confirm your teacher and your times on Telegram first, then you pay.",
  groupRule:
    "You can transfer the fee now and upload your screenshot on the registration form."
};


/* ───────────────────────────────────────────────────────────────────────
   6. YOUR JOTFORM LINKS
   ───────────────────────────────────────────────────────────────────────
   The booking page fills these forms in for the student automatically.

   "prefillKeys" must match the Unique Name of each question in Jotform.
   To check one: open the form builder → click the question → the gear
   icon → Advanced → "Unique Name". If a key here is wrong Jotform
   simply ignores it and the student types that answer themselves, so
   nothing breaks either way.
   ─────────────────────────────────────────────────────────────────────── */

export const forms = {
  // Students finish here: payment screenshot and last 6 digits.
  studentRegistration: "https://form.jotform.com/262242105496050",

  // Teachers apply here. You receive it. Nothing appears on the website
  // until you add them to section 4 above.
  teacherRegistration: "https://form.jotform.com/262334880926060",

  // Optional. Make a second Jotform for teachers who already work with
  // you and want to change their hours, then paste it here. Leave "" and
  // they are sent to the registration form instead.
  teacherUpdate: "",

  // Optional. Make a short Jotform asking a student for a review and
  // paste it here. Leave "" and the "Leave a review" button stays hidden.
  studentReview: "",

  prefillKeys: {
    course: "whichCourse",
    teacher: "teacherName",
    level: "level",
    times: "chosenTimes",
    startDate: "startDate",
    notes: "yourNotes"
  }
};


/* ───────────────────────────────────────────────────────────────────────
   7. THE RECEIPT
   What is printed at the top and bottom of every enrolment receipt.
   ─────────────────────────────────────────────────────────────────────── */

export const receipt = {
  // Every reference number starts with this: EE-260914-4821
  prefix: "EE",

  issuedBy: "Effortless Education",
  issuedByLine: "Online English school · Lessons on Zoom · Yangon, Myanmar",

  // Printed small at the bottom of the receipt.
  terms: [
    "This receipt records an enrolment request. The place is held once payment is received and confirmed.",
    "One-to-one timetables are agreed with the teacher before any payment is made.",
    "Keep this reference number and quote it in any message to us."
  ]
};


/* ───────────────────────────────────────────────────────────────────────
   8. STUDENT REVIEWS
   ───────────────────────────────────────────────────────────────────────
   Add real ones here as you collect them. Ask the student's permission
   to use their first name. While the list is empty the whole reviews
   section is hidden from the website automatically.

   "approved" works like a teacher's "status": set it to false while you
   are still checking a review and nobody can see it. A review with no
   "approved" line is treated as approved.

   To add a review, copy this line inside the square brackets below and
   fill it in:

     { quote: "What the student said.", name: "Thuya", course: "IELTS Preparation", rating: 5, approved: true },

   "rating" is a number from 1 to 5.
   ─────────────────────────────────────────────────────────────────────── */

export interface Review {
  quote: string;
  name: string;
  course: string;
  rating: number;
  approved?: boolean;
}

// Shown under the reviews heading. This is taken from your Facebook page,
// which publicly shows "100% recommend (25 reviews)". Update the number as
// it changes, or set to "" to hide the line.
export const reviewsNote =
  "100% recommend — 25 reviews on our Facebook page";

export const reviews: Review[] = [
  // Copied from the one review publicly visible on your Facebook page.
  // Please confirm you are happy to republish it here — and ideally ask
  // Nyein Oo Linn first. Delete this block to remove it.
  {
    quote:
      "Tr. Naing Thura အတန်းကိုတက်လိုက်တော့ အရင်ထက်ပိုပြီး writing, listening ပိုတိုးတက်လာပါတယ်။ ကျေးဇူးအများကြီးတင်ပါတယ်။",
    name: "Nyein Oo Linn",
    course: "Recommended on Facebook · 19 June",
    rating: 5,
    approved: true
  }

  // Add the other 24 by copying the block above, comma-separated.
];


/* ───────────────────────────────────────────────────────────────────────
   9. FREQUENTLY ASKED QUESTIONS
   Edit the answers, or delete a whole { ... }, block to remove a question.
   ─────────────────────────────────────────────────────────────────────── */

export interface Faq {
  q: string;
  a: string;
}

export const faqs: Faq[] = [
  {
    q: "How long does each level take?",
    a: "Each General English level is 12 hours of one-to-one lessons, which most students complete in about four months depending on how often they study."
  },
  {
    q: "Which level should I start at?",
    a: "Tell us when you enrol and we will arrange a short placement conversation with a teacher before your first paid lesson, so you start in the right place."
  },
  {
    q: "How are lessons delivered?",
    a: "All lessons are live on Zoom. You need a phone or computer with a camera and a reasonably steady internet connection."
  },
  {
    q: "What do I need to buy?",
    a: "General English follows the Headway coursebook. We will tell you which edition and level to get once your starting level is confirmed."
  },
  {
    q: "How do I pay?",
    a: "By KBZPay, AYA Pay or CB Pay to Su Yadanar Hnin on 09 959 887 855. Your receipt shows the exact amount. Upload the screenshot and the last 6 digits of the transaction on the registration form, and we confirm your place on Telegram."
  },
  {
    q: "When do I pay for a one-to-one course?",
    a: "After we confirm your teacher and your times, never before. Book on this page, we message you on Telegram, and only then do you transfer the fee."
  },
  {
    q: "Can I change my class time later?",
    a: "Yes, as long as your teacher has a free slot. Message us and we will move you."
  }
];


/* Kept so older parts of the site keep working. Leave this alone. */
export const config = {
  currency: site.currency,
  timezone: "Asia/Yangon"
};
