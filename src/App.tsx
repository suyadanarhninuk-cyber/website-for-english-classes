/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Services from './components/Services';
import Teachers from './components/Teachers';
import Testimonials from './components/Testimonials';
import Faq from './components/Faq';
import BookingSection from './components/BookingSection';
import TeacherPortal from './components/TeacherPortal';
import Footer from './components/Footer';

export default function App() {
  return (
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
  );
}
