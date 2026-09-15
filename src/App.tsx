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
import ReceiptPage from './components/ReceiptPage';
import { ContentProvider } from './content';

/* Three addresses:
     yoursite.com            the website
     yoursite.com/#admin     your admin page
     yoursite.com/#receipt/… a student's private booking link          */

function useHashRoute() {
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const onHash = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  return hash;
}

export default function App() {
  const hash = useHashRoute();

  if (hash.startsWith('#admin')) return <Admin />;

  if (hash.startsWith('#receipt/')) {
    const token = decodeURIComponent(hash.slice('#receipt/'.length));
    if (token) return <ReceiptPage token={token} />;
  }

  return (
    <ContentProvider>
      <div className="min-h-screen bg-white selection:bg-brand-100 selection:text-brand-900 font-sans">
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
