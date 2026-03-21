-- =====================================================
-- المجرة الحضارية - هيكل قاعدة البيانات
-- =====================================================

-- جدول المؤسسات الحضارية
CREATE TABLE IF NOT EXISTS institutions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- البيانات الأساسية
  name TEXT NOT NULL,
  name_ar TEXT,
  name_en TEXT,
  
  -- الموقع الجغرافي
  country TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT,
  
  -- التصنيف
  type TEXT NOT NULL, -- 'educational', 'research', 'media', 'cultural', 'developmental', 'charitable', 'endowment'
  sub_type TEXT,
  
  -- الهوية القانونية
  registration_number TEXT UNIQUE,
  registration_date DATE,
  founded_year INTEGER,
  
  -- التواصل
  website TEXT,
  email TEXT,
  phone TEXT,
  logo_url TEXT,
  
  -- التواصل الاجتماعي
  social_media TEXT, -- JSON object
  
  -- البيانات الكمية للتقييم
  employees_count INTEGER DEFAULT 0,
  projects_count INTEGER DEFAULT 0,
  beneficiaries_count INTEGER DEFAULT 0,
  
  -- الوزن المعياري (يحسب تلقائياً)
  weight REAL DEFAULT 0,
  
  -- حالة المؤسسة
  status TEXT DEFAULT 'active',
  is_verified BOOLEAN DEFAULT FALSE,
  
  -- الشاشة الحضارية
  screen_active BOOLEAN DEFAULT FALSE,
  screen_password TEXT,
  screen_last_active DATETIME,
  
  -- الطابع الزمني
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- جدول الاتفاقيات بين المؤسسات
CREATE TABLE IF NOT EXISTS agreements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_id INTEGER NOT NULL,
  to_id INTEGER NOT NULL,
  
  -- نوع الاتفاقية
  type TEXT NOT NULL, -- 'partnership', 'research', 'exchange', 'collaboration', 'student_exchange', 'faculty_exchange'
  
  -- تفاصيل الاتفاقية
  title TEXT,
  description TEXT,
  document_url TEXT,
  
  -- مدة الاتفاقية
  start_date DATE,
  end_date DATE,
  is_permanent BOOLEAN DEFAULT FALSE,
  
  -- الحالة
  status TEXT DEFAULT 'active',
  is_public BOOLEAN DEFAULT TRUE,
  
  -- الطابع الزمني
  signed_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (from_id) REFERENCES institutions(id),
  FOREIGN KEY (to_id) REFERENCES institutions(id)
);

-- جدول المشاريع المشتركة
CREATE TABLE IF NOT EXISTS joint_projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  
  -- المؤسسات المشاركة (JSON array)
  participating_institutions TEXT, -- [1, 2, 3]
  
  -- حالة المشروع
  status TEXT DEFAULT 'active',
  
  -- التواريخ
  start_date DATE,
  end_date DATE,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- جدول الفعاليات والأحداث
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  institution_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  
  -- نوع الفعالية
  type TEXT NOT NULL, -- 'lecture', 'conference', 'workshop', 'seminar', 'course'
  
  -- التفاصيل
  start_datetime DATETIME NOT NULL,
  end_datetime DATETIME,
  location TEXT,
  is_online BOOLEAN DEFAULT FALSE,
  online_url TEXT,
  
  -- الحالة
  status TEXT DEFAULT 'upcoming', -- 'upcoming', 'ongoing', 'completed', 'cancelled'
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (institution_id) REFERENCES institutions(id)
);

-- جدول الأخبار
CREATE TABLE IF NOT EXISTS news (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  institution_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  
  -- الوسائط
  image_url TEXT,
  video_url TEXT,
  
  -- التصنيف
  category TEXT, -- 'announcement', 'achievement', 'event', 'general'
  
  -- النشر
  is_published BOOLEAN DEFAULT TRUE,
  published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (institution_id) REFERENCES institutions(id)
);

-- جدول المحاضرات والدروس (للشاشة الحضارية)
CREATE TABLE IF NOT EXISTS lectures (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  institution_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  
  -- المحتوى
  video_url TEXT,
  slides_url TEXT,
  
  -- التصنيف
  category TEXT, -- 'lecture', 'lesson', 'course'
  
  -- البث
  is_live BOOLEAN DEFAULT FALSE,
  scheduled_datetime DATETIME,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (institution_id) REFERENCES institutions(id)
);

-- جدول الإعلانات
CREATE TABLE IF NOT EXISTS advertisements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  institution_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  
  -- الاستهداف
  target_type TEXT, -- 'all', 'country', 'city', 'region'
  target_value TEXT, -- country name, city name, etc.
  
  -- الصورة
  image_url TEXT,
  
  -- المدة
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  -- الحالة
  status TEXT DEFAULT 'active',
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (institution_id) REFERENCES institutions(id)
);

-- جدول المستقلين والخدمات
CREATE TABLE IF NOT EXISTS freelancers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  
  -- المهارات
  skills TEXT, -- JSON array
  
  -- التصنيف
  category TEXT, -- 'design', 'translation', 'writing', 'media', 'marketing', 'tech'
  
  -- التقييم
  rating REAL DEFAULT 0,
  completed_projects INTEGER DEFAULT 0,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- جدول المكتبة (الكتب والتقارير)
CREATE TABLE IF NOT EXISTS library_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  institution_id INTEGER,
  title TEXT NOT NULL,
  author TEXT,
  
  -- النوع
  type TEXT NOT NULL, -- 'book', 'report', 'paper', 'study'
  
  -- المحتوى
  description TEXT,
  file_url TEXT,
  cover_image TEXT,
  
  -- التصنيف
  category TEXT,
  tags TEXT, -- JSON array
  
  -- النشر
  is_published BOOLEAN DEFAULT TRUE,
  published_date DATE,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (institution_id) REFERENCES institutions(id)
);

-- جدول البودكاست
CREATE TABLE IF NOT EXISTS podcasts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  institution_id INTEGER,
  title TEXT NOT NULL,
  description TEXT,
  
  -- المحتوى
  audio_url TEXT,
  video_url TEXT,
  duration INTEGER, -- in seconds
  
  -- الضيوف
  guests TEXT, -- JSON array
  
  -- الحلقة
  episode_number INTEGER,
  season_number INTEGER,
  
  -- النشر
  published_date DATE DEFAULT CURRENT_DATE,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (institution_id) REFERENCES institutions(id)
);

-- جدول الحوكمة والتقييم
CREATE TABLE IF NOT EXISTS weight_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  institution_id INTEGER NOT NULL,
  weight REAL NOT NULL,
  calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- مكونات الوزن
  age_factor REAL,
  employees_factor REAL,
  projects_factor REAL,
  agreements_factor REAL,
  beneficiaries_factor REAL,
  screen_factor REAL,
  
  FOREIGN KEY (institution_id) REFERENCES institutions(id)
);

-- إنشاء الفهارس لتحسين الأداء
CREATE INDEX idx_institutions_type ON institutions(type);
CREATE INDEX idx_institutions_country ON institutions(country);
CREATE INDEX idx_institutions_city ON institutions(city);
CREATE INDEX idx_institutions_weight ON institutions(weight);

CREATE INDEX idx_agreements_from ON agreements(from_id);
CREATE INDEX idx_agreements_to ON agreements(to_id);
CREATE INDEX idx_agreements_type ON agreements(type);

CREATE INDEX idx_events_institution ON events(institution_id);
CREATE INDEX idx_events_start ON events(start_datetime);
CREATE INDEX idx_events_type ON events(type);

CREATE INDEX idx_news_institution ON news(institution_id);
CREATE INDEX idx_news_published ON news(published_at);