export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      lectures: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          subject_id: string | null
          completed: boolean
          revision_count: number
          last_revised: string | null
          next_revision_date: string | null
          status: 'not_started' | 'in_progress' | 'completed' | 'needs_revision'
          created_at: string
          updated_at: string
          subject_name?: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          subject_id?: string | null
          completed?: boolean
          revision_count?: number
          last_revised?: string | null
          next_revision_date?: string | null
          status?: 'not_started' | 'in_progress' | 'completed' | 'needs_revision'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          subject_id?: string | null
          completed?: boolean
          revision_count?: number
          last_revised?: string | null
          next_revision_date?: string | null
          status?: 'not_started' | 'in_progress' | 'completed' | 'needs_revision'
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lectures_subject_id_fkey"
            columns: ["subject_id"]
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lectures_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      subjects: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          color: string
          total_topics: number
          completed_topics: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          color?: string
          total_topics?: number
          completed_topics?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          color?: string
          total_topics?: number
          completed_topics?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subjects_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      scheduled_lectures: {
        Row: {
          id: string
          user_id: string
          lecture_id: string
          date: string
          start_time: string
          end_time: string
          completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          lecture_id: string
          date: string
          start_time: string
          end_time: string
          completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          lecture_id?: string
          date?: string
          start_time?: string
          end_time?: string
          completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_lectures_lecture_id_fkey"
            columns: ["lecture_id"]
            referencedRelation: "lectures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_lectures_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      notes: {
        Row: {
          id: string
          user_id: string
          lecture_id: string
          title: string
          content: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          lecture_id: string
          title: string
          content?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          lecture_id?: string
          title?: string
          content?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_lecture_id_fkey"
            columns: ["lecture_id"]
            referencedRelation: "lectures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      tags: {
        Row: {
          id: string
          name: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          user_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tags_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      lecture_tags: {
        Row: {
          lecture_id: string
          tag_id: string
        }
        Insert: {
          lecture_id: string
          tag_id: string
        }
        Update: {
          lecture_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lecture_tags_lecture_id_fkey"
            columns: ["lecture_id"]
            referencedRelation: "lectures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lecture_tags_tag_id_fkey"
            columns: ["tag_id"]
            referencedRelation: "tags"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 