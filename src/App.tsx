import React, { useState, useEffect } from 'react';
import {
  QrCode,
  ScanLine,
  Database,
  PlusCircle,
  Lock,
  Unlock,
  LogOut,
  Calendar,
  ShieldAlert,
} from 'lucide-react';
import { BookingForm } from './components/BookingForm.tsx';
import { DynamicQRCanvas } from './components/DynamicQRCanvas.tsx';
import { ConfirmedPassView } from './components/ConfirmedPassView.tsx';
import { GatekeeperScanner } from './components/GatekeeperScanner.tsx';
import { DatabaseAuditLog } from './components/DatabaseAuditLog.tsx';
import { EventManager } from './components/EventManager.tsx';
import type { BookingRecord, BookingInput, VerifyResult, OfficialEvent } from './types/booking.ts';

type StaffTab = 'scanner' | 'events' | 'database';

export default function App() {
  // Role State: Is the viewer in public Attendee mode or Staff Organizer mode?
  const [isStaffAuthenticated, setIsStaffAuthenticated] = useState<boolean>(false);
  const [staffTab, setStaffTab] = useState<StaffTab>('scanner');
  const [showStaffModal, setShowStaffModal] = useState<boolean>(false);
  const [staffPasscode, setStaffPasscode] = useState<string>('');
  const [passcodeError, setPasscodeError] = useState<string>('');

  // Data State
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [officialEvents, setOfficialEvents] = useState<OfficialEvent[]>([]);
  const [activeBooking, setActiveBooking] = useState<BookingRecord | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [isConfirming, setIsConfirming] = useState<boolean>(false);
  const [scannerPrefillToken, setScannerPrefillToken] = useState<string>('');

  // Fetch all bookings from backend
  const fetchBookings = async () => {
    try {
      const res = await fetch('/api/bookings');
      if (res.ok) {
        const data: BookingRecord[] = await res.json();
        setBookings(data);
        if (!activeBooking && data.length > 0) {
          setActiveBooking(data[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    }
  };

  // Fetch official events from backend
  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/events');
      if (res.ok) {
        const data: OfficialEvent[] = await res.json();
        setOfficialEvents(data);
      }
    } catch (err) {
      console.error('Failed to fetch events:', err);
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchEvents();
  }, []);

  // Handler: Create new booking (Attendee)
  const handleCreateBooking = async (input: BookingInput) => {
    setIsCreating(true);
    try {
      const res = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (res.ok) {
        const newRecord: BookingRecord = await res.json();
        setBookings((prev) => [newRecord, ...prev]);
        setActiveBooking(newRecord);
      }
    } catch (err) {
      console.error('Create booking failed:', err);
    } finally {
      setIsCreating(false);
    }
  };

  // Handler: Confirm booking (Issue Pass)
  const handleConfirmBooking = async () => {
    if (!activeBooking) return;
    setIsConfirming(true);
    try {
      const res = await fetch('/api/bookings/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: activeBooking.id }),
      });

      if (res.ok) {
        const { booking }: { booking: BookingRecord } = await res.json();
        setActiveBooking(booking);
        setBookings((prev) => prev.map((b) => (b.id === booking.id ? booking : b)));
      }
    } catch (err) {
      console.error('Confirm booking failed:', err);
    } finally {
      setIsConfirming(false);
    }
  };

  // Handler: Verify pass at gate (Staff)
  const handleVerifyPass = async (token: string): Promise<VerifyResult> => {
    const res = await fetch('/api/passes/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });

    const result: VerifyResult = await res.json();
    await fetchBookings();
    return result;
  };

  // Handler: Add official event (Staff)
  const handleAddOfficialEvent = async (eventData: { name: string; date: string; venue: string }) => {
    const res = await fetch('/api/events/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData),
    });

    if (res.ok) {
      await fetchEvents();
    }
  };

  // Handler: Reset backend database
  const handleResetDatabase = async () => {
    const res = await fetch('/api/bookings/reset', { method: 'POST' });
    if (res.ok) {
      await fetchBookings();
    }
  };

  // Staff Login check (Passcode: 2026 or admin)
  const handleStaffLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (staffPasscode === '2026' || staffPasscode.toLowerCase() === 'admin') {
      setIsStaffAuthenticated(true);
      setShowStaffModal(false);
      setStaffPasscode('');
      setPasscodeError('');
    } else {
      setPasscodeError('Invalid passcode. Access denied.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 no-print">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-6">
          {/* Brand Wordmark */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              <QrCode className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight text-slate-900 whitespace-nowrap">
                PassPulse
              </span>
              <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                {isStaffAuthenticated ? 'Staff Organizer Console' : 'Campus Event Pass Portal'}
              </span>
            </div>
          </div>

          {/* Navigation Links (Context-Aware by Role) */}
          {isStaffAuthenticated ? (
            <nav className="hidden md:flex items-center gap-1 text-xs font-medium text-slate-600">
              <button
                onClick={() => setStaffTab('scanner')}
                className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                  staffTab === 'scanner'
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Gatekeeper Scanner
              </button>
              <button
                onClick={() => setStaffTab('events')}
                className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                  staffTab === 'events'
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Authorized Events
              </button>
              <button
                onClick={() => setStaffTab('database')}
                className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                  staffTab === 'database'
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Attendee Registry
              </button>
            </nav>
          ) : (
            <div className="hidden md:flex items-center text-xs text-slate-500">
              <span>Official Event Registration &amp; Dynamic QR Pass Issuance</span>
            </div>
          )}

          {/* Right Action: Role Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            {isStaffAuthenticated ? (
              <button
                onClick={() => setIsStaffAuthenticated(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                title="Switch back to Attendee Portal"
              >
                <LogOut className="w-3.5 h-3.5 text-slate-500" />
                <span>Exit Staff Console</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveBooking(null)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>New Pass</span>
                </button>
                <button
                  onClick={() => setShowStaffModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors shadow-sm"
                >
                  <Lock className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Staff Portal</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Staff Subnav */}
        {isStaffAuthenticated && (
          <div className="md:hidden flex items-center justify-around border-t border-slate-100 px-2 py-1.5 bg-slate-50 text-[11px] font-medium text-slate-600">
            <button
              onClick={() => setStaffTab('scanner')}
              className={`px-3 py-1 rounded ${staffTab === 'scanner' ? 'text-indigo-600 font-bold' : ''}`}
            >
              Scanner
            </button>
            <button
              onClick={() => setStaffTab('events')}
              className={`px-3 py-1 rounded ${staffTab === 'events' ? 'text-indigo-600 font-bold' : ''}`}
            >
              Events
            </button>
            <button
              onClick={() => setStaffTab('database')}
              className={`px-3 py-1 rounded ${staffTab === 'database' ? 'text-indigo-600 font-bold' : ''}`}
            >
              Registry
            </button>
          </div>
        )}
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* VIEW 1: PUBLIC ATTENDEE PORTAL */}
        {!isStaffAuthenticated ? (
          <div className="space-y-6">
            {!activeBooking ? (
              // Step 1: Clean Registration Form
              <BookingForm
                onSubmit={handleCreateBooking}
                isLoading={isCreating}
                events={officialEvents}
              />
            ) : activeBooking.status === 'PENDING' ? (
              // Step 2: Dynamic QR Pass with Confirm & Issue Pass button
              <div className="space-y-4">
                <div className="flex items-center justify-between no-print">
                  <button
                    onClick={() => setActiveBooking(null)}
                    className="text-xs text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    ← Back to Registration Form
                  </button>
                  <span className="text-xs font-mono font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded border border-amber-200">
                    STATUS: PENDING PASS ISSUANCE
                  </span>
                </div>

                <DynamicQRCanvas
                  booking={activeBooking}
                  onConfirmBooking={handleConfirmBooking}
                  isConfirming={isConfirming}
                />
              </div>
            ) : (
              // Step 3: Confirmed & Authenticated Entry Pass View
              <ConfirmedPassView
                booking={activeBooking}
                onBackToBooking={() => setActiveBooking(null)}
              />
            )}
          </div>
        ) : (
          /* VIEW 2: PROTECTED STAFF & GATEKEEPER CONSOLE */
          <div className="space-y-6">
            {staffTab === 'scanner' && (
              <GatekeeperScanner
                onVerify={handleVerifyPass}
                initialToken={scannerPrefillToken}
                onRefreshData={fetchBookings}
              />
            )}

            {staffTab === 'events' && (
              <EventManager
                events={officialEvents}
                onAddEvent={handleAddOfficialEvent}
              />
            )}

            {staffTab === 'database' && (
              <DatabaseAuditLog
                bookings={bookings}
                onResetDatabase={handleResetDatabase}
                onRefreshDatabase={fetchBookings}
              />
            )}
          </div>
        )}
      </main>

      {/* Staff Authentication Modal */}
      {showStaffModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-sm w-full shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Staff Portal Authorization</h3>
                <p className="text-xs text-slate-500">Restricted to event organizers &amp; gate security.</p>
              </div>
            </div>

            <form onSubmit={handleStaffLogin} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Enter Staff Passcode:
                </label>
                <input
                  type="password"
                  autoFocus
                  required
                  value={staffPasscode}
                  onChange={(e) => setStaffPasscode(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              {passcodeError && (
                <div className="p-2 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700">
                  {passcodeError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowStaffModal(false);
                    setPasscodeError('');
                  }}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                >
                  Access Console
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clean Quiet Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-xs text-slate-500 no-print mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">PassPulse</span>
            <span>·</span>
            <span>Role-Based Campus Event Pass &amp; Gatekeeper Verification System</span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            Node.js / Express Backend · Protected Gate Security
          </div>
        </div>
      </footer>
    </div>
  );
}
