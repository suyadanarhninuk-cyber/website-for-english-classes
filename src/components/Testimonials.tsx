import React from 'react';
import { motion } from 'motion/react';
import { Star, Quote } from 'lucide-react';
import { reviews, reviewsNote, forms, site } from '../data';

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();
}

/* A review only appears once you have approved it in src/data.ts. */
const approved = reviews.filter(r => r.approved !== false);

export default function Testimonials() {
  // No approved reviews yet? Hide the section completely rather than show
  // invented ones. Add reviews in src/data.ts and it appears by itself.
  if (approved.length === 0) return null;

  return (
    <section id="reviews" className="py-24 bg-white relative no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 tracking-tight">
            What our students say
          </h2>
          <p className="text-lg text-gray-600">
            Real feedback from students who have studied with {site.shortName}.
          </p>
          {reviewsNote && (
            <p className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-sm font-medium border border-indigo-100">
              {reviewsNote}
            </p>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {approved.map((review, index) => (
            <motion.figure
              key={index}
              initial={{ opacity: 0, scale: 0.97 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              className="bg-indigo-50/50 rounded-3xl p-8 relative flex flex-col"
            >
              <Quote className="absolute top-6 right-6 w-8 h-8 text-indigo-200" aria-hidden="true" />

              <div
                className="flex gap-1 text-amber-400 mb-6"
                aria-label={`${review.rating} out of 5`}
              >
                {[1, 2, 3, 4, 5].map(i => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${i <= review.rating ? 'fill-current' : 'text-indigo-200'}`}
                  />
                ))}
              </div>

              <blockquote className="text-gray-800 mb-8 font-medium leading-relaxed">
                “{review.quote}”
              </blockquote>

              <figcaption className="flex items-center gap-4 mt-auto">
                <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0">
                  {initials(review.name)}
                </div>
                <div>
                  <div className="font-bold text-gray-900">{review.name}</div>
                  <div className="text-sm text-indigo-600 font-medium">{review.course}</div>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </div>

        {forms.studentReview && (
          <div className="text-center mt-12">
            <a href={forms.studentReview} target="_blank" rel="noopener noreferrer"
              className="inline-block px-6 py-3 rounded-xl border border-gray-300 font-semibold text-gray-800 hover:border-indigo-400 transition-colors">
              Studied with us? Leave a review
            </a>
            <p className="text-xs text-gray-500 mt-3">We read every review before it appears here.</p>
          </div>
        )}
      </div>
    </section>
  );
}
