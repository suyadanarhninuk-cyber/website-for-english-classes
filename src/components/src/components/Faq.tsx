import React from 'react';
import { faqs } from '../data';
import { Plus, Minus } from 'lucide-react';

export default function Faq() {
  if (faqs.length === 0) return null;

  return (
    <section id="faq" className="py-24 bg-gray-50 no-print">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 tracking-tight">
            Before you enrol
          </h2>
          <p className="text-lg text-gray-600">
            The questions we are asked most often.
          </p>
        </div>

        <div className="divide-y divide-gray-200 border-y border-gray-200">
          {faqs.map((item, i) => (
            <details key={i} className="group py-1" open={i === 0}>
              <summary className="flex items-center justify-between gap-6 cursor-pointer list-none py-5 font-semibold text-gray-900 marker:hidden [&::-webkit-details-marker]:hidden">
                <span>{item.q}</span>
                <span className="shrink-0 text-indigo-600">
                  <Plus className="w-5 h-5 group-open:hidden" />
                  <Minus className="w-5 h-5 hidden group-open:block" />
                </span>
              </summary>
              <div className="pb-6 pr-10 text-gray-600 leading-relaxed">{item.a}</div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
