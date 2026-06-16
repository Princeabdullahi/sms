'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { Plus, Pencil, Trash2, Users } from 'lucide-react'

export default function ClassesPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [classes, setClasses] = useState<any[]>([])
  const [teachers, setTeachers] = useState<any[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingClass, setEditingClass] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    section: '',
    class_teacher_id: ''
  })

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchClasses()
      fetchTeachers()
    }
  }, [user])

  async function fetchClasses() {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*, profiles:class_teacher_id(full_name)')
        .order('name', { ascending: true })

      if (error) throw error
      setClasses(data || [])
    } catch (error) {
      console.error('Error fetching classes:', error)
      toast.error('Failed to fetch classes')
    }
  }

  async function fetchTeachers() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'teacher')
        .order('full_name', { ascending: true })

      if (error) throw error
      setTeachers(data || [])
    } catch (error) {
      console.error('Error fetching teachers:', error)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    try {
      if (editingClass) {
        const { error } = await supabase
          .from('classes')
          .update({
            name: formData.name,
            section: formData.section,
            class_teacher_id: formData.class_teacher_id || null
          })
          .eq('id', editingClass.id)

        if (error) throw error
        toast.success('Class updated successfully')
      } else {
        const { error } = await supabase
          .from('classes')
          .insert({
            name: formData.name,
            section: formData.section,
            class_teacher_id: formData.class_teacher_id || null
          })

        if (error) throw error
        toast.success('Class created successfully')
      }

      setDialogOpen(false)
      setEditingClass(null)
      setFormData({
        name: '',
        section: '',
        class_teacher_id: ''
      })
      fetchClasses()
    } catch (error: any) {
      toast.error(error.message || 'Failed to save class')
    }
  }

  async function handleDelete(classId: string) {
    if (!confirm('Are you sure you want to delete this class? This will also delete all associated students and subjects.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', classId)

      if (error) throw error
      toast.success('Class deleted successfully')
      fetchClasses()
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete class')
    }
  }

  async function handleEdit(cls: any) {
    setEditingClass(cls)
    setFormData({
      name: cls.name,
      section: cls.section,
      class_teacher_id: cls.class_teacher_id || ''
    })
    setDialogOpen(true)
  }

  async function handleCreate() {
    setEditingClass(null)
    setFormData({
      name: '',
      section: '',
      class_teacher_id: ''
    })
    setDialogOpen(true)
  }

  async function getStudentCount(classId: string) {
    try {
      const { count } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('class_id', classId)
      return count || 0
    } catch {
      return 0
    }
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

  if (user.role !== 'super_admin' && user.role !== 'admin' && user.role !== 'teacher') {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Access Denied
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            You don't have permission to access this page.
          </p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Class Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage all classes and sections
            </p>
          </div>
          {(user.role === 'super_admin' || user.role === 'admin') && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Class
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingClass ? 'Edit Class' : 'Create New Class'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingClass ? 'Update class information' : 'Add a new class to the system'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Class Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Grade 10"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="section">Section</Label>
                    <Input
                      id="section"
                      placeholder="e.g., A, B, C"
                      value={formData.section}
                      onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="class_teacher_id">Class Teacher (Optional)</Label>
                    <Select
                      value={formData.class_teacher_id}
                      onValueChange={(value) => setFormData({ ...formData, class_teacher_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a teacher" />
                      </SelectTrigger>
                      <SelectContent>
                        {teachers.map((teacher) => (
                          <SelectItem key={teacher.id} value={teacher.id}>
                            {teacher.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full">
                    {editingClass ? 'Update Class' : 'Create Class'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Classes</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Class Teacher</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead>Created</TableHead>
                  {(user.role === 'super_admin' || user.role === 'admin') && (
                    <TableHead className="text-right">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {classes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      No classes found
                    </TableCell>
                  </TableRow>
                ) : (
                  classes.map((cls) => (
                    <TableRow key={cls.id}>
                      <TableCell className="font-medium">{cls.name}</TableCell>
                      <TableCell>{cls.section}</TableCell>
                      <TableCell>
                        {cls.profiles?.full_name || 'Not assigned'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-500" />
                          <StudentCount classId={cls.id} />
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(cls.created_at).toLocaleDateString()}
                      </TableCell>
                      {(user.role === 'super_admin' || user.role === 'admin') && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(cls)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(cls.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

function StudentCount({ classId }: { classId: string }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    async function fetchCount() {
      try {
        const { count } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('class_id', classId)
        setCount(count || 0)
      } catch {
        setCount(0)
      }
    }
    fetchCount()
  }, [classId])

  return <span>{count}</span>
}
