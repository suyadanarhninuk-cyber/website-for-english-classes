import React from 'react';
import { CalendarClock, Video } from 'lucide-react';
import { oneToOneLevels, site } from '../data';
import { useContent } from '../content';

const levelName = (id: string) =>
  oneToOneLevels.find(l => l.id === id)?.name ?? id;

function bookWith(name: string) {
  window.dispatchEvent(new CustomEvent('ee:select-teacher', { detail: { name } }));
  document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' });
}

export default function Teachers() {
  const { teachers } = useContent();
  if (teachers.length === 0) return null;

  return (
    <section id="teachers" className="scroll-mt-20 py-24 bg-white no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 tracking-tight">
            Choose your own teacher
          </h2>
          <p className="text-lg text-gray-600">
            Every one-to-one lesson is live on Zoom. Pick the teacher whose hours fit your week —
            all times are {site.timezoneLabel}.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teachers.map(t => (
            <div key={t.name} className="rounded-2xl border border-gray-200 p-6 flex flex-col">
              <h3 className="text-lg font-bold text-gray-900">{t.name}</h3>

              {t.levels.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {t.levels.map(id => (
                    <span key={id} className="text-xs font-medium px-2 py-1 rounded-md bg-brand-50 text-brand-700">
                      {levelName(id)}
                    </span>
                  ))}
                </div>
              )}

              {t.blurb && <p className="text-sm text-gray-600 leading-relaxed mt-4">{t.blurb}</p>}

              <div className="mt-5 pt-4 border-t border-gray-100 space-y-2 text-sm text-gray-600 flex-grow">
                <div className="flex items-center gap-2 text-gray-500">
                  <CalendarClock className="w-4 h-4" />
                  <span className="font-medium text-gray-900">Available</span>
                </div>
                <ul className="space-y-1">
                  {t.availability.map((a, i) => (
                    <li key={`${a.day}-${i}`} className="flex gap-2">
                      <span className="font-medium text-gray-900 shrink-0">{a.day}</span>
                      <span>
                        {a.times}
                        {a.onRequest && <span className="text-amber-600 italic"> (on request)</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-500 mt-4">
                <Video className="w-3.5 h-3.5" /> {t.platform}
              </div>

              <button type="button" onClick={() => bookWith(t.name)}
                className="mt-4 w-full py-3 bg-brand-50 text-brand-700 font-semibold rounded-xl hover:bg-brand-100 transition-colors">
                Book with {t.name.split(' ')[0]}
              </button>
            </div>
          ))}
        </div>

        {/* Teachers browsing the site find their way in from here. */}
        <a href="#teach"
          className="mt-12 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center px-6 py-4 rounded-2xl border border-brand-200 bg-brand-50 hover:bg-brand-100 transition-colors">
          <span className="font-semibold text-brand-700">Are you a teacher?</span>
          <span className="text-sm text-gray-600">
            Tell us your subjects and your free hours — we will match you with students.
          </span>
          <span className="font-semibold text-brand-700 whitespace-nowrap">Apply here →</span>
        </a>
      </div>
    </section>
  );
}
