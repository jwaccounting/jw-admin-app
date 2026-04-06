import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL      = "https://hklwbvpasiukjxvrrkxb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhrbHdidnBhc2l1a2p4dnJya3hiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4MDQyOTcsImV4cCI6MjA5MDM4MDI5N30.EQGlDfMs6HH3PwQ__Oo-Kc8Lzf47gSABUe90ttQWSGg";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface License {
  id: string;
  machine_id: string;
  customer_name: string;
  phone: string;
  is_active: boolean;
  expire_date: string | null;
  plan: string;
  created_at: string;
}

export interface PaymentNotification {
  id: number;
  name: string;
  amount: string;
  date: string;
  status: "pending" | "approved" | "rejected";
  machine_id?: string;
  created_at: string;
}

export interface LicenseLog {
  id: number;
  machine_id: string;
  action: string;
  agent_ver: string;
  created_at: string;
}

// ── Thai month helper ─────────────────────────────────────
const THAI_MONTHS = ["","ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];

export function toThaiDate(iso: string | null): string {
  if (!iso) return "ตลอดไป";
  const d = new Date(iso);
  return `${d.getDate()} ${THAI_MONTHS[d.getMonth()+1]} ${d.getFullYear()+543}`;
}

export function daysLeft(iso: string | null): number {
  if (!iso) return 9999;
  const diff = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86400000));
}
