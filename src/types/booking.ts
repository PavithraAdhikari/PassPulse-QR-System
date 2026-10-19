export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CHECKED_IN';

export interface BookingRecord {
  id: string; // e.g., 'BK-2026-8921'
  fullName: string;
  email: string;
  phone?: string;
  department: string;
  category: string; // The official event name
  qrPayload: string;
  signature: string;
  createdAt: string;
  confirmedAt?: string;
  checkedInAt?: string;
  status: BookingStatus;
  checkInCount: number;
}

export interface BookingInput {
  fullName: string;
  email: string;
  phone?: string;
  department: string;
  category: string;
}

export interface VerifyResult {
  valid: boolean;
  status: 'SUCCESS' | 'ALREADY_REDEEMED' | 'INVALID_TOKEN' | 'NOT_FOUND';
  message: string;
  booking?: BookingRecord;
  timestamp: string;
}

export interface OfficialEvent {
  id: string;
  name: string;
  date: string;
  venue: string;
}
