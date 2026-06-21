'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { updateUserProfile } from '@/lib/auth'
import { User, Mail, Phone, Save, Upload } from 'lucide-react'

export default function ProfilePage() {
  const { user, loading, refreshUser } = useAuth()
  const router = useRouter()
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    avatar_url: ''
  })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [studentInfo, setStudentInfo] = useState<any>(null)
  const [parentInfo, setParentInfo] = useState<any>(null)
  const [classInfo, setClassInfo] = useState<any>(null)
  const [teacherInfo, setTeacherInfo] = useState<any>(null)
  const [childrenInfo, setChildrenInfo] = useState<any[]>([])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name,
        phone: user.phone,
        avatar_url: user.avatar_url || ''
      })
      fetchAdditionalInfo()
    }
  }, [user])

  async function fetchAdditionalInfo() {
    if (!user) return

    try {
      if (user.role === 'student') {
        // Fetch student info including class and parent
        const { data: studentData } = await supabase
          .from('students')
          .select('*, classes(*), profiles:parent_id(full_name, email, phone)')
          .eq('user_id', user.id)
          .single()

        if (studentData) {
          setStudentInfo(studentData)
          setClassInfo(studentData.classes)
          setParentInfo(studentData.profiles)

          // Fetch class teacher
          if (studentData.classes?.class_teacher_id) {
            const { data: teacherData } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', studentData.classes.class_teacher_id)
              .single()
            setTeacherInfo(teacherData)
          }
        }
      } else if (user.role === 'parent') {
        // Fetch children info
        const { data: childrenData } = await supabase
          .from('students')
          .select('*, classes(*), profiles:user_id(full_name, student_id, email), teachers:classes.class_teacher_id(full_name, email)')
          .eq('parent_id', user.id)

        if (childrenData) {
          setChildrenInfo(childrenData)
        }
      }
    } catch (error) {
      console.error('Error fetching additional info:', error)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      let avatarUrl = formData.avatar_url

      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop()
        const fileName = `${user!.id}_${Date.now()}.${fileExt}`
        const filePath = `avatars/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile, { upsert: true })

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath)

        avatarUrl = publicUrl
      }

      await updateUserProfile(user!.id, {
        full_name: formData.full_name,
        phone: formData.phone,
        avatar_url: avatarUrl
      })

      toast.success('Profile updated successfully')
      refreshUser()
      setAvatarFile(null)
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  function getInitials(name: string) {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            My Profile
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage your personal information
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Profile Picture</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              <Avatar className="h-32 w-32">
                <AvatarImage src={formData.avatar_url || undefined} />
                <AvatarFallback className="text-2xl">
                  {getInitials(formData.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="w-full">
                <Label htmlFor="avatar" className="sr-only">
                  Upload Avatar
                </Label>
                <Input
                  id="avatar"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => document.getElementById('avatar')?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Change Avatar
                </Button>
                {avatarFile && (
                  <p className="text-sm text-gray-500 mt-2 text-center">
                    {avatarFile.name}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={user.email}
                      disabled
                      className="pl-10 bg-gray-50 dark:bg-gray-800"
                    />
                  </div>
                  <p className="text-xs text-gray-500">Email cannot be changed</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      required
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    value={user.role.replace('_', ' ').toUpperCase()}
                    disabled
                    className="bg-gray-50 dark:bg-gray-800"
                  />
                </div>

                <Button type="submit" className="w-full" disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="font-medium">Account Created</span>
                <span className="text-gray-600 dark:text-gray-400">
                  {new Date(user.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="font-medium">Last Updated</span>
                <span className="text-gray-600 dark:text-gray-400">
                  {new Date(user.updated_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="font-medium">User ID</span>
                <span className="text-gray-600 dark:text-gray-400 font-mono text-sm">
                  {user.id}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Student Information Section */}
        {user.role === 'student' && (
          <Card>
            <CardHeader>
              <CardTitle>Academic Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {classInfo && (
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="font-medium">Class</span>
                    <span className="text-gray-600 dark:text-gray-400">
                      {classInfo.name} - {classInfo.section}
                    </span>
                  </div>
                )}
                {teacherInfo && (
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="font-medium">Class Teacher</span>
                    <span className="text-gray-600 dark:text-gray-400">
                      {teacherInfo.full_name}
                    </span>
                  </div>
                )}
                {parentInfo && (
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="font-medium">Parent</span>
                    <span className="text-gray-600 dark:text-gray-400">
                      {parentInfo.full_name}
                    </span>
                  </div>
                )}
                {user.student_id && (
                  <div className="flex justify-between items-center py-2">
                    <span className="font-medium">Student ID</span>
                    <span className="text-gray-600 dark:text-gray-400 font-mono">
                      {user.student_id}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Parent Information Section */}
        {user.role === 'parent' && (
          <Card>
            <CardHeader>
              <CardTitle>Children Information</CardTitle>
            </CardHeader>
            <CardContent>
              {childrenInfo.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No children linked to your account</p>
              ) : (
                <div className="space-y-4">
                  {childrenInfo.map((child) => (
                    <div key={child.id} className="border rounded-lg p-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{child.profiles?.full_name}</span>
                          <span className="text-sm text-gray-500">{child.profiles?.student_id || 'No ID'}</span>
                        </div>
                        {child.classes && (
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Class: {child.classes.name} - {child.classes.section}
                          </div>
                        )}
                        {child.teachers && (
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Class Teacher: {child.teachers.full_name}
                          </div>
                        )}
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Email: {child.profiles?.email}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
