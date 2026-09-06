-- Like-it board: buy/avoid fields beside the existing run matrix, plus anonymous votes.

ALTER TABLE laptops ADD COLUMN tier TEXT NOT NULL DEFAULT 'works';
ALTER TABLE laptops ADD COLUMN battery TEXT NOT NULL DEFAULT 'unknown';
ALTER TABLE laptops ADD COLUMN fingerprint TEXT NOT NULL DEFAULT 'unknown';
ALTER TABLE laptops ADD COLUMN build TEXT NOT NULL DEFAULT 'unknown';
ALTER TABLE laptops ADD COLUMN quirks TEXT;
ALTER TABLE laptops ADD COLUMN uniques TEXT;
ALTER TABLE laptops ADD COLUMN cost INTEGER;
ALTER TABLE laptops ADD COLUMN used_cost INTEGER;
ALTER TABLE laptops ADD COLUMN sweet_spot TEXT;

CREATE TABLE votes (
  id TEXT PRIMARY KEY,
  laptop_id TEXT NOT NULL,
  direction INTEGER NOT NULL CHECK (direction IN (-1, 1)),
  voter_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (laptop_id, voter_hash)
);

CREATE INDEX idx_votes_laptop_id ON votes (laptop_id);

UPDATE laptops SET
  tier = 'works',
  battery = 'unknown',
  fingerprint = 'unknown',
  build = 'solid',
  quirks = 'Sleep still thinly reported. First-party Panther Lake stack is new.',
  uniques = 'Official Omarchy Panther Lake support, Wi-Fi 7, speaker tunings.',
  cost = 1800,
  used_cost = NULL,
  sweet_spot = 'Wait for sleep reports; then the 14 if you want a thin Dell Omarchy actually ships for.'
WHERE id = 'seed-dell-xps-14-2026';

UPDATE laptops SET
  tier = 'works',
  battery = 'unknown',
  fingerprint = 'unknown',
  build = 'solid',
  quirks = 'Same thin sleep reporting as the XPS 14.',
  uniques = 'Bigger canvas on the same first-party PTL stack.',
  cost = 2200,
  used_cost = NULL,
  sweet_spot = 'Get the 16 only if you need the screen; the 14 is the same stack in less bulk.'
WHERE id = 'seed-dell-xps-16-2026';

UPDATE laptops SET
  tier = 'fiddly',
  battery = 'partial',
  fingerprint = 'unknown',
  build = 'tank',
  quirks = 'dGPU / mux path needs extra env. s2idle, not S3. Expansion bay modules vary.',
  uniques = 'Modular 16 inch you can actually repair.',
  cost = 1700,
  used_cost = 1200,
  sweet_spot = 'Buy it for the modular 16"; skip the dGPU if you want fewer evenings in env files.'
WHERE id = 'seed-framework-16-2024';

UPDATE laptops SET
  tier = 'daily',
  battery = 'works',
  fingerprint = 'unknown',
  build = 'solid',
  quirks = 'AMD s2idle; a few need firmware updates before resume is uneventful.',
  uniques = 'The boring Framework. Repairable, iGPU just works.',
  cost = 1200,
  used_cost = 800,
  sweet_spot = 'Ryzen AI 300 if you can wait; 7040 is the used bargain and already daily-fine.'
WHERE id = 'seed-framework-13-amd-2024';

UPDATE laptops SET
  tier = 'daily',
  battery = 'works',
  fingerprint = 'unknown',
  build = 'solid',
  quirks = 'Still a Framework: keep BIOS current.',
  uniques = 'Sleeps more boringly than the AMD boards.',
  cost = 1100,
  used_cost = 750,
  sweet_spot = 'Core Ultra if you want the least-fussy Framework sleep.'
WHERE id = 'seed-framework-13-intel-2024';

UPDATE laptops SET
  tier = 'daily',
  battery = 'works',
  fingerprint = 'partial',
  build = 'tank',
  quirks = 'Typical ThinkPad. Battery is good, not magic. fprintd is mixed.',
  uniques = 'Keyboard, TrackPoint, firmware from lvfs.',
  cost = 1400,
  used_cost = 700,
  sweet_spot = 'Used T14s AMD — the daily ThinkPad if you want keys and a lid that lasts.'
WHERE id = 'seed-thinkpad-t14s-gen4-amd';

UPDATE laptops SET
  tier = 'works',
  battery = 'partial',
  fingerprint = 'partial',
  build = 'solid',
  quirks = 's2idle; Thunderbolt docks can produce odd wakeups. Do not expect Windows battery life.',
  uniques = 'Best keyboard in a thin chassis.',
  cost = 1800,
  used_cost = 850,
  sweet_spot = 'Used G11 if the keyboard is the point; skip if you live on a Thunderbolt dock.'
WHERE id = 'seed-thinkpad-x1-carbon-g11';

UPDATE laptops SET
  tier = 'fiddly',
  battery = 'partial',
  fingerprint = 'unknown',
  build = 'meh',
  quirks = 'IPU6 camera is the historical Linux tax. Speakers lack the 2026 XPS tunings.',
  uniques = 'Thin Intel Arc iGPU that actually works.',
  cost = 1300,
  used_cost = 800,
  sweet_spot = 'Only if you already own it — do not buy 9340 new when the 2026 XPS exists.'
WHERE id = 'seed-dell-xps-13-9340';

UPDATE laptops SET
  tier = 'avoid',
  battery = 'partial',
  fingerprint = 'unknown',
  build = 'tank',
  quirks = 'NVIDIA on Hyprland: nvidia-open, extra env, hybrid graphics. Suspend with the dGPU is the usual pain.',
  uniques = 'Workstation CPU/GPU in a ThinkPad lid.',
  cost = 2500,
  used_cost = 1400,
  sweet_spot = 'Do not — get a T-series iGPU ThinkPad unless you need the NVIDIA for work.'
WHERE id = 'seed-thinkpad-p1-gen6';

UPDATE laptops SET
  tier = 'works',
  battery = 'works',
  fingerprint = 'unknown',
  build = 'solid',
  quirks = 'Original DIY. Still fine if the BIOS is current.',
  uniques = 'Cheap used repairable 13 inch with an Intel AX210 path.',
  cost = NULL,
  used_cost = 450,
  sweet_spot = 'Used 11th-gen DIY if you want Framework cheap and already know the upgrade path.'
WHERE id = 'seed-framework-13-11th-2021';
