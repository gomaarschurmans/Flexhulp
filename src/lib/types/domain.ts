export type Role = "client" | "student" | "admin";

export type TaskStatus = "open" | "accepted" | "done";

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
  created_at: string;
  accepted_at: string | null;
  completed_at: string | null;
}

export type AvailabilityStatus = "open" | "booked";

export interface AvailabilitySlot {
  id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  status: AvailabilityStatus;
  task_id: string | null;
  created_at: string;
}

export interface PlatformSettings {
  id: number;
  hourly_rate: number;
  cancellation_notice_hours: number;
  updated_at: string;
  updated_by: string | null;
}
