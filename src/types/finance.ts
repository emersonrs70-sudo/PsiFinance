export interface Patient {
  id: string;
  name: string;
  phone: string;
  defaultFee: number;
  notes?: string;
  createdAt: string;
}

export type PaymentStatus = 'received' | 'pending';

export interface SessionEntry {
  id: string;
  patientId: string;
  patientName: string;
  date: string; // YYYY-MM-DD
  fee: number;
  status: PaymentStatus;
  paymentMethod?: string;
  notes?: string;
}

export type PeriodFilter = 
  | 'current_month'
  | 'previous_month'
  | 'last_3_months'
  | 'last_6_months'
  | 'current_year'
  | 'all';
