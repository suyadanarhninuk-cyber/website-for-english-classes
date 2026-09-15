/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Services from './components/Services';
import Teachers from './components/Teachers';
import Testimonials from './components/Testimonials';
import Faq from './components/Faq';
import BookingSection from './components/BookingSection';
import TeacherPortal from './components/TeacherPortal';
import Footer from './components/Footer';
import Admin from './components/Admin';
import { ContentProvider } from './content';

/* Your admin page is at  yoursite.com/#admin
   Everything else is the public website. */

function useIsAdminRoute() {
  const [isAdmin, setIsAdmin] = useState(window.location.hash.startsWith('#admin'));
  useEffect(() => {
    const onHash = () => setIsAdmin(window.location.hash.startsWith('#admin'));
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  return isAdmin;
}

export default function App() {
  const isAdmin = useIsAdminRoute();

  if (isAdmin) return <Admin />;

  return (
    <ContentProvider>
      <div className="min-h-screen bg-white selection:bg-indigo-100 selection:text-indigo-900 font-sans">
        <Header />
        <main>
          <Hero />
          <Services />
          <Teachers />
          <Testimonials />
          <Faq />
          <BookingSection />
          <TeacherPortal />
        </main>
        <Footer />
      </div>
    </ContentProvider>
  );
}
