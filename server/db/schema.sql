CREATE TABLE IF NOT EXISTS colleges (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  join_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS classes (
  id TEXT PRIMARY KEY,
  college_id TEXT NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  section TEXT NOT NULL DEFAULT 'A',
  join_code TEXT NOT NULL,
  faculty_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (college_id, join_code)
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('student', 'faculty')),
  college_id TEXT NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  class_id TEXT REFERENCES classes(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  department TEXT,
  phone TEXT,
  avatar TEXT,
  profile JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (college_id, email)
);

CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY,
  college_id TEXT NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  class_id TEXT REFERENCES classes(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  goal_id INTEGER NOT NULL,
  department TEXT,
  points INTEGER NOT NULL DEFAULT 150,
  deadline DATE,
  status TEXT NOT NULL DEFAULT 'Active',
  difficulty TEXT,
  task_type TEXT NOT NULL DEFAULT 'field_activity',
  ai_assigned BOOLEAN NOT NULL DEFAULT FALSE,
  matched_skills JSONB NOT NULL DEFAULT '[]',
  description TEXT,
  verification_rules TEXT,
  milestones JSONB NOT NULL DEFAULT '[]',
  participants_count INTEGER NOT NULL DEFAULT 0,
  created_by TEXT,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  college_id TEXT NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  class_id TEXT REFERENCES classes(id) ON DELETE SET NULL,
  task_id TEXT NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_title TEXT,
  sdg_goal_id INTEGER,
  task_type TEXT,
  milestone_index INTEGER DEFAULT 1,
  impact_summary TEXT,
  location TEXT,
  image_url TEXT,
  file_path TEXT,
  github_repo_url TEXT,
  colab_notebook_url TEXT,
  training_loss_plot_url TEXT,
  model_metrics JSONB DEFAULT '{}',
  live_demo_url TEXT,
  verification JSONB NOT NULL DEFAULT '{}',
  points_awarded INTEGER NOT NULL DEFAULT 0,
  impact_metrics JSONB NOT NULL DEFAULT '{}',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quizzes (
  id TEXT PRIMARY KEY,
  college_id TEXT NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  class_id TEXT REFERENCES classes(id) ON DELETE SET NULL,
  topic_id TEXT NOT NULL,
  goal_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  badge TEXT,
  icon TEXT,
  color TEXT,
  time_limit_seconds INTEGER NOT NULL DEFAULT 120,
  questions JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ongoing_tasks (
  id SERIAL PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id TEXT NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  college_id TEXT NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  class_id TEXT REFERENCES classes(id) ON DELETE SET NULL,
  assigned_at DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'in-progress',
  current_milestone_index INTEGER NOT NULL DEFAULT 1,
  progress_pct INTEGER NOT NULL DEFAULT 10,
  assigned_by TEXT,
  ai_match_rationale TEXT,
  UNIQUE (student_id, task_id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS points_ledger (
  id SERIAL PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  college_id TEXT NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  submission_id TEXT REFERENCES submissions(id) ON DELETE SET NULL,
  points INTEGER NOT NULL,
  reason TEXT,
  sdg_goal_id INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS impact_records (
  id SERIAL PRIMARY KEY,
  college_id TEXT NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  class_id TEXT REFERENCES classes(id) ON DELETE SET NULL,
  student_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  submission_id TEXT REFERENCES submissions(id) ON DELETE SET NULL,
  sdg_goal_id INTEGER,
  metric_type TEXT NOT NULL,
  metric_value NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS credentials (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  college_id TEXT NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  sdg_goals JSONB NOT NULL DEFAULT '[]',
  verification_code TEXT UNIQUE NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS uploads (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  original_name TEXT NOT NULL,
  stored_name TEXT NOT NULL,
  mime_type TEXT,
  size_bytes INTEGER,
  file_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS app_state (
  id INTEGER PRIMARY KEY,
  state JSONB NOT NULL,
  revision INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_college ON users(college_id);
CREATE INDEX IF NOT EXISTS idx_users_class ON users(class_id);
CREATE INDEX IF NOT EXISTS idx_activities_college_class ON activities(college_id, class_id);
CREATE INDEX IF NOT EXISTS idx_submissions_college_class ON submissions(college_id, class_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student ON submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_impact_college ON impact_records(college_id);
