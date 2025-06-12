// Type definitions for Supabase tables
export type Subject = {
  id: string;
  user_id: string;
  name: string;
  total_topics: number;
  completed_topics: number;
  color: string;
  created_at: string;
  updated_at: string;
};

export type Task = {
  id: string;
  user_id: string;
  title: string;
  subject_id: string | null;
  scheduled_date: string;
  time: string;
  duration: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
  subjects?: { name: string } | null;
  subject_name?: string;
};

export type Reminder = {
  id: string;
  user_id: string;
  title: string;
  time: string;
  days: string[];
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type Note = {
  id: string;
  user_id: string;
  title: string;
  content: string | null;
  created_at: string;
  updated_at: string;
};

export type StudySession = {
  id: string;
  user_id: string;
  duration: number;
  session_date: string;
  created_at: string;
};

export type Lecture = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  subject_id: string | null;
  completed: boolean;
  revision_count: number;
  last_revised: string | null;
  next_revision_date: string | null;
  status: 'not_started' | 'in_progress' | 'completed' | 'needs_revision';
  created_at: string;
  updated_at: string;
  subjects?: { name: string } | null;
  subject_name?: string;
};
