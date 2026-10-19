import React, { useState } from 'react';
import { Database, Search, Download, RotateCcw, Check, Clock } from 'lucide-react';
import type { BookingRecord } from '../types/booking.ts';

interface DatabaseAuditLogProps {
  bookings: BookingRecord[];
  onResetDatabase: () => Promise<void>;
  onRefreshDatabase: () => Promise<void>;
}

export const DatabaseAuditLog: React.FC<DatabaseAuditLogProps> = ({
  bookings,
  onResetDatabase,
  onRefreshDatabase,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'CONFIRMED' | 'CHECKED_IN'>('ALL');
  const [isResetting, setIsResetting] = useState<boolean>(false);

  const filteredBookings = bookings.filter((b) => {
    const matchesSearch =
      b.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(bookings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `passpulse-database-dump-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = async () => {
    if (confirm('Reset database to initial clean seed state?')) {
      setIsResetting(true);
      await onResetDatabase();
      setIsResetting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm space-y-0">
      {/* Top Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-semibold text-slate-900">Backend Database Audit Registry</h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time persistence log of all issued dynamic QR passes stored on the Express server.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportJson}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
          <button
            onClick={handleReset}
            disabled={isResetting}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo DB</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by attendee name, email, or pass ID..."
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Status Filter Segmented Control */}
        <div className="flex items-center gap-1 p-1 bg-slate-200/60 rounded-lg">
          {(['ALL', 'CONFIRMED', 'CHECKED_IN', 'PENDING'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                statusFilter === filter
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {filter === 'ALL' ? 'All Records' : filter}
            </button>
          ))}
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/60 border-b border-slate-100 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
              <th className="py-3 px-6">Pass Reference</th>
              <th className="py-3 px-6">Attendee</th>
              <th className="py-3 px-6">Event Track</th>
              <th className="py-3 px-6">Database Status</th>
              <th className="py-3 px-6">Registered At</th>
              <th className="py-3 px-6">Gate Check-in</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filteredBookings.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">
                  No records matching search query.
                </td>
              </tr>
            ) : (
              filteredBookings.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-6 font-mono font-medium text-slate-900">
                    {b.id}
                  </td>
                  <td className="py-3.5 px-6">
                    <div className="font-semibold text-slate-900">{b.fullName}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{b.email}</div>
                  </td>
                  <td className="py-3.5 px-6">
                    <div className="font-medium text-slate-800">{b.category}</div>
                  </td>
                  <td className="py-3.5 px-6">
                    {b.status === 'CHECKED_IN' ? (
                      <span className="inline-flex items-center gap-1.5 text-emerald-700 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Checked In
                      </span>
                    ) : b.status === 'CONFIRMED' ? (
                      <span className="inline-flex items-center gap-1.5 text-indigo-700 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        Confirmed (Ready)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-amber-700 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        Pending QR Scan
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-6 font-mono text-[11px] text-slate-500">
                    {new Date(b.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-3.5 px-6 font-mono text-[11px] text-slate-500">
                    {b.checkedInAt
                      ? new Date(b.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                      : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>Total Records in Backend Store: {bookings.length}</span>
        <span className="font-mono text-[11px]">Node.js Express Storage: Active</span>
      </div>
    </div>
  );
};
