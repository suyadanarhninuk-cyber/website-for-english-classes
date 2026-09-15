import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Star, Quote, CheckCircle2 } from 'lucide-react';
import { reviewsNote, forms, site } from '../data';
import { useContent } from '../content';
import { isLive, sendReview } from '../supabase';

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function ReviewForm() {
  const [open, setOpen] = useState(false);
  const [quote, setQuote] = useState('');
  const [name, setName] = useState('');
  const [course, setCourse] = useState('');
  const [rating, setRating] = useState(5);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const field =
    'w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-600 focus:border-transparent outline-none';

  if (!isLive) {
    if (!forms.studentReview) return null;
    return (
      <div className="text-center mt-12">
        <a href={forms.studentReview} target="_blank" rel="noopener noreferrer"
          className="inline-block px-6 py-3 rounded-xl border border-gray-300 font-semibold text-gray-800 hover:border-brand-400 transition-colors">
          Studied with us? Leave a review
        </a>
      </div>
    );
  }

  if (sent) {
    return (
      <div className="max-w-lg mx-auto mt-12 p-6 rounded-2xl bg-green-50 border border-green-200 text-center">
        <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-3" />
        <p className="text-sm text-green-900">
          Thank you. We read every review before it goes on the site.
        </p>
      </div>
    );
  }

  if (!open) {
    return (
      <div className="text-center mt-12">
        <button type="button" onClick={() => setOpen(true)}
          className="px-6 py-3 rounded-xl border border-gray-300 font-semibold text-gray-800 hover:border-brand-400 transition-colors">
          Studied with us? Leave a review
        </button>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError('');
    const res = await sendReview({ quote: quote.trim(), name: name.trim(), course: course.trim(), rating });
    setSending(false);
    if (res.ok) setSent(true); else setError(res.message);
  };

  return (
    <form onSubmit={submit} className="max-w-lg mx-auto mt-12 p-6 rounded-2xl border border-gray-200 space-y-4">
      <div>
        <label htmlFor="r-quote" className="block text-sm font-medium text-gray-700 mb-1">Your review</label>
        <textarea id="r-quote" rows={4} required minLength={10} value={quote}
          onChange={e => setQuote(e.target.value)} className={`${field} resize-none`} />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="r-name" className="block text-sm font-medium text-gray-700 mb-1">Your first name</label>
          <input id="r-name" required value={name} onChange={e => setName(e.target.value)} className={field} />
        </div>
        <div>
          <label htmlFor="r-course" className="block text-sm font-medium text-gray-700 mb-1">Course you took</label>
          <input id="r-course" value={course} onChange={e => setCourse(e.target.value)} className={field} />
        </div>
      </div>
      <div>
        <span className="block text-sm font-medium text-gray-700 mb-1">Rating</span>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map(i => (
            <button key={i} type="button" onClick={() => setRating(i)} aria-label={`${i} out of 5`}>
              <Star className={`w-7 h-7 ${i <= rating ? 'fill-current text-amber-400' : 'text-gray-300'}`} />
            </button>
          ))}
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={sending}
        className="w-full py-3 bg-brand-600 text-white rounded-xl font-semibold hover:bg-brand-700 disabled:opacity-60 transition-colors">
        {sending ? 'Sending…' : 'Send review'}
      </button>
      <p className="text-xs text-center text-gray-500">
        We check every review before it appears on the website.
      </p>
    </form>
  );
}

export default function Testimonials() {
  const { reviews } = useContent();

  // Nothing approved and no way to collect one? Hide the section entirely
  // rather than show invented reviews.
  if (reviews.length === 0 && !isLive && !forms.studentReview) return null;

  return (
    <section id="reviews" className="scroll-mt-20 py-24 bg-white relative no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 tracking-tight">
            What our students say
          </h2>
          <p className="text-lg text-gray-600">
            Real feedback from students who have studied with {site.shortName}.
          </p>
          {reviewsNote && reviews.length > 0 && (
            <p className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-50 text-brand-700 text-sm font-medium border border-brand-100">
              {reviewsNote}
            </p>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {reviews.map((review, index) => (
            <motion.figure
              key={index}
              initial={{ opacity: 0, scale: 0.97 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              className="bg-brand-50/50 rounded-3xl p-8 relative flex flex-col"
            >
              <Quote className="absolute top-6 right-6 w-8 h-8 text-brand-200" aria-hidden="true" />

              <div className="flex gap-1 text-amber-400 mb-6" aria-label={`${review.rating} out of 5`}>
                {[1, 2, 3, 4, 5].map(i => (
                  <Star key={i} className={`w-5 h-5 ${i <= review.rating ? 'fill-current' : 'text-brand-200'}`} />
                ))}
              </div>

              <blockquote className="text-gray-800 mb-8 font-medium leading-relaxed">
                “{review.quote}”
              </blockquote>

              <figcaption className="flex items-center gap-4 mt-auto">
                <div className="w-12 h-12 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold shrink-0">
                  {initials(review.name)}
                </div>
                <div>
                  <div className="font-bold text-gray-900">{review.name}</div>
                  <div className="text-sm text-brand-600 font-medium">{review.course}</div>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </div>

        <ReviewForm />
      </div>
    </section>
  );
}
