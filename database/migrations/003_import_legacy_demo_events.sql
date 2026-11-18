-- Import data from the original PHP/Next demo events table into the full schema.
-- PRECONDITIONS:
-- 1. Take a verified mysqldump backup first.
-- 2. Rename the old numeric events table to events_legacy.
-- 3. Apply 001_mini_event_management_mysql.sql so the full events table exists.
-- 4. Create an Owner account/group in Next.js and replace the group ID below.
-- This script does not rename tables, drop data, or reset Docker volumes.

SET @target_group_id = 'PASTE_OWNER_GROUP_UUID_HERE';

-- Keep a mapping so rerunning this import does not create duplicate event rows.
CREATE TABLE IF NOT EXISTS legacy_event_import_map (
  legacy_id BIGINT UNSIGNED PRIMARY KEY,
  event_id CHAR(36) NOT NULL UNIQUE,
  imported_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB;

INSERT IGNORE INTO legacy_event_import_map (legacy_id, event_id)
SELECT id, UUID()
FROM events_legacy;

-- The JOIN to groups ensures that an invalid group ID imports zero rows.
INSERT INTO events (
  id, group_id, name, description, start_date, location, status_mode, status
)
SELECT
  map.event_id,
  target_group.id,
  legacy.name,
  LEFT(legacy.description, 2000),
  legacy.event_date,
  LEFT(legacy.location, 200),
  'automatic',
  'planned'
FROM events_legacy AS legacy
JOIN legacy_event_import_map AS map ON map.legacy_id = legacy.id
JOIN `groups` AS target_group ON target_group.id = @target_group_id
LEFT JOIN events AS imported ON imported.id = map.event_id
WHERE imported.id IS NULL;

-- Review these counts after import. Imported rows should match the legacy row count.
SELECT
  (SELECT COUNT(*) FROM events_legacy) AS legacy_event_count,
  (SELECT COUNT(*) FROM legacy_event_import_map) AS mapped_event_count,
  (SELECT COUNT(*) FROM events e JOIN legacy_event_import_map m ON m.event_id = e.id) AS imported_event_count;
