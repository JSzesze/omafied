-- Laptops that run Omarchy. Community-reported, not official.
CREATE TABLE laptops (
  id TEXT PRIMARY KEY,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER,
  wifi TEXT NOT NULL CHECK (wifi IN ('works', 'partial', 'broken', 'unknown')),
  gpu TEXT NOT NULL CHECK (gpu IN ('works', 'partial', 'broken', 'unknown')),
  sleep TEXT NOT NULL CHECK (sleep IN ('works', 'partial', 'broken', 'unknown')),
  audio TEXT NOT NULL CHECK (audio IN ('works', 'partial', 'broken', 'unknown')),
  notes TEXT,
  reporter TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_laptops_created_at ON laptops (created_at DESC);

-- Honest seed: Framework 13/16, XPS, ThinkPad. Unknown and partial where that is the truth.
INSERT INTO laptops (
  id, brand, model, year, wifi, gpu, sleep, audio, notes, reporter, created_at, updated_at
) VALUES
(
  'seed-dell-xps-14-2026',
  'Dell',
  'XPS 14 (Panther Lake)',
  2026,
  'works',
  'works',
  'unknown',
  'works',
  'Omarchy ships first-party Panther Lake support (linux-ptl, IPU7 camera, haptic trackpad) and speaker tunings for the 2026 XPS 14/16. Wi-Fi 7 was fixed in 3.5+. Sleep is still thinly reported, so unknown rather than assumed.',
  'seed',
  '2026-08-20T10:00:00.000Z',
  '2026-08-20T10:00:00.000Z'
),
(
  'seed-dell-xps-16-2026',
  'Dell',
  'XPS 16 (Panther Lake)',
  2026,
  'works',
  'works',
  'unknown',
  'works',
  'Same Panther Lake stack as the XPS 14. Internal speakers have an Omarchy PipeWire tuning. Community sleep/lid reports are still thin — unknown, not a silent pass.',
  'seed',
  '2026-08-18T10:00:00.000Z',
  '2026-08-18T10:00:00.000Z'
),
(
  'seed-framework-16-2024',
  'Framework',
  '16 AMD',
  2024,
  'works',
  'partial',
  'partial',
  'works',
  'Omarchy has a Framework hardware profile. iGPU is fine; the discrete GPU / mux path still needs extra env and is easy to get wrong. s2idle, not S3. Expansion bay modules vary.',
  'seed',
  '2026-08-12T10:00:00.000Z',
  '2026-08-12T10:00:00.000Z'
),
(
  'seed-framework-13-amd-2024',
  'Framework',
  '13 AMD (7040 / Ryzen AI 300)',
  2024,
  'works',
  'works',
  'partial',
  'works',
  'The boring Framework. Wi-Fi, iGPU, speakers, and keyboard are fine. AMD units suspend via s2idle; a few need firmware updates before resume is uneventful. Expansion cards generally just work.',
  'seed',
  '2026-08-10T10:00:00.000Z',
  '2026-08-10T10:00:00.000Z'
),
(
  'seed-framework-13-intel-2024',
  'Framework',
  '13 Intel (13th gen / Core Ultra)',
  2024,
  'works',
  'works',
  'works',
  'works',
  'Intel boards tend to sleep more boringly than the AMD ones. Camera and mic are fine on most mainboards. Still a Framework: keep BIOS current.',
  'seed',
  '2026-08-08T10:00:00.000Z',
  '2026-08-08T10:00:00.000Z'
),
(
  'seed-thinkpad-t14s-gen4-amd',
  'Lenovo',
  'ThinkPad T14s Gen 4 AMD',
  2023,
  'works',
  'works',
  'works',
  'works',
  'Typical ThinkPad Linux experience. TrackPoint and trackpad are fine under libinput/Hyprland. Firmware from lvfs. Battery is good, not magic.',
  'seed',
  '2026-08-04T10:00:00.000Z',
  '2026-08-04T10:00:00.000Z'
),
(
  'seed-thinkpad-x1-carbon-g11',
  'Lenovo',
  'ThinkPad X1 Carbon Gen 11',
  2023,
  'works',
  'works',
  'partial',
  'works',
  'Excellent keyboard. s2idle; Thunderbolt docks can produce odd wakeups. Fingerprint via fprintd is mixed. Do not expect vendor Windows battery life.',
  'seed',
  '2026-08-02T10:00:00.000Z',
  '2026-08-02T10:00:00.000Z'
),
(
  'seed-dell-xps-13-9340',
  'Dell',
  'XPS 13 9340',
  2024,
  'works',
  'works',
  'partial',
  'partial',
  'Intel Arc iGPU is fine. IPU6 camera is the historical Linux tax. Speakers work but lack the 2026 XPS tunings. Not the Panther Lake series.',
  'seed',
  '2026-07-28T10:00:00.000Z',
  '2026-07-28T10:00:00.000Z'
),
(
  'seed-thinkpad-p1-gen6',
  'Lenovo',
  'ThinkPad P1 Gen 6 (NVIDIA)',
  2023,
  'works',
  'partial',
  'broken',
  'works',
  'Workstation ThinkPad. NVIDIA on Hyprland is the tax: nvidia-open, extra env, hybrid graphics fiddly. Suspend with the dGPU in play is the usual pain. Prefer iGPU ThinkPads if you want boring.',
  'seed',
  '2026-07-22T10:00:00.000Z',
  '2026-07-22T10:00:00.000Z'
),
(
  'seed-framework-13-11th-2021',
  'Framework',
  '13 Intel 11th gen',
  2021,
  'works',
  'works',
  'works',
  'works',
  'Original Framework DIY. Still a good Omarchy machine if the BIOS is current. Wi-Fi 6 card is the usual Intel AX210 path.',
  'seed',
  '2026-07-15T10:00:00.000Z',
  '2026-07-15T10:00:00.000Z'
);
