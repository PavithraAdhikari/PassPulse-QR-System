import React, { useState } from 'react';
import { Plus, Calendar, MapPin, CheckCircle, AlertCircle } from 'lucide-react';
import type { OfficialEvent } from '../types/booking.ts';

interface EventManagerProps {
  events: OfficialEvent[];
  onAddEvent: (eventData: { name: string; date: string; venue: string }) => Promise<void>;
}

export const EventManager: React.FC<EventManagerProps> = ({ events, onAddEvent }) => {
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [venue, setVenue] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide the event title.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      await onAddEvent({
        name: name.trim(),
        date: date.trim() || 'Upcoming 2026',
        venue: venue.trim() || 'Campus Auditorium',
      });
      setSuccess(`Event "${name}" officially added! Attendees can now register for it.`);
      setName('');
      setDate('');
      setVenue('');
      setIsAdding(false);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error('Failed to add event:', err);
      setError('Failed to add event. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm space-y-0">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Official Campus Events Registry</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Only approved events listed here accept attendee registrations, preventing invalid entries.
          </p>
        </div>

        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Official Event</span>
          </button>
        )}
      </div>

      {success && (
        <div className="mx-6 my-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Add Event Form Modal/Drawer */}
      {isAdding && (
        <div className="p-6 bg-slate-50 border-b border-slate-200">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Create New Authorized Event
              </h4>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Cancel
              </button>
            </div>

            {error && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-700 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Event Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Robotics Championship 2026"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Event Date
                </label>
                <input
                  type="text"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  placeholder="e.g. Nov 12, 2026"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Venue Location
                </label>
                <input
                  type="text"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  placeholder="e.g. Mechanical Seminar Hall"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Authorize Event'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List of Authorized Events */}
      <div className="divide-y divide-slate-100">
        {events.map((ev) => (
          <div key={ev.id} className="p-4 px-6 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] text-slate-400">{ev.id}</span>
                <span className="font-semibold text-slate-900 text-xs sm:text-sm">{ev.name}</span>
                <span className="inline-block px-2 py-0.5 text-[10px] font-medium text-emerald-700 bg-emerald-50 rounded border border-emerald-200">
                  Accepting Registrations
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{ev.date}</span>
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{ev.venue}</span>
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
