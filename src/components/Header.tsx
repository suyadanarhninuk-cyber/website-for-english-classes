import React from 'react';
import { motion } from 'motion/react';
import { site } from '../data';

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 bg-white/85 backdrop-blur-md z-50 border-b border-gray-100 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        <motion.a
          href="#"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3 shrink-0"
        >
          <img src={site.logoMark} alt="" className="w-11 h-11 rounded-xl object-cover shadow-sm" />
          <span className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight hidden xs:block">
            {site.name}
          </span>
        </motion.a>

        <nav className="hidden lg:flex items-center gap-8">
          <a href="#services" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Courses &amp; Pricing</a>
          <a href="#teachers" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Teachers</a>
          <a href="#faq" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">FAQ</a>
        </nav>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 sm:gap-3 shrink-0"
        >
          {/* For teachers — deliberately the same size as Enrol now, so
              anyone who teaches spots it straight away. */}
          <a
            href="#teach"
            className="px-4 sm:px-5 py-2.5 border-2 border-brand-600 text-brand-700 text-sm font-semibold rounded-full hover:bg-brand-50 transition-colors whitespace-nowrap"
          >
            <span className="hidden lg:inline">Want to teach with us?</span>
            <span className="lg:hidden">Teach</span>
          </a>

          {/* Returning students — their discount lives behind this. */}
          <a
            href="#returning"
            className="px-4 sm:px-5 py-2.5 bg-gold-500 text-brand-800 text-sm font-semibold rounded-full hover:bg-gold-400 transition-colors whitespace-nowrap"
          >
            <span className="hidden sm:inline">Studied with us before?</span>
            <span className="sm:hidden">5–10% off</span>
          </a>

          <a
            href="#booking"
            className="px-4 sm:px-5 py-2.5 bg-brand-600 text-white text-sm font-semibold rounded-full hover:bg-brand-700 transition-colors shadow-sm whitespace-nowrap"
          >
            Enrol now
          </a>
        </motion.div>
      </div>
    </header>
  );
}
