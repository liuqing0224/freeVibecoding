CREATE TABLE IF NOT EXISTS workspace_settings (
  id TEXT PRIMARY KEY,
  output_root TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS workspace_project (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  preset TEXT NOT NULL,
  summary TEXT NOT NULL,
  delivery_tier TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS workspace_document (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES workspace_project(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  content_json TEXT NOT NULL,
  completeness INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  UNIQUE(project_id, type)
);

CREATE TABLE IF NOT EXISTS workspace_generation (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES workspace_project(id) ON DELETE CASCADE,
  target_path TEXT NOT NULL,
  preset TEXT NOT NULL,
  status TEXT NOT NULL,
  commit_hash TEXT,
  error_message TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_workspace_project_updated_at ON workspace_project(updated_at);
CREATE INDEX IF NOT EXISTS idx_workspace_document_project ON workspace_document(project_id);
CREATE INDEX IF NOT EXISTS idx_workspace_generation_project ON workspace_generation(project_id);
