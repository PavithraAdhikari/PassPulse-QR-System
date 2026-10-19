import React, { useState } from 'react';
import { ArrowRight, AlertCircle, Calendar } from 'lucide-react';
import type { BookingInput, OfficialEvent } from '../types/booking.ts';

interface BookingFormProps {
  onSubmit: (input: BookingInput) => Promise<void>;
  isLoading: boolean;
  events: OfficialEvent[];
}

const DEPARTMENTS = [
  'Computer Science & Engineering',
  'Information Science & Engineering',
  'Electronics & Communication Engineering',
  'Artificial Intelligence & Data Science',
  'Mechanical Engineering',
  'Electrical & Electronics Engineering',
];

export const BookingForm: React.FC<BookingFormProps> = ({ onSubmit, isLoading, events }) => {
  const [formData, setFormData] = useState<BookingInput>({
    fullName: '',
    email: '',
    phone: '',
    department: DEPARTMENTS[0],
    category: events.length > 0 ? events[0].name : 'National Tech Symposium 2026',
  });

  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError('Please enter a valid university/college email address.');
      return;
    }

    setError('');
    await onSubmit(formData);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="px-6 py-5 border-b border-slate-100">
        <h2 className="text-base font-semibold text-slate-900">Event Pass Registration</h2>
        <p className="text-xs text-slate-500 mt-1">
          Register with your credentials to generate an authenticated, tamper-proof Dynamic QR Entry Pass.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Attendee Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="e.g. Pavithra Adhikari"
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              University / College Email <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="e.g. pavithra@college.edu"
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Contact Phone */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Contact Number <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+91 98765 43210"
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Department */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Department / Discipline
            </label>
            <select
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            >
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Event Selection (from authorized active events) */}
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-700 mb-1.5 flex items-center justify-between">
              <span>Official Event Track / Competition <span className="text-rose-500">*</span></span>
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>Authorized Campus Events</span>
              </span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            >
              {events.map((ev) => (
                <option key={ev.id} value={ev.name}>
                  {ev.name} ({ev.venue} · {ev.date})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            A unique cryptographic token and dynamic QR payload will be signed upon registration.
          </p>
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-50"
          >
            {isLoading ? (
              <span>Generating Pass...</span>
            ) : (
              <>
                <span>Generate Dynamic Entry Pass</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
