import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Star, Globe, Clock, BookOpen } from 'lucide-react';
import { site } from '../data';

export default function Hero() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden no-print">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-50 via-white to-white"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-50 text-brand-700 text-sm font-medium mb-8 border border-brand-100">
              <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></span>
              {site.heroBadge}
            </span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-6xl font-bold text-gray-900 tracking-tight mb-8 leading-[1.15]"
          >
            {site.heroHeadline} <span className="text-brand-600">{site.heroHighlight}</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl text-gray-600 mb-10 leading-relaxed max-w-2xl mx-auto"
          >
            {site.heroSubtitle}
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <a 
              href="#booking"
              className="w-full sm:w-auto px-8 py-4 bg-brand-600 text-white rounded-full font-medium text-lg hover:bg-brand-700 transition-all shadow-lg shadow-brand-200 flex items-center justify-center gap-2 group"
            >
              Book your class
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <a 
              href="#services"
              className="w-full sm:w-auto px-8 py-4 bg-white text-gray-700 rounded-full font-medium text-lg hover:bg-gray-50 transition-all shadow-sm border border-gray-200"
            >
              View pricing
            </a>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-20 pt-10 border-t border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            <div className="flex flex-col items-center justify-center text-center">
              <Globe className="w-8 h-8 text-brand-500 mb-3" />
              <div className="text-sm text-gray-900 font-bold">100% Online</div>
              <div className="text-xs text-gray-500 mt-1">Learn via Zoom</div>
            </div>
            <div className="flex flex-col items-center justify-center text-center">
              <BookOpen className="w-8 h-8 text-brand-500 mb-3" />
              <div className="text-sm text-gray-900 font-bold">Comprehensive</div>
              <div className="text-xs text-gray-500 mt-1">General & IELTS</div>
            </div>
            <div className="flex flex-col items-center justify-center text-center">
              <div className="flex items-center gap-1 text-amber-400 mb-3 h-8">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-5 h-5 fill-current" />
                ))}
              </div>
              <div className="text-sm text-gray-900 font-bold">Expert Teachers</div>
              <div className="text-xs text-gray-500 mt-1">Dedicated feedback</div>
            </div>
            <div className="flex flex-col items-center justify-center text-center">
              <Clock className="w-8 h-8 text-brand-500 mb-3" />
              <div className="text-sm text-gray-900 font-bold">Flexible Hours</div>
              <div className="text-xs text-gray-500 mt-1">{site.timezoneLabel}</div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
