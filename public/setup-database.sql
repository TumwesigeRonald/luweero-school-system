-- Run this in your Neon SQL Editor to create all the tables.

CREATE TABLE IF NOT EXISTS teachers (
  id serial PRIMARY KEY,
  full_name varchar(150) NOT NULL,
  email varchar(150) NOT NULL,
  password_hash text NOT NULL,
  role varchar(20) NOT NULL DEFAULT 'teacher',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS teachers_email_uidx ON teachers (email);

CREATE TABLE IF NOT EXISTS sessions (
  id serial PRIMARY KEY,
  token varchar(64) NOT NULL,
  teacher_id integer NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS sessions_token_uidx ON sessions (token);

CREATE TABLE IF NOT EXISTS classes (
  id serial PRIMARY KEY,
  name varchar(100) NOT NULL,
  level varchar(10) NOT NULL,
  stream varchar(50),
  class_teacher_id integer REFERENCES teachers(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subjects (
  id serial PRIMARY KEY,
  name varchar(100) NOT NULL,
  code varchar(20),
  level varchar(10) NOT NULL DEFAULT 'BOTH',
  category varchar(20),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subject_teachers (
  id serial PRIMARY KEY,
  subject_id integer NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  teacher_id integer NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  class_id integer NOT NULL REFERENCES classes(id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS subject_teacher_class_uidx ON subject_teachers (subject_id, teacher_id, class_id);
CREATE INDEX IF NOT EXISTS st_teacher_idx ON subject_teachers (teacher_id);

CREATE TABLE IF NOT EXISTS students (
  id serial PRIMARY KEY,
  admission_no varchar(50) NOT NULL,
  full_name varchar(150) NOT NULL,
  gender varchar(10),
  date_of_birth varchar(20),
  class_id integer NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  guardian_name varchar(150),
  guardian_phone varchar(30),
  photo_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS students_admission_uidx ON students (admission_no);
CREATE INDEX IF NOT EXISTS students_class_idx ON students (class_id);

CREATE TABLE IF NOT EXISTS terms (
  id serial PRIMARY KEY,
  name varchar(50) NOT NULL,
  academic_year integer NOT NULL,
  is_active boolean NOT NULL DEFAULT false,
  next_term_begins_at date,
  next_term_ends_at date,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS marks (
  id serial PRIMARY KEY,
  student_id integer NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject_id integer NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  term_id integer NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
  component varchar(10) NOT NULL,
  score numeric(6,2) NOT NULL,
  entered_by integer REFERENCES teachers(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS marks_unique_entry_uidx ON marks (student_id, subject_id, term_id, component);
CREATE INDEX IF NOT EXISTS marks_student_idx ON marks (student_id);
CREATE INDEX IF NOT EXISTS marks_term_idx ON marks (term_id);

CREATE TABLE IF NOT EXISTS student_terms (
  id serial PRIMARY KEY,
  student_id integer NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  term_id integer NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
  days_present integer,
  days_absent integer,
  fees_balance numeric(12,2),
  fees_paid numeric(12,2),
  conduct varchar(50),
  class_teacher_comment text,
  head_teacher_comment text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS student_term_uidx ON student_terms (student_id, term_id);

CREATE TABLE IF NOT EXISTS settings (
  key varchar(60) PRIMARY KEY,
  value text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ===== Student portal additions =====
ALTER TABLE students ADD COLUMN IF NOT EXISTS password_hash text;

CREATE TABLE IF NOT EXISTS student_sessions (
  id serial PRIMARY KEY,
  token varchar(64) NOT NULL,
  student_id integer NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS student_sessions_token_uidx ON student_sessions (token);
