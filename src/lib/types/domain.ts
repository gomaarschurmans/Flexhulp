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
  created_at: string;
  accepted_at: string | null;
  completed_at: string | null;
}

export interface AvailabilitySlot {
  id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  created_at: string;
}

export interface PlatformSettings {
  id: number;
  hourly_rate: number;
  cancellation_notice_hours: number;
  updated_at: string;
  updated_by: string | null;
}
