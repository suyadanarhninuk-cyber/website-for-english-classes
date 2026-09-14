import React from 'react';
import { ExternalLink } from 'lucide-react';
import { forms, site } from '../data';

/* Teachers fill in their own details here. Nothing they send appears on
   the website until you put them into section 4 of src/data.ts — that
   step is your approval. */

export default function TeacherPortal() {
  const updateLink = forms.teacherUpdate || forms.teacherRegistration;

  return (
    <section id="teach" className="py-20 bg-gray-50 border-t border-gray-100 no-print">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-10 items-start">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight mb-4">
              Teaching with {site.shortName}
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Send us your subjects and the hours you can teach, and we will match you with students.
              You can update your hours yourself whenever they change.
            </p>
            <p className="text-sm text-gray-500 leading-relaxed">
              We read every form and confirm the details with you before your name goes on the site.
              Students only ever see approved teachers.
            </p>
          </div>

          <div className="space-y-3">
            <a href={forms.teacherRegistration} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-gray-200 hover:border-indigo-400 transition-colors">
              <span>
                <span className="block font-semibold text-gray-900">New teacher</span>
                <span className="block text-sm text-gray-600 mt-0.5">
                  Register your courses, rate and available hours.
                </span>
              </span>
              <ExternalLink className="w-4 h-4 text-gray-400 shrink-0" />
            </a>

            <a href={updateLink} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-gray-200 hover:border-indigo-400 transition-colors">
              <span>
                <span className="block font-semibold text-gray-900">Already teaching with us</span>
                <span className="block text-sm text-gray-600 mt-0.5">
                  Change your hours or the classes you take.
                </span>
              </span>
              <ExternalLink className="w-4 h-4 text-gray-400 shrink-0" />
            </a>

            <p className="text-xs text-gray-500 px-1">
              What we pay you is agreed privately and never shown on this website.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
