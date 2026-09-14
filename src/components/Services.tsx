import React from 'react';
import { motion } from 'motion/react';
import { Users, User, BookOpen, Clock, Check } from 'lucide-react';
import { oneToOneLevels, groupCourses, site, generalEnglishNote, payment } from '../data';

export default function Services() {
  const generalEnglish = oneToOneLevels.filter(l => l.course === 'general');
  const ieltsOneToOne = oneToOneLevels.filter(l => l.course === 'ielts');

  return (
    <section id="services" className="py-24 bg-gray-50 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 tracking-tight">Clear & Transparent Pricing</h2>
          <p className="text-lg text-gray-600">Choose between personalized 1-on-1 sessions or interactive group courses. All prices in {site.currency}.</p>
          <p className="text-sm text-gray-500 mt-3">
            Pay by {payment.methods.map(m => m.name).join(', ')} to {payment.accountName}. One-to-one
            students pay only after we confirm the teacher and the times.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* General English (1-on-1) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col h-full"
          >
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
              <User className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">General English</h3>
            <p className="text-gray-500 mb-4">One-to-One interactive sessions</p>
            
            <div className="bg-amber-50 border border-amber-100 text-amber-800 text-sm p-3 rounded-lg mb-6 font-medium">
              {generalEnglishNote.burmese}<br/>
              <span className="text-amber-700/80 text-xs mt-1 block">{generalEnglishNote.english}</span>
            </div>

            <div className="space-y-4 flex-grow mb-8">
              {generalEnglish.map(level => (
                <div key={level.id} className="flex justify-between items-center border-b border-gray-50 pb-3 last:border-0">
                  <div>
                    <div className="font-semibold text-gray-900">{level.name}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" /> {level.hours} hours
                    </div>
                  </div>
                  <div className="font-bold text-indigo-600">
                    {level.fee.toLocaleString()} {site.currencySymbol}
                  </div>
                </div>
              ))}
            </div>
            
            <a href="#booking" className="w-full block text-center py-3 bg-indigo-50 text-indigo-700 font-semibold rounded-xl hover:bg-indigo-100 transition-colors">
              Book General English
            </a>
          </motion.div>

          {/* IELTS Preparation (1-on-1) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white rounded-3xl p-8 shadow-xl border-2 border-indigo-600 flex flex-col h-full relative"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
              Specialized
            </div>
            <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center mb-6">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">IELTS Preparation</h3>
            <p className="text-gray-500 mb-6">Targeted One-to-One exam coaching</p>

            <div className="space-y-6 flex-grow mb-8">
              {ieltsOneToOne.map(level => (
                <div key={level.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-bold text-gray-900">{level.name}</div>
                    <div className="font-bold text-indigo-600">{level.fee.toLocaleString()} {site.currencySymbol}</div>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{level.description}</p>
                </div>
              ))}
            </div>
            
            <a href="#booking" className="w-full block text-center py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors">
              Book IELTS 1-on-1
            </a>
          </motion.div>

          {/* Group Courses */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col h-full"
          >
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Group Courses</h3>
            <p className="text-gray-500 mb-6">Learn together in an interactive setting</p>

            <div className="space-y-3 flex-grow mb-8">
              {groupCourses.map((course, idx) => (
                <div key={idx} className="flex justify-between items-center group">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-gray-700 text-sm font-medium">{course.name}</span>
                  </div>
                  <div className="font-bold text-gray-900 text-sm">
                    {course.fee.toLocaleString()} Ks
                  </div>
                </div>
              ))}
            </div>
            
            <a href="#booking" className="w-full block text-center py-3 bg-gray-50 text-gray-900 font-semibold rounded-xl hover:bg-gray-100 border border-gray-200 transition-colors">
              Join a Group Course
            </a>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
