-- Digitalsight D1 Database Schema

DROP TABLE IF EXISTS users;
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  role TEXT NOT NULL, -- Owner, Label Admin, Sub-Label Admin, Artist, Employee
  designation TEXT, -- For employees and owner
  label_id TEXT, -- Only for Label users
  label_name TEXT, -- Cache for display
  artist_id TEXT, -- Only for Artist users
  artist_name TEXT, -- Cache for display
  permissions TEXT, -- JSON string: { canManageArtists: boolean, ... }
  is_blocked BOOLEAN DEFAULT 0,
  block_reason TEXT,
  reset_token TEXT,
  reset_token_expiry TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS labels;
CREATE TABLE labels (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  parent_label_id TEXT,
  owner_id TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  tax_id TEXT,
  website TEXT,
  phone TEXT,
  revenue_share REAL, -- e.g., 70 for 70%
  max_artists INTEGER,
  status TEXT DEFAULT 'Active', -- Active, Suspended
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS artists;
CREATE TABLE artists (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  label_id TEXT,
  type TEXT, -- Singer, Composer, Lyricist, Producer, Remixer, DJ, Band, Orchestra
  spotify_id TEXT,
  apple_music_id TEXT,
  instagram_url TEXT,
  email TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS releases;
CREATE TABLE releases (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  version_title TEXT,
  release_type TEXT, -- Single, EP, Album, Compilation, Soundtrack
  primary_artist_ids TEXT, -- JSON array of strings
  featured_artist_ids TEXT, -- JSON array of strings
  label_id TEXT,
  upc TEXT,
  catalogue_number TEXT,
  release_date TEXT,
  status TEXT DEFAULT 'Draft', -- Draft, Pending, Needs Info, Rejected, Approved, Processed, Published, Takedown, Cancelled
  artwork_url TEXT,
  artwork_file_name TEXT,
  p_line TEXT,
  c_line TEXT,
  description TEXT,
  explicit BOOLEAN DEFAULT 0,
  genre TEXT,
  sub_genre TEXT,
  mood TEXT,
  language TEXT,
  publisher TEXT,
  film_name TEXT,
  film_director TEXT,
  film_producer TEXT,
  film_banner TEXT,
  film_cast TEXT,
  original_release_date TEXT,
  youtube_content_id BOOLEAN DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (label_id) REFERENCES labels(id)
);

DROP TABLE IF EXISTS tracks;
CREATE TABLE tracks (
  id TEXT PRIMARY KEY,
  release_id TEXT NOT NULL,
  track_number INTEGER,
  disc_number INTEGER DEFAULT 1,
  title TEXT NOT NULL,
  version_title TEXT,
  primary_artist_ids TEXT, -- JSON array
  featured_artist_ids TEXT, -- JSON array
  isrc TEXT,
  duration INTEGER, -- in seconds
  explicit BOOLEAN DEFAULT 0,
  audio_file_name TEXT,
  audio_url TEXT,
  crbt_cut_name TEXT,
  crbt_time TEXT, -- MM:SS
  dolby_isrc TEXT,
  composer TEXT,
  lyricist TEXT,
  language TEXT,
  content_type TEXT, -- Music, Video
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (release_id) REFERENCES releases(id) ON DELETE CASCADE
);

DROP TABLE IF EXISTS notices;
CREATE TABLE notices (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT, -- Urgent, System Update, Policy Change, General Announcement, Company Event
  author_id TEXT,
  author_name TEXT,
  author_designation TEXT,
  target_audience TEXT, -- EmployeeDesignation | 'ALL_STAFF' | 'ALL_LABELS' | 'ALL_ARTISTS' | 'EVERYONE'
  timestamp TEXT DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS revenue_entries;
CREATE TABLE revenue_entries (
  id TEXT PRIMARY KEY,
  label_id TEXT,
  report_month TEXT, -- YYYY-MM
  store TEXT,
  territory TEXT,
  amount REAL,
  payment_status TEXT, -- Paid, Pending
  date TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS interaction_notes;
CREATE TABLE interaction_notes (
  id TEXT PRIMARY KEY,
  release_id TEXT NOT NULL,
  author_name TEXT,
  author_role TEXT,
  message TEXT,
  timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (release_id) REFERENCES releases(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_releases_label ON releases(label_id);
CREATE INDEX idx_tracks_release ON tracks(release_id);
CREATE INDEX idx_artists_label ON artists(label_id);

-- Seed Master User
INSERT INTO users (id, name, email, password_hash, role, designation, permissions)
VALUES (
  'master-root-id',
  'Platform Master',
  'digitalsight.master@gmail.com',
  'Master98610@', -- In production, this should be hashed
  'Owner',
  'Founder / CEO',
  '{"canManageArtists":true,"canManageReleases":true,"canCreateSubLabels":true,"canManageEmployees":true,"canManageNetwork":true,"canViewFinancials":true,"canOnboardLabels":true,"canDeleteReleases":true,"canSubmitAlbums":true}'
);
