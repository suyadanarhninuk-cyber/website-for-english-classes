import React, { useMemo, useState } from 'react';
import { CalendarClock, PlayCircle, Search, Video } from 'lucide-react';
import { oneToOneLevels, site } from '../data';
import { useContent } from '../content';
import { teacherPhotoUrl } from '../supabase';

const initials = (name: string) =>
  name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();

const levelName = (id: string) =>
  oneToOneLevels.find(l => l.id === id)?.name ?? id;

function bookWith(name: string) {
  window.dispatchEvent(new CustomEvent('ee:select-teacher', { detail: { name } }));
  document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' });
}

export default function Teachers() {
  const { teachers } = useContent();

  const [who, setWho] = useState('');     // a teacher's name
  const [what, setWhat] = useState('');   // a level or course id

  /* Only offer levels somebody actually teaches, so the list can never
     lead a student to an empty result. */
  const levelsOffered = useMemo(() => {
    const ids = new Set<string>();
    teachers.forEach(t => t.levels.forEach(l => ids.add(l)));
    return oneToOneLevels.filter(l => ids.has(l.id));
  }, [teachers]);

  const shown = useMemo(() => teachers.filter(t =>
    (!who || t.name === who) && (!what || t.levels.includes(what))
  ), [teachers, who, what]);

  if (teachers.length === 0) return null;

  const select =
    'px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-800 outline-none focus:ring-2 focus:ring-brand-600';

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

        <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
          <span className="flex items-center gap-2 text-sm text-gray-500">
            <Search className="w-4 h-4" /> Find a teacher
          </span>

          <select aria-label="Teacher" value={who} onChange={e => setWho(e.target.value)} className={select}>
            <option value="">Any teacher</option>
            {teachers.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
          </select>

          <select aria-label="Course" value={what} onChange={e => setWhat(e.target.value)} className={select}>
            <option value="">Any course</option>
            {levelsOffered.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>

          {(who || what) && (
            <button type="button" onClick={() => { setWho(''); setWhat(''); }}
              className="text-sm font-semibold text-brand-700 hover:text-brand-800">
              Clear
            </button>
          )}
        </div>

        {shown.length === 0 && (
          <p className="text-center text-gray-600 py-10">
            Nobody teaches that combination at the moment. Clear the boxes above to see everyone,
            or message us and we will find someone for you.
          </p>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shown.map(t => (
            <div key={t.name} className="rounded-2xl border border-gray-200 p-6 flex flex-col">
              <div className="flex items-center gap-4">
                {t.photo ? (
                  <img src={teacherPhotoUrl(t.photo)} alt={t.name}
                    className="w-16 h-16 rounded-full object-cover border border-gray-200 shrink-0" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-lg shrink-0">
                    {initials(t.name)}
                  </div>
                )}
                <h3 className="text-lg font-bold text-gray-900">{t.name}</h3>
              </div>

              {t.levels.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {t.levels.map(id => (
                    <span key={id} className="text-xs font-medium px-2 py-1 rounded-md bg-brand-50 text-brand-700">
                      {levelName(id)}
                    </span>
                  ))}
                </div>
              )}

              {(t.qualifications?.length ?? 0) > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {t.qualifications!.map(q => (
                    <span key={q} className="text-xs font-semibold px-2 py-1 rounded-md bg-gold-100 text-brand-800">
                      {q}
                    </span>
                  ))}
                </div>
              )}

              {t.blurb && <p className="text-sm text-gray-600 leading-relaxed mt-4">{t.blurb}</p>}

              {t.demoUrl && (
                <a href={t.demoUrl} target="_blank" rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:text-brand-800">
                  <PlayCircle className="w-4 h-4" /> Watch a demo lesson
                </a>
              )}

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
