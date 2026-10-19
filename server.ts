import express, { Request, Response } from 'express';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import type { BookingRecord, BookingInput, VerifyResult, OfficialEvent } from './src/types/booking.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const SECRET_KEY = process.env.SECRET_KEY || 'campuspass-secret-token-2026';

app.use(express.json());

// Official Events Registry (Organizers manage this list)
let officialEvents: OfficialEvent[] = [
  { id: 'EV-01', name: 'National Tech Symposium 2026', date: 'Oct 24, 2026', venue: 'Main Auditorium' },
  { id: 'EV-02', name: 'Web & Mobile Hackathon', date: 'Oct 25, 2026', venue: 'CS Lab 3' },
  { id: 'EV-03', name: 'AI & Cloud Computing Workshop', date: 'Oct 26, 2026', venue: 'Seminar Hall B' },
  { id: 'EV-04', name: 'Paper & Project Presentation', date: 'Oct 27, 2026', venue: 'Conference Room 1' },
];

// In-Memory Database Store with sample attendee records
let bookings: BookingRecord[] = [
  {
    id: 'BK-2026-8921',
    fullName: 'Pavithra Adhikari',
    email: 'pavithra@college.edu',
    phone: '+91 98765 43210',
    department: 'Computer Science & Engineering',
    category: 'National Tech Symposium 2026',
    qrPayload: 'PASS:BK-2026-8921|Pavithra Adhikari|Computer Science & Engineering|National Tech Symposium 2026|VALID',
    signature: crypto.createHmac('sha256', SECRET_KEY).update('BK-2026-8921').digest('hex').slice(0, 12),
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    confirmedAt: new Date(Date.now() - 3600000 * 1.5).toISOString(),
    status: 'CONFIRMED',
    checkInCount: 0,
  },
  {
    id: 'BK-2026-4012',
    fullName: 'Aarav Sharma',
    email: 'aarav.sharma@college.edu',
    phone: '+91 91234 56789',
    department: 'Information Science',
    category: 'Web & Mobile Hackathon',
    qrPayload: 'PASS:BK-2026-4012|Aarav Sharma|Information Science|Web & Mobile Hackathon|VALID',
    signature: crypto.createHmac('sha256', SECRET_KEY).update('BK-2026-4012').digest('hex').slice(0, 12),
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    confirmedAt: new Date(Date.now() - 3600000 * 4.8).toISOString(),
    checkedInAt: new Date(Date.now() - 3600000 * 0.5).toISOString(),
    status: 'CHECKED_IN',
    checkInCount: 1,
  }
];

function buildPayload(id: string, name: string, dept: string, category: string, signature: string): string {
  return `PASS:${id}|${name}|${dept}|${category}|SIG:${signature}`;
}

// 1. API: Get official active events
app.get('/api/events', (_req: Request, res: Response) => {
  return res.json(officialEvents);
});

// 2. API: Add a new official event (Organizer Only)
app.post('/api/events/create', (req: Request, res: Response) => {
  const { name, date, venue } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Event name is required' });
  }

  const newEvent: OfficialEvent = {
    id: `EV-0${officialEvents.length + 1}`,
    name: name.trim(),
    date: date || 'Upcoming 2026',
    venue: venue || 'Campus Hall',
  };

  officialEvents.push(newEvent);
  return res.status(201).json(newEvent);
});

// 3. API: Create a new attendee booking / pass
app.post('/api/bookings/create', (req: Request, res: Response) => {
  const { fullName, email, phone, department, category } = req.body as BookingInput;

  if (!fullName || !email) {
    return res.status(400).json({ error: 'Full name and email are required' });
  }

  const id = `BK-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  const signature = crypto.createHmac('sha256', SECRET_KEY).update(id).digest('hex').slice(0, 12);
  const eventName = category || officialEvents[0].name;
  const qrPayload = buildPayload(id, fullName, department || 'General', eventName, signature);

  const newBooking: BookingRecord = {
    id,
    fullName: fullName.trim(),
    email: email.trim(),
    phone: phone ? phone.trim() : '+91 90000 00000',
    department: department ? department.trim() : 'Computer Science',
    category: eventName,
    qrPayload,
    signature,
    createdAt: new Date().toISOString(),
    status: 'PENDING',
    checkInCount: 0,
  };

  bookings.unshift(newBooking);
  return res.status(201).json(newBooking);
});

// 4. API: Confirm and authenticate pass
app.post('/api/bookings/confirm', (req: Request, res: Response) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ error: 'Booking ID is required' });
  }

  const booking = bookings.find((b) => b.id === id);
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  booking.status = 'CONFIRMED';
  booking.confirmedAt = new Date().toISOString();

  return res.json({ success: true, booking });
});

// 5. API: Get all bookings (Audit Log)
app.get('/api/bookings', (_req: Request, res: Response) => {
  return res.json(bookings);
});

// 6. API: Verify Pass (Gatekeeper Scanner)
app.post('/api/passes/verify', (req: Request, res: Response) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({
      valid: false,
      status: 'INVALID_TOKEN',
      message: 'No QR payload or token provided.',
      timestamp: new Date().toISOString(),
    } satisfies VerifyResult);
  }

  // Extract ID from raw payload: either "PASS:BK-2026-XXXX..." or raw ID
  let matchId = '';
  const passMatch = token.match(/BK-2026-\d{4}/);
  if (passMatch) {
    matchId = passMatch[0];
  } else {
    matchId = token.trim();
  }

  const booking = bookings.find((b) => b.id === matchId);

  if (!booking) {
    return res.status(404).json({
      valid: false,
      status: 'NOT_FOUND',
      message: `Unknown or unverified token: "${token.slice(0, 30)}..."`,
      timestamp: new Date().toISOString(),
    } satisfies VerifyResult);
  }

  // Check if already checked in
  if (booking.status === 'CHECKED_IN') {
    booking.checkInCount += 1;
    return res.json({
      valid: false,
      status: 'ALREADY_REDEEMED',
      message: `Pass already redeemed! First checked in at ${new Date(booking.checkedInAt!).toLocaleTimeString()} (Scan attempt #${booking.checkInCount}).`,
      booking,
      timestamp: new Date().toISOString(),
    } satisfies VerifyResult);
  }

  // Success: mark as checked in
  booking.status = 'CHECKED_IN';
  booking.checkedInAt = new Date().toISOString();
  booking.checkInCount = 1;

  return res.json({
    valid: true,
    status: 'SUCCESS',
    message: `Access Granted! Welcome ${booking.fullName} (${booking.department}).`,
    booking,
    timestamp: new Date().toISOString(),
  } satisfies VerifyResult);
});

// 7. API: Reset demo bookings for viva testing
app.post('/api/bookings/reset', (_req: Request, res: Response) => {
  bookings = [
    {
      id: 'BK-2026-8921',
      fullName: 'Pavithra Adhikari',
      email: 'pavithra@college.edu',
      phone: '+91 98765 43210',
      department: 'Computer Science & Engineering',
      category: 'National Tech Symposium 2026',
      qrPayload: 'PASS:BK-2026-8921|Pavithra Adhikari|Computer Science & Engineering|National Tech Symposium 2026|VALID',
      signature: crypto.createHmac('sha256', SECRET_KEY).update('BK-2026-8921').digest('hex').slice(0, 12),
      createdAt: new Date().toISOString(),
      confirmedAt: new Date().toISOString(),
      status: 'CONFIRMED',
      checkInCount: 0,
    }
  ];
  return res.json({ success: true, count: bookings.length });
});

// Mount Vite or serve static files
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`  ➜  Local:   http://localhost:${PORT}/`);
    console.log(`  ➜  Network: http://0.0.0.0:${PORT}/`);
    console.log(`[PassPulse Server] Ready on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
