-- Enables Postgres change events for the tables used by the app's realtime UI.
-- Run this in Supabase SQL Editor or with psql against DIRECT_URL.
--
-- Security note:
-- The app keeps reads and writes behind NextAuth API/routes. This script does
-- not grant anon/authenticated table access. If your Supabase Realtime settings
-- require explicit grants for postgres_changes, add narrowly scoped RLS/grants
-- after reviewing each table's data exposure requirements.

do $$
declare
  tbl text;
  tables text[] := array[
    'Task',
    'TaskColumn',
    'TaskComment',
    'TaskActivity',
    'TaskView',
    'ApprovalSheet',
    'WorkSession',
    'TimeEntry',
    'Punch',
    'PunchBreak',
    'Shift',
    'ChatMessage',
    'ChatRoom',
    'ChatRoomMember',
    'DailyNote',
    'Order',
    'Invoice',
    'Quote',
    'Service',
    'Project',
    'SiteSetting',
    'User'
  ];
begin
  foreach tbl in array tables loop
    if to_regclass(format('public.%I', tbl)) is not null then
      execute format('alter table public.%I replica identity full', tbl);
      begin
        execute format('alter publication supabase_realtime add table public.%I', tbl);
      exception
        when duplicate_object then null;
        when undefined_object then
          execute 'create publication supabase_realtime';
          execute format('alter publication supabase_realtime add table public.%I', tbl);
      end;
    end if;
  end loop;
end $$;

