-- Mini Event Management - MySQL 8.4 schema
-- Replaces the Supabase/PostgreSQL domain schema for the Docker task.
-- IDs remain UUID strings (CHAR(36)) to preserve the application's route and form identifiers.
-- This file is intentionally additive and is executed only on a fresh MySQL data volume.

CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY,
  email VARCHAR(320) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email_verified_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY users_email_uidx (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS auth_sessions (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expires_at DATETIME(3) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY auth_sessions_token_hash_uidx (token_hash),
  KEY auth_sessions_user_idx (user_id, expires_at),
  CONSTRAINT auth_sessions_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `groups` (
  id CHAR(36) PRIMARY KEY,
  owner_id CHAR(36) NOT NULL,
  name VARCHAR(120) NOT NULL,
  description VARCHAR(1000) NULL,
  category VARCHAR(60) NULL,
  logo_url MEDIUMTEXT NULL,
  logo_mime VARCHAR(40) NULL,
  logo_data MEDIUMBLOB NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY groups_owner_uidx (owner_id),
  CONSTRAINT groups_owner_fk FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS members (
  id CHAR(36) PRIMARY KEY,
  group_id CHAR(36) NOT NULL,
  full_name VARCHAR(120) NOT NULL,
  contact VARCHAR(120) NULL,
  auth_user_id CHAR(36) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY members_id_group_uidx (id, group_id),
  UNIQUE KEY members_auth_user_uidx (auth_user_id),
  KEY members_group_idx (group_id),
  CONSTRAINT members_group_fk FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE CASCADE,
  CONSTRAINT members_auth_user_fk FOREIGN KEY (auth_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS events (
  id CHAR(36) PRIMARY KEY,
  group_id CHAR(36) NOT NULL,
  name VARCHAR(160) NOT NULL,
  description VARCHAR(2000) NULL,
  category VARCHAR(60) NULL,
  start_date DATE NOT NULL,
  end_date DATE NULL,
  planning_start_date DATE NULL,
  preparation_start_date DATE NULL,
  evaluation_end_date DATE NULL,
  location VARCHAR(200) NULL,
  status_mode ENUM('automatic','manual') NOT NULL DEFAULT 'automatic',
  status ENUM('draft','planned','planning','preparation','ongoing','evaluation','completed','cancelled') NOT NULL DEFAULT 'draft',
  coordinator_id CHAR(36) NULL,
  target_budget BIGINT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY events_id_group_uidx (id, group_id),
  KEY events_group_idx (group_id, start_date),
  KEY events_coordinator_idx (coordinator_id),
  CONSTRAINT events_group_fk FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE CASCADE,
  CONSTRAINT events_coordinator_fk FOREIGN KEY (coordinator_id) REFERENCES members(id) ON DELETE SET NULL,
  CONSTRAINT events_end_date_chk CHECK (end_date IS NULL OR end_date >= start_date),
  CONSTRAINT events_budget_chk CHECK (target_budget IS NULL OR target_budget >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS event_divisions (
  id CHAR(36) PRIMARY KEY,
  group_id CHAR(36) NOT NULL,
  event_id CHAR(36) NOT NULL,
  name VARCHAR(80) NOT NULL,
  description VARCHAR(250) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY event_divisions_id_event_group_uidx (id, event_id, group_id),
  UNIQUE KEY event_divisions_event_name_uidx (event_id, name),
  KEY event_divisions_group_event_idx (group_id, event_id),
  CONSTRAINT event_divisions_event_group_fk FOREIGN KEY (event_id, group_id) REFERENCES events(id, group_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS event_members (
  id CHAR(36) PRIMARY KEY,
  group_id CHAR(36) NOT NULL,
  event_id CHAR(36) NOT NULL,
  member_id CHAR(36) NOT NULL,
  division_id CHAR(36) NULL,
  division VARCHAR(80) NULL,
  position_title VARCHAR(80) NULL,
  responsibility VARCHAR(500) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY event_members_event_member_uidx (event_id, member_id),
  KEY event_members_member_idx (member_id),
  KEY event_members_division_idx (division_id),
  CONSTRAINT event_members_event_group_fk FOREIGN KEY (event_id, group_id) REFERENCES events(id, group_id) ON DELETE CASCADE,
  CONSTRAINT event_members_member_group_fk FOREIGN KEY (member_id, group_id) REFERENCES members(id, group_id) ON DELETE CASCADE,
  CONSTRAINT event_members_division_fk FOREIGN KEY (division_id) REFERENCES event_divisions(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS schedule_items (
  id CHAR(36) PRIMARY KEY,
  group_id CHAR(36) NOT NULL,
  event_id CHAR(36) NOT NULL,
  title VARCHAR(160) NOT NULL,
  item_date DATE NOT NULL,
  start_time TIME NULL,
  end_time TIME NULL,
  location VARCHAR(200) NULL,
  pic_member_id CHAR(36) NULL,
  notes VARCHAR(1000) NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY schedule_items_event_idx (event_id, item_date, start_time, sort_order),
  KEY schedule_items_pic_idx (pic_member_id),
  CONSTRAINT schedule_items_event_group_fk FOREIGN KEY (event_id, group_id) REFERENCES events(id, group_id) ON DELETE CASCADE,
  CONSTRAINT schedule_items_pic_fk FOREIGN KEY (pic_member_id) REFERENCES members(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS tasks (
  id CHAR(36) PRIMARY KEY,
  group_id CHAR(36) NOT NULL,
  event_id CHAR(36) NOT NULL,
  title VARCHAR(160) NOT NULL,
  description VARCHAR(2000) NULL,
  assigned_to CHAR(36) NULL,
  due_date DATE NULL,
  priority ENUM('low','medium','high') NOT NULL DEFAULT 'medium',
  status ENUM('todo','in_progress','done','blocked') NOT NULL DEFAULT 'todo',
  notes VARCHAR(1000) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY tasks_event_status_idx (event_id, status),
  KEY tasks_assigned_idx (assigned_to),
  CONSTRAINT tasks_event_group_fk FOREIGN KEY (event_id, group_id) REFERENCES events(id, group_id) ON DELETE CASCADE,
  CONSTRAINT tasks_assigned_fk FOREIGN KEY (assigned_to) REFERENCES members(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS budget_categories (
  id CHAR(36) PRIMARY KEY,
  group_id CHAR(36) NOT NULL,
  event_id CHAR(36) NOT NULL,
  name VARCHAR(80) NOT NULL,
  planned_amount BIGINT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY budget_categories_event_name_uidx (event_id, name),
  UNIQUE KEY budget_categories_id_event_uidx (id, event_id),
  CONSTRAINT budget_categories_event_group_fk FOREIGN KEY (event_id, group_id) REFERENCES events(id, group_id) ON DELETE CASCADE,
  CONSTRAINT budget_categories_amount_chk CHECK (planned_amount >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS procurement_items (
  id CHAR(36) PRIMARY KEY,
  group_id CHAR(36) NOT NULL,
  event_id CHAR(36) NOT NULL,
  name VARCHAR(160) NOT NULL,
  specification VARCHAR(500) NULL,
  quantity DECIMAL(12,2) NOT NULL DEFAULT 1,
  unit VARCHAR(30) NULL,
  est_unit_price BIGINT NULL,
  actual_unit_price BIGINT NULL,
  category_id CHAR(36) NULL,
  purchased_date DATE NULL,
  pic_member_id CHAR(36) NULL,
  status ENUM('not_started','requested','ordered','purchased','ready','not_needed') NOT NULL DEFAULT 'not_started',
  supplier VARCHAR(120) NULL,
  notes VARCHAR(1000) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY procurement_items_id_event_group_uidx (id, event_id, group_id),
  KEY procurement_event_idx (event_id, status),
  KEY procurement_pic_idx (pic_member_id),
  KEY procurement_category_idx (category_id),
  CONSTRAINT procurement_items_event_group_fk FOREIGN KEY (event_id, group_id) REFERENCES events(id, group_id) ON DELETE CASCADE,
  CONSTRAINT procurement_items_pic_fk FOREIGN KEY (pic_member_id) REFERENCES members(id) ON DELETE SET NULL,
  CONSTRAINT procurement_items_category_event_fk FOREIGN KEY (category_id, event_id) REFERENCES budget_categories(id, event_id) ON DELETE RESTRICT,
  CONSTRAINT procurement_items_quantity_chk CHECK (quantity > 0),
  CONSTRAINT procurement_items_est_price_chk CHECK (est_unit_price IS NULL OR est_unit_price >= 0),
  CONSTRAINT procurement_items_actual_price_chk CHECK (actual_unit_price IS NULL OR actual_unit_price >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS transactions (
  id CHAR(36) PRIMARY KEY,
  group_id CHAR(36) NOT NULL,
  event_id CHAR(36) NOT NULL,
  category_id CHAR(36) NULL,
  type ENUM('income','expense') NOT NULL,
  trx_date DATE NOT NULL,
  description VARCHAR(200) NOT NULL,
  amount BIGINT NOT NULL,
  recorded_by CHAR(36) NULL,
  procurement_item_id CHAR(36) NULL,
  reference VARCHAR(200) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY transactions_procurement_item_uidx (procurement_item_id),
  KEY transactions_event_idx (event_id, trx_date),
  KEY transactions_category_idx (category_id),
  KEY transactions_recorded_by_idx (recorded_by),
  CONSTRAINT transactions_event_group_fk FOREIGN KEY (event_id, group_id) REFERENCES events(id, group_id) ON DELETE CASCADE,
  CONSTRAINT transactions_category_event_fk FOREIGN KEY (category_id, event_id) REFERENCES budget_categories(id, event_id),
  CONSTRAINT transactions_recorded_by_fk FOREIGN KEY (recorded_by) REFERENCES members(id) ON DELETE SET NULL,
  CONSTRAINT transactions_procurement_fk FOREIGN KEY (procurement_item_id) REFERENCES procurement_items(id) ON DELETE SET NULL,
  CONSTRAINT transactions_amount_chk CHECK (amount > 0),
  CONSTRAINT transactions_procurement_expense_chk CHECK (procurement_item_id IS NULL OR type = 'expense')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS member_invitations (
  id CHAR(36) PRIMARY KEY,
  group_id CHAR(36) NOT NULL,
  member_id CHAR(36) NOT NULL,
  email VARCHAR(320) NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expires_at DATETIME(3) NOT NULL,
  accepted_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY member_invitations_token_uidx (token_hash),
  KEY member_invitations_member_idx (member_id, created_at),
  CONSTRAINT member_invitations_member_group_fk FOREIGN KEY (member_id, group_id) REFERENCES members(id, group_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
