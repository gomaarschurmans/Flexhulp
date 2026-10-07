export type Role = "client" | "student" | "admin";

export type TaskStatus = "open" | "accepted" | "done";

export type PaymentStatus =
  | "unpaid"
  | "pending"
  | "paid"
  | "failed"
  | "expired"
  | "canceled";

export interface Profile {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  address: string | null;
  bio: string | null;
  role: Role;
  banned: boolean;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  category: string;
  description: string;
  date: string;
  time: string;
  end_time: string;
  location: string;
  city: string;
  hours: number;
  rate_at_creation: number;
  client_id: string | null;
  client_name: string;
  client_email: string;
  client_phone: string | null;
  student_id: string | null;
  student_name: string | null;
  student_email: string | null;
  status: TaskStatus;
  extra_info: string;
  rating: number | null;
  review_comment: string | null;
  window_id: string | null;
  payment_status: PaymentStatus;
  mollie_payment_id: string | null;
  paid_at: string | null;
  reminder_sent_at: string | null;
  created_at: string;
  accepted_at: string | null;
  completed_at: string | null;
}

// Publieke projecties van tasks zonder persoonsgegevens (zie migration_v10)
export interface BusySlot {
  id: string;
  date: string;
  time: string;
  end_time: string;
}

export interface BoardTask {
  id: string;
  category: string;
  description: string;
  city: string;
  date: string;
  time: string;
  end_time: string;
  hours: number;
  rate_at_creation: number;
  created_at: string;
}

export interface AvailabilitySlot {
  id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  created_at: string;
}

export type RequestStatus = "open" | "handled";

export interface HourRequest {
  id: string;
  client_id: string | null;
  client_name: string;
  client_email: string;
  client_phone: string | null;
  category: string;
  estimated_hours: number;
  preferred_period: string;
  description: string;
  status: RequestStatus;
  created_at: string;
}

export interface TaskApplication {
  id: string;
  task_id: string;
  student_id: string;
  student_name: string;
  student_email: string;
  student_phone: string | null;
  student_bio: string | null;
  student_jobs_done: number;
  student_avg_rating: number | null;
  student_rating_count: number;
  created_at: string;
}

export interface InvoiceSummary {
  id: string;
  task_id: string;
  invoice_number: number;
}

export interface Invoice {
  id: string;
  invoice_number: number;
  task_id: string;
  client_id: string | null;
  client_name: string;
  client_email: string;
  client_address: string;
  category: string;
  description: string;
  service_date: string;
  service_time: string;
  service_end_time: string;
  hours: number;
  rate: number;
  total: number;
  vat_exempt: boolean;
  issued_at: string;
}

export interface PlatformSettings {
  id: number;
  hourly_rate: number;
  cancellation_notice_hours: number;
  updated_at: string;
  updated_by: string | null;
}
