import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  oneToOneLevels as fileLevels,
  LevelInfo,
  teachers as fileTeachers,
  groupCourses as fileGroupCourses,
  reviews as fileReviews,
  Teacher,
} from './data';
import {
  GroupClassRow, VideoCourseRow, isLive, loadLevels, loadPublicContent, loadVideoCourses,
  ReviewRow,
} from './supabase';

/* Everything the public pages show, from the database when it is
   connected and from src/data.ts when it is not. Nothing on the site
   breaks if Supabase is down or not set up: it falls back. */

export interface PublicReview {
  quote: string;
  name: string;
  course: string;
  rating: number;
}

interface Content {
  loading: boolean;
  fromDatabase: boolean;
  teachers: Teacher[];
  groupClasses: GroupClassRow[];
  months: string[];
  levels: LevelInfo[];
  reviews: PublicReview[];
  videoCourses: VideoCourseRow[];
}

export const monthLabel = (month: string) => {
  const [y, m] = month.split('-').map(Number);
  if (!y || !m) return month;
  return new Date(y, m - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
};

export const thisMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

/** Group courses from src/data.ts, dressed up as month-less rows so the
 *  same component can render either source. */
const fallbackGroupClasses = (): GroupClassRow[] =>
  fileGroupCourses.map((c, i) => ({
    id: `file-${i}`,
    month: '',
    name: c.name,
    fee: c.fee,
    schedule: '',
    start_date: null,
    seats: '',
    visible: true,
    sort_order: i,
  }));

const fallback: Content = {
  loading: false,
  fromDatabase: false,
  teachers: fileTeachers.filter(t => t.status !== 'pending'),
  groupClasses: fallbackGroupClasses(),
  months: [],
  levels: fileLevels,
  reviews: fileReviews.filter(r => r.approved !== false),
  videoCourses: [],
};

const ContentContext = createContext<Content>(fallback);

export const useContent = () => useContext(ContentContext);

export function ContentProvider({ children }: { children: React.ReactNode }) {
  const [content, setContent] = useState<Content>({ ...fallback, loading: isLive });

  useEffect(() => {
    if (!isLive) return;
    let cancelled = false;

    Promise.all([loadPublicContent(), loadVideoCourses(), loadLevels()])
      .then(([data, videos, levels]) => {
        if (cancelled) return;

        const fromDb: LevelInfo[] | null = levels && levels.map(r => ({
          id: r.id, course: r.course, name: r.name, fee: r.fee,
          hours: r.hours, description: r.description || undefined,
        }));

        if (!data) {
          setContent({ ...fallback, videoCourses: videos, levels: fromDb ?? fallback.levels });
          return;
        }

        const months: string[] =
          Array.from(new Set(data.groupClasses.map(g => g.month))).sort();
        setContent({
          videoCourses: videos,
          loading: false,
          fromDatabase: true,
          levels: fromDb ?? fallback.levels,
          teachers: data.teachers.length ? data.teachers : fallback.teachers,
          groupClasses: data.groupClasses.length ? data.groupClasses : fallback.groupClasses,
          months: data.groupClasses.length ? months : [],
          reviews: (data.reviews as ReviewRow[]).map(r => ({
            quote: r.quote, name: r.name, course: r.course, rating: r.rating,
          })),
        });
      });

    return () => { cancelled = true; };
  }, []);

  return <ContentContext.Provider value={content}>{children}</ContentContext.Provider>;
}
