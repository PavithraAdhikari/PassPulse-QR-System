import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import { Camera, CameraOff, ScanLine, CheckCircle2, AlertTriangle, XCircle, Search, ShieldCheck } from 'lucide-react';
import type { VerifyResult } from '../types/booking.ts';

interface GatekeeperScannerProps {
  onVerify: (token: string) => Promise<VerifyResult>;
  initialToken?: string;
  onRefreshData?: () => void;
}

export const GatekeeperScanner: React.FC<GatekeeperScannerProps> = ({
  onVerify,
  initialToken = '',
  onRefreshData,
}) => {
  const [tokenInput, setTokenInput] = useState<string>(initialToken);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<VerifyResult | null>(null);
  const [scanHistory, setScanHistory] = useState<VerifyResult[]>([]);
  
  // Camera Scanner State
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop camera helper
  const stopCamera = () => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  // Start camera helper
  const startCamera = async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setIsCameraActive(true);
        scanFrame();
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraError('Unable to access device camera. Please allow camera permissions or enter the pass reference below.');
      setIsCameraActive(false);
    }
  };

  // Frame scanner loop
  const scanFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code && code.data) {
        // QR Code detected!
        stopCamera();
        setTokenInput(code.data);
        handleExecuteVerify(code.data);
        return;
      }
    }

    animationFrameId.current = requestAnimationFrame(scanFrame);
  };

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleExecuteVerify = async (token: string) => {
    setIsVerifying(true);
    try {
      const result = await onVerify(token.trim());
      setLastResult(result);
      setScanHistory((prev) => [result, ...prev.slice(0, 7)]);
      if (onRefreshData) onRefreshData();
    } catch (err) {
      console.error('Verification error:', err);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleManualSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!tokenInput.trim()) return;
    await handleExecuteVerify(tokenInput);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column: Live Camera & Scanner Terminal */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center">
                <ScanLine className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">Entrance Gatekeeper Scanner</h3>
                <p className="text-xs text-slate-500">
                  Point camera at attendee pass or enter pass reference to verify entrance validity.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono font-medium px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200">
              GATE #01 ACTIVE
            </span>
          </div>

          <div className="p-6 space-y-5">
            {/* Camera Viewfinder Area */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800">
                  Optical QR Camera Scanner
                </span>
                {!isCameraActive ? (
                  <button
                    type="button"
                    onClick={startCamera}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Open Camera Scanner</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    <CameraOff className="w-3.5 h-3.5" />
                    <span>Stop Camera</span>
                  </button>
                )}
              </div>

              {cameraError && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                  {cameraError}
                </div>
              )}

              {/* Camera Stream Box */}
              {isCameraActive && (
                <div className="relative w-full max-w-md mx-auto aspect-video bg-black rounded-xl overflow-hidden border border-slate-300 shadow-inner flex items-center justify-center">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    muted
                  />
                  <canvas ref={canvasRef} className="hidden" />

                  {/* Visual Scanner Reticle Overlay */}
                  <div className="absolute inset-0 border-2 border-indigo-400/40 pointer-events-none flex items-center justify-center">
                    <div className="w-48 h-48 border-2 border-emerald-400 rounded-xl animate-pulse relative shadow-[0_0_15px_rgba(52,211,153,0.5)]">
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black/70 px-2 py-0.5 rounded text-[10px] text-emerald-400 font-mono whitespace-nowrap">
                        ALIGN QR CODE IN BOX
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Manual Reference Bar (Fallback / Direct Input) */}
            <form onSubmit={handleManualSubmit} className="space-y-2 pt-3 border-t border-slate-100">
              <label className="block text-xs font-medium text-slate-700">
                Or Enter / Paste Pass Reference:
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="e.g. BK-2026-8921 or paste QR string..."
                    className="w-full pl-10 pr-3.5 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isVerifying || !tokenInput.trim()}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-50 shrink-0"
                >
                  {isVerifying ? 'Verifying...' : 'Verify Entry'}
                </button>
              </div>
            </form>

            {/* Verification Result Feedback Box */}
            {lastResult && (
              <div
                className={`p-5 rounded-xl border transition-all ${
                  lastResult.valid
                    ? 'bg-emerald-50/70 border-emerald-300'
                    : lastResult.status === 'ALREADY_REDEEMED'
                    ? 'bg-amber-50/70 border-amber-300'
                    : 'bg-rose-50/70 border-rose-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="shrink-0 mt-0.5">
                    {lastResult.valid ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    ) : lastResult.status === 'ALREADY_REDEEMED' ? (
                      <AlertTriangle className="w-6 h-6 text-amber-600" />
                    ) : (
                      <XCircle className="w-6 h-6 text-rose-600" />
                    )}
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4
                        className={`text-sm font-bold ${
                          lastResult.valid
                            ? 'text-emerald-950'
                            : lastResult.status === 'ALREADY_REDEEMED'
                            ? 'text-amber-950'
                            : 'text-rose-950'
                        }`}
                      >
                        {lastResult.status === 'SUCCESS' && 'ACCESS GRANTED · VALID ENTRY'}
                        {lastResult.status === 'ALREADY_REDEEMED' && 'DUPLICATE ENTRY DETECTED'}
                        {lastResult.status === 'NOT_FOUND' && 'UNRECOGNIZED TOKEN'}
                        {lastResult.status === 'INVALID_TOKEN' && 'INVALID PAYLOAD STRUCTURE'}
                      </h4>
                      <span className="text-[11px] font-mono text-slate-500">
                        {new Date(lastResult.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <p
                      className={`text-xs ${
                        lastResult.valid
                          ? 'text-emerald-800'
                          : lastResult.status === 'ALREADY_REDEEMED'
                          ? 'text-amber-800'
                          : 'text-rose-800'
                      }`}
                    >
                      {lastResult.message}
                    </p>

                    {lastResult.booking && (
                      <div className="mt-3 pt-3 border-t border-slate-200/60 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase block">Attendee</span>
                          <span className="font-semibold text-slate-800">{lastResult.booking.fullName}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase block">Department</span>
                          <span className="text-slate-700">{lastResult.booking.department}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase block">Event Track</span>
                          <span className="font-semibold text-indigo-700 truncate block">{lastResult.booking.category}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Gate Inspection Audit Trail */}
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              Live Gate Inspection Log
            </h4>
            <span className="text-[11px] font-mono text-slate-400">Total Scans: {scanHistory.length}</span>
          </div>

          <div className="p-4 space-y-2.5">
            {scanHistory.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No recent scans yet. Scan an attendee pass with the camera or enter their reference.
              </div>
            ) : (
              scanHistory.map((scan, idx) => (
                <div
                  key={idx}
                  className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 truncate">
                    {scan.valid ? (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    ) : scan.status === 'ALREADY_REDEEMED' ? (
                      <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                    )}
                    <div className="truncate">
                      <div className="font-medium text-slate-800 truncate">
                        {scan.booking?.fullName || 'Unknown Token'}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {scan.booking?.id || 'TOKEN_ERR'} · {scan.status}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 shrink-0 ml-2">
                    {new Date(scan.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
