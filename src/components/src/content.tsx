import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  teachers as fileTeachers,
  groupCourses as fileGroupCourses,
  reviews as fileReviews,
  Teacher,
} from './data';
import { GroupClassRow, isLive, loadPublicContent, ReviewRow } from './supabase';

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
  reviews: PublicReview[];
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
  reviews: fileReviews.filter(r => r.approved !== false),
};

const ContentContext = createContext<Content>(fallback);

export const useContent = () => useContext(ContentContext);

export function ContentProvider({ children }: { children: React.ReactNode }) {
  const [content, setContent] = useState<Content>({ ...fallback, loading: isLive });

  useEffect(() => {
    if (!isLive) return;
    let cancelled = false;

    loadPublicContent().then(data => {
      if (cancelled) return;
      if (!data) {
        setContent({ ...fallback });   // database unreachable — show the file
        return;
      }

      const months = Array.from(new Set(data.groupClasses.map(g => g.month))).sort();
      setContent({
        loading: false,
        fromDatabase: true,
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
