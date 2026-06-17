import { supabase } from './supabase'

export type UserRole = 'super_admin' | 'admin' | 'accountant' | 'teacher' | 'student' | 'parent'

export interface UserProfile {
  id: string
  email: string
  full_name: string
  role: UserRole
  phone: string
  avatar_url: string | null
  student_id: string | null
  created_at: string
  updated_at: string
}

export async function signUp(email: string, password: string, fullName: string, role: UserRole, phone: string, studentId?: string) {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/login`,
      data: {
        full_name: fullName,
        role: role,
      }
    }
  })

  if (authError) throw authError

  if (authData.user) {
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email,
        full_name: fullName,
        role,
        phone,
        student_id: studentId || null,
      })

    if (profileError) throw profileError
  }

  return authData
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error

  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    console.error('Error fetching user profile:', error)
    return null
  }
  
  return data
}

export async function updateUserProfile(userId: string, updates: Partial<UserProfile>) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

export function hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    super_admin: 6,
    admin: 5,
    accountant: 4,
    teacher: 3,
    parent: 2,
    student: 1,
  }

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}

export function canAccessFeature(userRole: UserRole, feature: string): boolean {
  const permissions: Record<UserRole, string[]> = {
    super_admin: [
      'delete_records',
      'create_users',
      'manage_classes',
      'view_marksheets',
      'manage_users',
      'manage_exams',
      'manage_subjects',
      'manage_noticeboard',
      'edit_settings',
      'create_announcements',
      'manage_payments',
      'print_receipts',
      'manage_class',
      'manage_exam_records',
      'manage_timetable',
      'upload_materials',
      'upload_assignments',
      'view_teacher_profile',
      'view_subjects',
      'view_marks',
      'view_timetable',
      'view_payments',
      'view_noticeboard',
      'manage_profile',
      'view_child_marksheet',
      'view_child_timetable',
      'view_child_payments',
      'make_payments',
    ],
    admin: [
      'manage_classes',
      'view_marksheets',
      'manage_users',
      'manage_exams',
      'manage_subjects',
      'manage_noticeboard',
      'edit_settings',
      'create_announcements',
      'manage_payments',
      'print_receipts',
      'manage_class',
      'manage_exam_records',
      'manage_timetable',
      'upload_materials',
      'upload_assignments',
      'view_teacher_profile',
      'view_subjects',
      'view_marks',
      'view_timetable',
      'view_payments',
      'view_noticeboard',
      'manage_profile',
      'view_child_marksheet',
      'view_child_timetable',
      'view_child_payments',
      'make_payments',
    ],
    accountant: [
      'manage_payments',
      'print_receipts',
      'view_payments',
      'manage_profile',
    ],
    teacher: [
      'manage_class',
      'manage_exam_records',
      'manage_timetable',
      'upload_materials',
      'upload_assignments',
      'view_teacher_profile',
      'view_subjects',
      'view_marks',
      'view_timetable',
      'view_payments',
      'view_noticeboard',
      'manage_profile',
    ],
    student: [
      'view_teacher_profile',
      'view_subjects',
      'view_marks',
      'view_timetable',
      'view_payments',
      'view_noticeboard',
      'manage_profile',
    ],
    parent: [
      'view_teacher_profile',
      'view_child_marksheet',
      'view_child_timetable',
      'view_child_payments',
      'view_noticeboard',
      'make_payments',
      'manage_profile',
    ],
  }

  return permissions[userRole]?.includes(feature) || false
}
