-- Phase C — Credo Academy courses system

-- 1. Course categories
CREATE TABLE IF NOT EXISTS course_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  slug VARCHAR UNIQUE NOT NULL,
  icon VARCHAR,
  sort_order INT DEFAULT 0
);

INSERT INTO course_categories (name, slug, icon, sort_order) VALUES
('Marketing', 'marketing', '📢', 1),
('Sales', 'sales', '💰', 2),
('Self Development', 'self-development', '🧠', 3),
('Technology', 'technology', '💻', 4),
('Business', 'business', '💼', 5)
ON CONFLICT (slug) DO NOTHING;

-- 2. Courses table
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR NOT NULL,
  slug VARCHAR UNIQUE,
  description TEXT,
  short_description VARCHAR(500),
  thumbnail_url VARCHAR,
  preview_video_url VARCHAR,
  instructor_name VARCHAR,
  instructor_bio TEXT,
  instructor_avatar VARCHAR,
  category_id UUID REFERENCES course_categories(id),
  price_egp DECIMAL(12,2) DEFAULT 0,
  is_free BOOLEAN DEFAULT false,
  target_audience VARCHAR DEFAULT 'all' CHECK (target_audience IN ('all','marketers','customers')),
  access_type VARCHAR DEFAULT 'public'
    CHECK (access_type IN ('public','marketers_only','invited_only','rank_required')),
  required_rank_id UUID REFERENCES ranks(id),
  duration_hours DECIMAL(5,1) DEFAULT 0,
  lessons_count INT DEFAULT 0,
  level VARCHAR DEFAULT 'beginner' CHECK (level IN ('beginner','intermediate','advanced')),
  language VARCHAR DEFAULT 'ar',
  requirements TEXT,
  what_you_learn TEXT,
  status VARCHAR DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  enrolled_count INT DEFAULT 0,
  rating_avg DECIMAL(3,2) DEFAULT 0,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category_id);

-- Backfill access columns on existing deployments
ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS access_type VARCHAR DEFAULT 'public'
    CHECK (access_type IN ('public','marketers_only','invited_only','rank_required')),
  ADD COLUMN IF NOT EXISTS required_rank_id UUID REFERENCES ranks(id);

-- 3. Course sections (chapters)
CREATE TABLE IF NOT EXISTS course_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR NOT NULL,
  sort_order INT DEFAULT 0
);

-- 4. Lessons
CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  section_id UUID REFERENCES course_sections(id) ON DELETE SET NULL,
  title VARCHAR NOT NULL,
  description TEXT,
  content_type VARCHAR DEFAULT 'video' CHECK (content_type IN ('video','pdf','text','quiz')),
  video_url VARCHAR,
  pdf_url VARCHAR,
  text_content TEXT,
  duration_minutes INT DEFAULT 0,
  sort_order INT DEFAULT 0,
  is_free_preview BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lessons_course ON lessons(course_id, sort_order);

-- 5. Course enrollments
CREATE TABLE IF NOT EXISTS course_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id),
  user_id UUID NOT NULL REFERENCES users(id),
  order_id UUID REFERENCES orders(id),
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  completion_pct INT DEFAULT 0,
  certificate_url VARCHAR,
  UNIQUE(course_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_user ON course_enrollments(user_id);

-- 6. Lesson progress
CREATE TABLE IF NOT EXISTS lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES course_enrollments(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id),
  user_id UUID NOT NULL REFERENCES users(id),
  is_completed BOOLEAN DEFAULT false,
  watched_seconds INT DEFAULT 0,
  completed_at TIMESTAMPTZ,
  UNIQUE(enrollment_id, lesson_id)
);

-- 7. Course reviews
CREATE TABLE IF NOT EXISTS course_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id),
  user_id UUID NOT NULL REFERENCES users(id),
  enrollment_id UUID REFERENCES course_enrollments(id),
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  status VARCHAR DEFAULT 'approved',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(course_id, user_id)
);

-- 8. Function to update course stats
CREATE OR REPLACE FUNCTION update_course_stats(p_course_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE courses SET
    lessons_count = (SELECT COUNT(*) FROM lessons WHERE course_id = p_course_id),
    enrolled_count = (SELECT COUNT(*) FROM course_enrollments WHERE course_id = p_course_id),
    rating_avg = (SELECT COALESCE(AVG(rating), 0) FROM course_reviews WHERE course_id = p_course_id AND status = 'approved'),
    updated_at = NOW()
  WHERE id = p_course_id;
END;
$$ LANGUAGE plpgsql;
