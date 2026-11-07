import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { posterUrl } from '../supabase';
import { useContent, monthLabel, thisMonth } from '../content';
import { money } from '../contact';

/* The posters you already make for your classes, shown on the website.
   You upload them in the admin page — Classes, Courses and Video courses
   each have a Poster button. A class with no poster simply does not
   appear here, and if nothing has a poster the whole section hides
   itself, so the home page never shows an empty gap. */

/* ── the full-size view ──────────────────────────────────────────────
   Tapping a poster opens it over the page. Escape, the X, or a tap
   anywhere outside closes it again. */
export function PosterLightbox({
  src, caption, onClose,
}: { src: string; caption?: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={caption ? `Poster: ${caption}` : 'Poster'}
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 no-print"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center"
      >
        <X className="w-5 h-5" />
      </button>

      <figure onClick={e => e.stopPropagation()} className="max-h-full flex flex-col items-center">
        <img
          src={src}
          alt={caption ?? 'Class poster'}
          className="max-h-[85vh] max-w-full w-auto rounded-xl shadow-2xl object-contain"
        />
        {caption && (
          <figcaption className="text-white/80 text-sm mt-3 text-center">{caption}</figcaption>
        )}
      </figure>
    </div>
  );
}

/* ── a small poster beside something ─────────────────────────────────
   Used in the booking list, where the poster sits next to the class you
   are choosing. Deliberately its own button so it can be tapped without
   also picking the class. */
export function PosterThumb({
  path, caption, onOpen, className = 'w-14',
}: { path: string; caption?: string; onOpen: (src: string, caption?: string) => void; className?: string }) {
  const src = posterUrl(path);
  if (!src) return null;
  return (
    <button
      type="button"
      onClick={() => onOpen(src, caption)}
      aria-label={caption ? `See the poster for ${caption}` : 'See the poster'}
      className={`${className} shrink-0 self-stretch rounded-xl overflow-hidden border border-gray-200 bg-gray-50 hover:border-brand-400 transition-colors`}
    >
      <img src={src} alt="" loading="lazy" className="w-full h-full object-cover" />
    </button>
  );
}

interface BoardItem {
  key: string;
  path: string;
  title: string;
  line: string;
  fee: number;
}

export default function PosterBoard() {
  const { groupClasses, levels, videoCourses } = useContent();
  const [open, setOpen] = useState<{ src: string; caption?: string } | null>(null);

  const items = useMemo<BoardItem[]>(() => {
    const now = thisMonth();

    /* Past months are dropped so an old poster cannot sit on the home
       page advertising a class that already finished. A class with no
       month set is treated as always current. */
    const classes: BoardItem[] = groupClasses
      .filter(g => g.poster && g.visible && (!g.month || g.month >= now))
      .map(g => ({
        key: `g-${g.id}`,
        path: g.poster,
        title: g.name,
        line: [g.month ? monthLabel(g.month) : '', g.schedule].filter(Boolean).join(' · '),
        fee: g.fee,
      }));

    const one: BoardItem[] = levels
      .filter(l => l.poster)
      .map(l => ({
        key: `l-${l.id}`,
        path: l.poster as string,
        title: l.name,
        line: l.hours ? `One-to-one · ${l.hours} hours` : 'One-to-one',
        fee: l.fee,
      }));

    const video: BoardItem[] = videoCourses
      .filter(v => v.poster && v.visible)
      .map(v => ({
        key: `v-${v.id}`,
        path: v.poster,
        title: v.title,
        line: [v.level, v.lessons].filter(Boolean).join(' · ') || 'Recorded course',
        fee: v.fee,
      }));

    return [...classes, ...one, ...video];
  }, [groupClasses, levels, videoCourses]);

  if (items.length === 0) return null;

  return (
    <section id="posters" className="py-24 bg-white scroll-mt-20 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 tracking-tight">
            What&rsquo;s on at the moment
          </h2>
          <p className="text-lg text-gray-600">
            Tap any poster to see it in full.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6">
          {items.map((it, i) => (
            <motion.div
              key={it.key}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: Math.min(i, 7) * 0.05 }}
              className="group"
            >
              <button
                type="button"
                onClick={() => setOpen({ src: posterUrl(it.path), caption: it.title })}
                aria-label={`See the poster for ${it.title}`}
                className="block w-full aspect-[4/5] rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 hover:border-brand-400 hover:shadow-lg transition-all"
              >
                <img
                  src={posterUrl(it.path)}
                  alt={`Poster for ${it.title}`}
                  loading="lazy"
                  className="w-full h-full object-contain group-hover:scale-[1.03] transition-transform duration-300"
                />
              </button>

              <div className="mt-3">
                <h3 className="font-semibold text-gray-900 leading-snug">{it.title}</h3>
                <p className="text-xs text-gray-500 mt-0.5 min-h-[1rem]">{it.line}</p>
                <div className="flex items-center justify-between gap-3 mt-2">
                  <span className="font-bold text-brand-600 text-sm">{money(it.fee)}</span>
                  <a
                    href="#booking"
                    className="text-sm font-semibold text-brand-700 hover:text-brand-800"
                  >
                    Enrol &rarr;
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {open && (
        <PosterLightbox src={open.src} caption={open.caption} onClose={() => setOpen(null)} />
      )}
    </section>
  );
}
