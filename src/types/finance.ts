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

export type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
export type AppointmentModality = 'presencial' | 'online';

export interface ScheduledAppointment {
  id: string;
  patientId: string;
  patientName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  durationMinutes: number;
  modality: AppointmentModality;
  status: AppointmentStatus;
  fee: number;
  notes?: string;
}
