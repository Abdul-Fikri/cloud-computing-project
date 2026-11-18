-- Add database-backed group logo storage (no extra Docker service required).
ALTER TABLE `groups`
  ADD COLUMN logo_mime VARCHAR(40) NULL,
  ADD COLUMN logo_data MEDIUMBLOB NULL;
