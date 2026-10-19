import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Download, Copy, Check, ShieldCheck, Sliders, CheckCircle2 } from 'lucide-react';
import type { BookingRecord } from '../types/booking.ts';

interface DynamicQRCanvasProps {
  booking: BookingRecord;
  onConfirmBooking?: () => void;
  isConfirming?: boolean;
}

export const DynamicQRCanvas: React.FC<DynamicQRCanvasProps> = ({
  booking,
  onConfirmBooking,
  isConfirming = false,
}) => {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [quietZonePadding, setQuietZonePadding] = useState<number>(4);
  const [includeCenterBadge, setIncludeCenterBadge] = useState<boolean>(true);
  const [qrSize] = useState<number>(260);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    async function generateCode() {
      try {
        const url = await QRCode.toDataURL(booking.qrPayload, {
          errorCorrectionLevel: 'H',
          margin: quietZonePadding,
          width: qrSize * 2,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
        });

        if (!isMounted) return;

        if (includeCenterBadge) {
          const img = new Image();
          img.src = url;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = qrSize * 2;
            canvas.height = qrSize * 2;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              setDataUrl(url);
              return;
            }

            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            const badgeSize = Math.floor(canvas.width * 0.22);
            const badgeX = (canvas.width - badgeSize) / 2;
            const badgeY = (canvas.height - badgeSize) / 2;
            const borderRadius = Math.floor(badgeSize * 0.24);

            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.12)';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.roundRect(badgeX, badgeY, badgeSize, badgeSize, borderRadius);
            ctx.fill();

            ctx.shadowColor = 'transparent';
            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 4;
            ctx.stroke();

            ctx.fillStyle = '#4f46e5';
            ctx.beginPath();
            ctx.roundRect(badgeX + 8, badgeY + 8, badgeSize - 16, badgeSize - 16, borderRadius - 4);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.font = `bold ${Math.floor(badgeSize * 0.42)}px 'Plus Jakarta Sans', sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('PASS', canvas.width / 2, canvas.height / 2 + 1);

            setDataUrl(canvas.toDataURL('image/png'));
          };
        } else {
          setDataUrl(url);
        }
      } catch (err) {
        console.error('QR Generation failed:', err);
      }
    }

    generateCode();
    return () => {
      isMounted = false;
    };
  }, [booking.qrPayload, quietZonePadding, includeCenterBadge, qrSize]);

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(booking.qrPayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `pass-${booking.id}.png`;
    a.click();
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Dynamic QR Entry Pass</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Pass Reference <span className="font-mono font-medium text-slate-800">{booking.id}</span> · Ready for Issuance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyPayload}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            title="Copy plain-text payload"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Payload'}</span>
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PNG</span>
          </button>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Left: Dynamic QR Code Presentation */}
        <div className="flex flex-col items-center justify-center p-6 bg-slate-50 border border-slate-200 rounded-2xl">
          <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm flex items-center justify-center">
            {dataUrl ? (
              <img
                src={dataUrl}
                alt={`Dynamic QR code for pass ${booking.id}`}
                style={{ width: `${qrSize}px`, height: `${qrSize}px` }}
                className="rounded-lg"
              />
            ) : (
              <div
                style={{ width: `${qrSize}px`, height: `${qrSize}px` }}
                className="flex items-center justify-center text-slate-400 text-sm"
              >
                Rendering QR Matrix...
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 mt-4 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>SHA-256 Digital Checksum:</span>
            <span className="font-mono text-slate-800 font-semibold">{booking.signature}</span>
          </div>
        </div>

        {/* Right: Registration Summary & Issuance Action */}
        <div className="space-y-5">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-500 uppercase tracking-wider text-[10px] font-semibold">
                Attendee Registration Summary
              </span>
              <span className="font-mono text-indigo-700 font-medium">
                {booking.id}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-slate-700">
              <div>
                <span className="text-[10px] text-slate-400 block">Attendee Name</span>
                <span className="font-medium text-slate-900">{booking.fullName}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Email Address</span>
                <span className="font-medium text-slate-900 font-mono text-[11px] truncate block">{booking.email}</span>
              </div>
              <div className="col-span-2">
                <span className="text-[10px] text-slate-400 block">Department</span>
                <span className="font-medium text-slate-900">{booking.department}</span>
              </div>
              <div className="col-span-2">
                <span className="text-[10px] text-slate-400 block">Registered Event Track</span>
                <span className="font-semibold text-slate-900">{booking.category}</span>
              </div>
            </div>

            {/* Encoded String preview */}
            <div className="pt-2 border-t border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                Encoded Dynamic QR Payload
              </span>
              <div className="font-mono text-[10px] text-slate-600 bg-white p-2 rounded border border-slate-200 break-all">
                {booking.qrPayload}
              </div>
            </div>
          </div>

          {/* Canvas Geometry Adjustments */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-600">
              <Sliders className="w-3.5 h-3.5 text-indigo-600" />
              <span>Quiet-Zone Padding:</span>
              <span className="font-mono font-bold text-slate-900">{quietZonePadding} modules</span>
            </div>
            <input
              type="range"
              min="0"
              max="6"
              value={quietZonePadding}
              onChange={(e) => setQuietZonePadding(parseInt(e.target.value, 10))}
              className="w-24 accent-indigo-600 cursor-pointer"
            />
          </div>

          {/* Primary Action Button: Confirm & Issue Pass */}
          {booking.status === 'PENDING' && onConfirmBooking && (
            <div className="space-y-2">
              <button
                onClick={onConfirmBooking}
                disabled={isConfirming}
                className="w-full py-3 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                {isConfirming ? (
                  <span>Authenticating &amp; Storing in Database...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm &amp; Issue Entry Pass</span>
                  </>
                )}
              </button>
              <p className="text-[11px] text-slate-400 text-center">
                Authenticates the record in the backend server and issues your official pass.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
