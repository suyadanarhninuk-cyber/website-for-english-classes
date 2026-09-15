import React from 'react';
import { motion } from 'motion/react';
import { site } from '../data';

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 border-b border-gray-100 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3 cursor-pointer"
        >
          <img src={site.logoMark} alt="" className="w-11 h-11 rounded-xl object-cover shadow-sm" />
          <span className="text-xl font-bold text-gray-900 tracking-tight">{site.name}</span>
        </motion.div>
        
        <nav className="hidden md:flex items-center gap-8">
          <a href="#services" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Courses & Pricing</a>
          <a href="#teachers" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Teachers</a>
          <a href="#faq" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">FAQ</a>
          <a href="#teach" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Teach with us</a>
          <a href="#booking" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Book a Class</a>
        </nav>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4"
        >
          <a 
            href="#booking" 
            className="px-5 py-2.5 bg-brand-600 text-white text-sm font-medium rounded-full hover:bg-brand-700 transition-colors shadow-sm shadow-brand-200"
          >
            Enrol now
          </a>
        </motion.div>
      </div>
    </header>
  );
}
