import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          role: 'super_admin' | 'admin' | 'accountant' | 'teacher' | 'student' | 'parent'
          phone: string
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          role: 'super_admin' | 'admin' | 'accountant' | 'teacher' | 'student' | 'parent'
          phone: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role?: 'super_admin' | 'admin' | 'accountant' | 'teacher' | 'student' | 'parent'
          phone?: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      classes: {
        Row: {
          id: string
          name: string
          section: string
          class_teacher_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          section: string
          class_teacher_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          section?: string
          class_teacher_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      students: {
        Row: {
          id: string
          user_id: string
          class_id: string
          roll_number: string
          date_of_birth: string
          address: string
          parent_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          class_id: string
          roll_number: string
          date_of_birth: string
          address: string
          parent_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          class_id?: string
          roll_number?: string
          date_of_birth?: string
          address?: string
          parent_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      subjects: {
        Row: {
          id: string
          name: string
          code: string
          class_id: string
          teacher_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          class_id: string
          teacher_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string
          class_id?: string
          teacher_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      exams: {
        Row: {
          id: string
          name: string
          class_id: string
          subject_id: string
          exam_date: string
          total_marks: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          class_id: string
          subject_id: string
          exam_date: string
          total_marks: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          class_id?: string
          subject_id?: string
          exam_date?: string
          total_marks?: number
          created_at?: string
          updated_at?: string
        }
      }
      grades: {
        Row: {
          id: string
          student_id: string
          exam_id: string
          marks_obtained: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          exam_id: string
          marks_obtained: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          exam_id?: string
          marks_obtained?: number
          created_at?: string
          updated_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          student_id: string
          amount: number
          payment_type: 'tuition' | 'exam' | 'other'
          payment_method: 'bank_transfer' | 'cash' | 'online'
          status: 'pending' | 'confirmed' | 'rejected'
          receipt_url: string | null
          transaction_id: string | null
          due_date: string
          paid_date: string | null
          confirmed_by: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          amount: number
          payment_type: 'tuition' | 'exam' | 'other'
          payment_method: 'bank_transfer' | 'cash' | 'online'
          status?: 'pending' | 'confirmed' | 'rejected'
          receipt_url?: string | null
          transaction_id?: string | null
          due_date: string
          paid_date?: string | null
          confirmed_by?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          amount?: number
          payment_type?: 'tuition' | 'exam' | 'other'
          payment_method?: 'bank_transfer' | 'cash' | 'online'
          status?: 'pending' | 'confirmed' | 'rejected'
          receipt_url?: string | null
          transaction_id?: string | null
          due_date?: string
          paid_date?: string | null
          confirmed_by?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      notices: {
        Row: {
          id: string
          title: string
          content: string
          target_audience: 'all' | 'students' | 'teachers' | 'parents' | 'admins'
          event_date: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          target_audience: 'all' | 'students' | 'teachers' | 'parents' | 'admins'
          event_date?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          target_audience?: 'all' | 'students' | 'teachers' | 'parents' | 'admins'
          event_date?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      announcements: {
        Row: {
          id: string
          title: string
          content: string
          priority: 'low' | 'medium' | 'high'
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          priority?: 'low' | 'medium' | 'high'
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          priority?: 'low' | 'medium' | 'high'
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      timetables: {
        Row: {
          id: string
          class_id: string
          day: string
          period: number
          subject_id: string
          teacher_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          class_id: string
          day: string
          period: number
          subject_id: string
          teacher_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          class_id?: string
          day?: string
          period?: number
          subject_id?: string
          teacher_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      study_materials: {
        Row: {
          id: string
          title: string
          description: string
          file_url: string
          subject_id: string
          teacher_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          file_url: string
          subject_id: string
          teacher_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          file_url?: string
          subject_id?: string
          teacher_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      assignments: {
        Row: {
          id: string
          title: string
          description: string
          due_date: string
          subject_id: string
          teacher_id: string
          file_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          due_date: string
          subject_id: string
          teacher_id: string
          file_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          due_date?: string
          subject_id?: string
          teacher_id?: string
          file_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      settings: {
        Row: {
          id: string
          key: string
          value: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          value: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          key?: string
          value?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
