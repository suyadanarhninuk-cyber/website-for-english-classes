import React from 'react';
import { motion } from 'motion/react';
import { PlayCircle, Clock } from 'lucide-react';
import { site } from '../data';
import { useContent } from '../content';

/* Your recorded courses. Add and price them in the admin page, under
   Video courses. The section hides itself while there are none. */

export default function VideoCourses() {
  const { videoCourses } = useContent();
  if (videoCourses.length === 0) return null;

  return (
    <section id="video" className="py-24 bg-gray-50 scroll-mt-20 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 tracking-tight">
            Learn at your own pace
          </h2>
          <p className="text-lg text-gray-600">
            Recorded courses you can start today and watch whenever suits you. Pay once and
            the lessons are yours.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videoCourses.map((c, i) => (
            <motion.div key={c.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col">
              <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center mb-4">
                <PlayCircle className="w-6 h-6" />
              </div>

              <h3 className="text-lg font-bold text-gray-900">{c.title}</h3>
              {c.level && <p className="text-xs text-gray-500 mt-1">{c.level}</p>}
              {c.summary && (
                <p className="text-sm text-gray-600 leading-relaxed mt-3 flex-grow">{c.summary}</p>
              )}

              {c.lessons && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-4">
                  <Clock className="w-3.5 h-3.5" /> {c.lessons}
                </div>
              )}

              <div className="flex items-center justify-between gap-4 mt-5 pt-4 border-t border-gray-100">
                <span className="text-xl font-bold text-brand-600">
                  {c.fee.toLocaleString()} {site.currencySymbol}
                </span>
                <a href="#booking"
                  className="px-4 py-2 rounded-lg bg-brand-50 text-brand-700 text-sm font-semibold hover:bg-brand-100 transition-colors">
                  Get this course
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
