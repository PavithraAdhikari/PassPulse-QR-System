import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { CheckCircle2, Printer, ArrowLeft, ShieldCheck, Calendar, MapPin, Building } from 'lucide-react';
import type { BookingRecord } from '../types/booking.ts';

interface ConfirmedPassViewProps {
  booking: BookingRecord;
  onBackToBooking: () => void;
}

export const ConfirmedPassView: React.FC<ConfirmedPassViewProps> = ({
  booking,
  onBackToBooking,
}) => {
  const [ticketQrUrl, setTicketQrUrl] = useState<string>('');

  useEffect(() => {
    async function makePassQR() {
      try {
        const url = await QRCode.toDataURL(booking.qrPayload, {
          errorCorrectionLevel: 'M',
          margin: 2,
          width: 180,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
        });
        setTicketQrUrl(url);
      } catch (err) {
        console.error('Failed generating ticket QR:', err);
      }
    }
    makePassQR();
  }, [booking.qrPayload]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Confirmation Message */}
      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between no-print">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-emerald-950">
              Pass Confirmed &amp; Authenticated!
            </h2>
            <p className="text-xs text-emerald-700">
              The entry pass for <span className="font-semibold">{booking.fullName}</span> has been stored in the backend database.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Pass</span>
          </button>
        </div>
      </div>

      {/* The Printable Boarding-Pass Style Card */}
      <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Pass Top Banner */}
        <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-sm tracking-wider">
              QP
            </div>
            <div>
              <span className="text-[10px] tracking-wider uppercase text-indigo-300 font-semibold block">
                Official Digital Entry Pass
              </span>
              <h3 className="text-base font-bold tracking-tight text-white">
                {booking.category}
              </h3>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 block uppercase">Pass Reference</span>
            <span className="font-mono text-sm font-bold text-emerald-400">{booking.id}</span>
          </div>
        </div>

        {/* Pass Content Body */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Left Column: Attendee Information */}
          <div className="md:col-span-2 space-y-4">
            <div>
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-0.5">
                Attendee Name
              </span>
              <div className="text-lg font-bold text-slate-900">{booking.fullName}</div>
              <div className="text-xs text-slate-500 font-mono mt-0.5">{booking.email}</div>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-0.5 flex items-center gap-1">
                <Building className="w-3 h-3 text-slate-400" />
                <span>Department</span>
              </span>
              <span className="text-xs font-semibold text-slate-800">{booking.department}</span>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100 text-xs text-slate-600">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Issued: {new Date(booking.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Auditorium Main Gate</span>
              </div>
            </div>
          </div>

          {/* Right Column: Pass QR Code */}
          <div className="flex flex-col items-center justify-center p-3 bg-slate-50 rounded-xl border border-slate-200">
            {ticketQrUrl ? (
              <img
                src={ticketQrUrl}
                alt="Ticket entry QR code"
                className="w-36 h-36 rounded-lg shadow-sm"
              />
            ) : (
              <div className="w-36 h-36 flex items-center justify-center text-xs text-slate-400">
                Loading pass...
              </div>
            )}
            <span className="text-[10px] text-slate-500 font-mono mt-2 text-center">
              Scan at Entrance Gate
            </span>
          </div>
        </div>

        {/* Pass Footer Bar */}
        <div className="bg-slate-50 px-6 py-3 border-t border-dashed border-slate-300 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Cryptographic Checksum:</span>
            <span className="font-mono text-slate-700">{booking.signature}</span>
          </div>
          <div className="font-mono text-[11px] text-emerald-700 font-semibold">
            STATUS: AUTHENTICATED
          </div>
        </div>
      </div>

      {/* Navigation Return Button */}
      <div className="flex justify-center no-print">
        <button
          onClick={onBackToBooking}
          className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Register Another Attendee</span>
        </button>
      </div>
    </div>
  );
};
