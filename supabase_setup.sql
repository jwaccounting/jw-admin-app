-- รันใน Supabase SQL Editor
-- สร้าง table สำหรับเก็บการแจ้งชำระเงิน

create table if not exists payment_notifications (
  id          bigserial primary key,
  name        text not null,
  amount      text not null,
  date        text not null,
  machine_id  text,
  status      text default 'pending',  -- pending | approved | rejected
  created_at  timestamptz default now()
);

-- เปิด RLS แบบอนุญาตทุกคนอ่าน/เขียนได้ (agent และ admin)
alter table payment_notifications enable row level security;

create policy "allow all" on payment_notifications
  for all using (true) with check (true);
