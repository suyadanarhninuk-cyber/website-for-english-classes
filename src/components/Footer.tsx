import React from 'react';
import { site } from '../data';

export default function Footer() {
  const socials = [
    site.facebook && {
      label: site.facebookName ? `${site.facebookName} on Facebook` : 'Facebook',
      href: site.facebook,
    },
    site.instagram && { label: 'Instagram', href: site.instagram },
  ].filter(Boolean) as { label: string; href: string }[];

  return (
    <footer className="bg-gray-900 border-t border-gray-800 pt-16 pb-8 text-white no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <img src={site.logoMark} alt="" className="w-11 h-11 rounded-xl object-cover" />
              <span className="text-2xl font-bold text-white tracking-tight">{site.name}</span>
            </div>
            <p className="text-gray-400 max-w-sm mb-6 leading-relaxed">{site.heroSubtitle}</p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Courses</h4>
            <ul className="space-y-3">
              <li><a href="#services" className="text-gray-400 hover:text-brand-400 transition-colors">General English</a></li>
              <li><a href="#services" className="text-gray-400 hover:text-brand-400 transition-colors">IELTS preparation</a></li>
              <li><a href="#services" className="text-gray-400 hover:text-brand-400 transition-colors">Group courses</a></li>
              <li><a href="#faq" className="text-gray-400 hover:text-brand-400 transition-colors">FAQ</a></li>
              <li><a href="#teach" className="text-gray-400 hover:text-brand-400 transition-colors">Teach with us</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Contact</h4>
            <ul className="space-y-3">
              <li className="text-gray-400">{site.location}</li>
              <li>
                <a href={`mailto:${site.email}`} className="text-gray-400 hover:text-brand-400 transition-colors break-words">
                  {site.email}
                </a>
              </li>
              {site.phone && (
                <li>
                  <a href={`tel:${site.phone.replace(/\s+/g, '')}`} className="text-gray-400 hover:text-brand-400 transition-colors">
                    {site.phone}
                  </a>
                </li>
              )}
              {site.facebook && (
                <li>
                  <a href={site.facebook} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-brand-400 transition-colors">
                    Find us on Facebook: {site.facebookName || site.name}
                  </a>
                </li>
              )}
              {site.messenger && (
                <li>
                  <a href={site.messenger} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-brand-400 transition-colors">
                    Message us on Messenger
                  </a>
                </li>
              )}
              {site.viber && (
                <li><a href={site.viber} className="text-gray-400 hover:text-brand-400 transition-colors">Viber</a></li>
              )}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} {site.name}. All rights reserved.
          </p>
          {socials.length > 0 && (
            <div className="flex gap-4 text-sm font-medium text-gray-400">
              {socials.map(s => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  {s.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
