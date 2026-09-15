import React from 'react';
import { BookOpen } from 'lucide-react';
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
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
            <BookOpen className="w-6 h-6" />
          </div>
          <span className="text-xl font-bold text-gray-900 tracking-tight">{site.name}</span>
        </motion.div>
        
        <nav className="hidden md:flex items-center gap-8">
          <a href="#services" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Courses & Pricing</a>
          <a href="#teachers" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Teachers</a>
          <a href="#faq" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">FAQ</a>
          <a href="#booking" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Book a Class</a>
        </nav>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4"
        >
          <a 
            href="#booking" 
            className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-full hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200"
          >
            Enrol now
          </a>
        </motion.div>
      </div>
    </header>
  );
}
