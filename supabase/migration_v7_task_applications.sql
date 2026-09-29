-- ============================================================
-- Flexhulp migratie v7: studenten kunnen interesse tonen in een
-- openstaande taak van een klant; de klant kiest zelf wie de taak
-- toegewezen krijgt (geen automatische toewijzing meer).
-- ============================================================

create table public.task_applications (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  student_name text not null,
  student_email text not null,
  student_phone text,
  created_at timestamptz not null default now(),
  unique (task_id, student_id)
);
alter table public.task_applications enable row level security;
alter publication supabase_realtime add table public.task_applications;

create policy "applications_select_own_student" on public.task_applications for select
  to authenticated using (student_id = auth.uid());

create policy "applications_select_task_owner" on public.task_applications for select
  to authenticated using (
    exists (
      select 1 from public.tasks t
      where t.id = task_id and t.client_id = auth.uid()
    )
  );

create policy "applications_select_admin" on public.task_applications for select
  to authenticated using (public.get_my_role() = 'admin');

create policy "applications_insert_student" on public.task_applications for insert
  to authenticated with check (
    public.get_my_role() = 'student'
    and student_id = auth.uid()
    and exists (
      select 1 from public.tasks t
      where t.id = task_id and t.status = 'open' and t.student_id is null
    )
    and not exists (
      select 1 from public.profiles p where p.id = auth.uid() and p.banned
    )
  );

create policy "applications_delete_own_student" on public.task_applications for delete
  to authenticated using (student_id = auth.uid());

create policy "applications_delete_admin" on public.task_applications for delete
  to authenticated using (public.get_my_role() = 'admin');
