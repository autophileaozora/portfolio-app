-- Seed data transcribed from the static site's placeholder content, so the
-- app isn't empty once pages switch over to reading from Supabase. Fixed
-- UUID literals (instead of gen_random_uuid()) make this migration safe to
-- re-run: every insert is guarded by "on conflict ... do nothing".
--
-- This is placeholder content, not real content — cleaning it up (distinct
-- project descriptions, a real testimonial count, etc.) is a follow-up
-- content-editing task through the admin panel, not part of this migration.

-- ── profile ──
insert into public.profile (id, full_name, title, location, avatar_url, email, social_linkedin, social_github, social_instagram, social_whatsapp, summary_paragraph)
values (
  1,
  'Andrian Imanuel Sinaga',
  'Tech Enthusiast',
  'Tangerang, Indonesia',
  '/assets/avatar.jpg',
  'helloimanuel@yahoo.com',
  'https://linkedin.com',
  'https://github.com',
  'https://instagram.com',
  'https://whatsapp.com',
  'Profesional IT Support yang berpengalaman dalam administrasi sistem, troubleshooting perangkat keras/lunak, dan instalasi jaringan. Berpengalaman mengelola lab komputer besar, konfigurasi MikroTik, dan menangani perangkat AV untuk live streaming. Memiliki kemampuan komunikasi yang baik untuk memimpin tim teknis dan memecahkan masalah.'
)
on conflict (id) do nothing;

-- ── projects ── (one real project so far, matching what's already been
-- ported into the Svelte pages under this exact slug)
insert into public.projects (id, slug, title, short_description, role, duration, category, thumbnail_url, contributors, associated_with, date_start, date_end, is_published, is_featured, display_order)
values (
  '11111111-1111-1111-1111-111111111111',
  'website-smk-kristen-5-klaten',
  'WEBSITE SMK KRISTEN 5 KLATEN USING REACT JS AND MONGODB',
  'Profesional IT Support yang berpengalaman dalam administrasi sistem, troubleshooting perangkat keras/lunak, dan instalasi jaringan.',
  'UI/UX Designer',
  '2 Weeks',
  'App',
  '/assets/card_header_bg.png',
  'Imanuel, Louis, Jonathan, Emma',
  'Universitas Kristen Satya Wacana',
  '2023-08-01',
  '2023-12-31',
  true,
  true,
  1
)
on conflict (id) do nothing;

insert into public.project_sections (id, project_id, type, title, content, display_order)
values
  ('11111111-1111-1111-1111-111111111121', '11111111-1111-1111-1111-111111111111', 'problem', 'Problems', 'Profesional IT Support yang berpengalaman dalam administrasi sistem, troubleshooting perangkat keras/lunak, dan instalasi jaringan. Berpengalaman mengelola lab komputer besar, konfigurasi MikroTik, dan menangani perangkat AV untuk live streaming. Memiliki kemampuan komunikasi yang baik untuk memimpin tim teknis dan memecahkan masalah.', 1),
  ('11111111-1111-1111-1111-111111111122', '11111111-1111-1111-1111-111111111111', 'solution', 'Solutions', 'Profesional IT Support yang berpengalaman dalam administrasi sistem, troubleshooting perangkat keras/lunak, dan instalasi jaringan. Berpengalaman mengelola lab komputer besar, konfigurasi MikroTik, dan menangani perangkat AV untuk live streaming. Memiliki kemampuan komunikasi yang baik untuk memimpin tim teknis dan memecahkan masalah.', 2),
  ('11111111-1111-1111-1111-111111111123', '11111111-1111-1111-1111-111111111111', 'result', 'Final Results', 'Profesional IT Support yang berpengalaman dalam administrasi sistem, troubleshooting perangkat keras/lunak, dan instalasi jaringan. Berpengalaman mengelola lab komputer besar, konfigurasi MikroTik, dan menangani perangkat AV untuk live streaming. Memiliki kemampuan komunikasi yang baik untuk memimpin tim teknis dan memecahkan masalah.', 3),
  ('11111111-1111-1111-1111-111111111124', '11111111-1111-1111-1111-111111111111', 'documentation', 'JUDUL DOKUMENTASI', 'Teks ini sangat panjang untuk mendemonstrasikan fungsi truncate maksimal 4 baris. Profesional IT Support yang berpengalaman dalam administrasi sistem, troubleshooting perangkat keras/lunak, dan instalasi jaringan.', 1),
  ('11111111-1111-1111-1111-111111111125', '11111111-1111-1111-1111-111111111111', 'documentation', 'KONTEN SLIDE DUA', 'Perhatikan animasi kartu ini saat berganti. Kartu yang baru akan meluncur lembut dari bawah sambil memudar.', 2),
  ('11111111-1111-1111-1111-111111111126', '11111111-1111-1111-1111-111111111111', 'documentation', 'KONTEN SLIDE TIGA', 'Ini adalah slide ketiga. Anda bisa mengeklik titik-titik di atas untuk melompat langsung ke slide tertentu.', 3),
  ('11111111-1111-1111-1111-111111111127', '11111111-1111-1111-1111-111111111111', 'documentation', 'KONTEN SLIDE EMPAT', 'Meskipun ini adalah slide ke-4, jumlah titik di pojok kiri atas tetap dibatasi maksimal 3 sesuai dengan permintaan desain.', 4)
on conflict (id) do nothing;

insert into public.tags (id, label)
values
  ('22222222-2222-2222-2222-222222222201', '#ReactJS'),
  ('22222222-2222-2222-2222-222222222202', '#MongoDB'),
  ('22222222-2222-2222-2222-222222222203', '#NodeJS')
on conflict (label) do nothing;

insert into public.project_tags (project_id, tag_id, display_order)
values
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222201', 1),
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222202', 2),
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222203', 3)
on conflict (project_id, tag_id) do nothing;

-- ── experience ──
insert into public.experience (id, role_title, role_type, company_name, date_start, date_end, display_order)
values
  ('33333333-3333-3333-3333-333333333331', 'IT Support', '(Intern)', 'at PT Selaras Citra Terabit', '2020-01-01', '2020-03-31', 1),
  ('33333333-3333-3333-3333-333333333332', 'IT Support', '(Freelance)', 'at Boemisora', '2020-01-01', '2020-03-31', 2),
  ('33333333-3333-3333-3333-333333333333', 'IT Support', '(Part Timer)', 'at Faculty Information Technology of UKSW', '2020-01-01', '2020-03-31', 3),
  ('33333333-3333-3333-3333-333333333334', 'AV Technician', '(Project Based)', 'at Boemisora Productions', '2021-04-01', null, 4)
on conflict (id) do nothing;

-- ── skills ──
insert into public.skills (id, name, display_order)
values
  ('44444444-4444-4444-4444-444444444401', '#IT Support', 1),
  ('44444444-4444-4444-4444-444444444402', '#Python', 2),
  ('44444444-4444-4444-4444-444444444403', '#JavaScript', 3),
  ('44444444-4444-4444-4444-444444444404', '#TypeScript', 4),
  ('44444444-4444-4444-4444-444444444405', '#Java', 5),
  ('44444444-4444-4444-4444-444444444406', '#CSharp', 6),
  ('44444444-4444-4444-4444-444444444407', '#Ruby', 7),
  ('44444444-4444-4444-4444-444444444408', '#GoLang', 8),
  ('44444444-4444-4444-4444-444444444409', '#Swift', 9),
  ('44444444-4444-4444-4444-44444444440a', '#Kotlin', 10),
  ('44444444-4444-4444-4444-44444444440b', '#Rust', 11),
  ('44444444-4444-4444-4444-44444444440c', '#PHP', 12)
on conflict (id) do nothing;

-- ── testimonials ──
insert into public.testimonials (id, author_name, author_role, quote, is_published, display_order)
values
  ('55555555-5555-5555-5555-555555555501', 'Abraham', 'Public User', 'KEMARIN NGERJAIN PROYEK BARENG, SERU SIH, EL NYA BAIK RESPONNYA', true, 1),
  ('55555555-5555-5555-5555-555555555502', 'Budi Santoso', 'Lab Admin - UKSW', 'Instalasi jaringan lab komputer dan konfigurasi MikroTik cepat dan sangat terstruktur. Recommended IT Support!', true, 2),
  ('55555555-5555-5555-5555-555555555503', 'Jessica Natalia', 'Event Director', 'Pengelolaan live streaming multi-camera sangat lancar tanpa kendala teknis. Terima kasih mas El!', true, 3),
  ('55555555-5555-5555-5555-555555555504', 'Rian Prasetyo', 'Manager PT Selaras Citra Terabit', 'Troubleshooting hardware & server cepat tanggap. Memiliki kemampuan komunikasi teknis yang luarbiasa.', true, 4),
  ('55555555-5555-5555-5555-555555555505', 'Dewi Anggraini', 'School Operations Lead', 'KERJASAMA DENGAN MAS EL TERASA LANCAR, KOMUNIKASINYA JELAS, DAN HASILNYA BISA LANGSUNG DIPAKAI.', true, 5),
  ('55555555-5555-5555-5555-555555555506', 'Fadli Rahman', 'Technical Coordinator', 'SOLUSI IT YANG DIBERIKAN DETAIL, CEPAT, DAN MUDAH DIMENGERTI. SANGAT REKOMENDASI UNTUK TIM TEKNIS.', true, 6)
on conflict (id) do nothing;

-- ── stats ──
insert into public.stats (id, label, value, display_order)
values
  ('66666666-6666-6666-6666-666666666601', 'Years in IT Fields', 3, 1),
  ('66666666-6666-6666-6666-666666666602', 'Impactful Projects', 12, 2),
  ('66666666-6666-6666-6666-666666666603', 'People Has Collaborate', 10, 3),
  ('66666666-6666-6666-6666-666666666604', 'Technologies', 24, 4)
on conflict (id) do nothing;

-- ── messages ── (the one pre-existing "answered" example from the old
-- static mockup, so the Read Messages view isn't empty on day one)
insert into public.messages (id, sender_name, is_anonymous, content, status, admin_reply, replied_at, created_at)
values (
  '77777777-7777-7777-7777-777777777701',
  'Abraham',
  false,
  'KEMARIN NGERJAIN PROYEK BARENG, SERU SIH, EL NYA BAIK RESPONNYA',
  'answered',
  'Terima kasih mas Abraham! Sukses selalu buat proyeknya.',
  now(),
  now() - interval '1 day'
)
on conflict (id) do nothing;
