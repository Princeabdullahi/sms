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
import { Plus, Pencil, Trash2, Calendar } from 'lucide-react'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8]

export default function TimetablePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [timetables, setTimetables] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [teachers, setTeachers] = useState<any[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTimetable, setEditingTimetable] = useState<any>(null)
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [formData, setFormData] = useState({
    class_id: '',
    day: 'Monday',
    period: 1,
    subject_id: '',
    teacher_id: ''
  })

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchClasses()
      fetchSubjects()
      fetchTeachers()
    }
  }, [user])

  useEffect(() => {
    if (selectedClass) {
      fetchTimetables(selectedClass)
    }
  }, [selectedClass])

  async function fetchTimetables(classId: string) {
    try {
      const { data, error } = await supabase
        .from('timetables')
        .select('*, subjects(name, code), profiles:teacher_id(full_name)')
        .eq('class_id', classId)
        .order('day', { ascending: true })

      if (error) throw error
      setTimetables(data || [])
    } catch (error) {
      console.error('Error fetching timetables:', error)
      toast.error('Failed to fetch timetables')
    }
  }

  async function fetchClasses() {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      setClasses(data || [])
      if (data && data.length > 0) {
        setSelectedClass(data[0].id)
      }
    } catch (error) {
      console.error('Error fetching classes:', error)
    }
  }

  async function fetchSubjects() {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      setSubjects(data || [])
    } catch (error) {
      console.error('Error fetching subjects:', error)
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
      if (editingTimetable) {
        const { error } = await supabase
          .from('timetables')
          .update({
            class_id: formData.class_id,
            day: formData.day,
            period: formData.period,
            subject_id: formData.subject_id,
            teacher_id: formData.teacher_id
          })
          .eq('id', editingTimetable.id)

        if (error) throw error
        toast.success('Timetable updated successfully')
      } else {
        const { error } = await supabase
          .from('timetables')
          .insert({
            class_id: formData.class_id,
            day: formData.day,
            period: formData.period,
            subject_id: formData.subject_id,
            teacher_id: formData.teacher_id
          })

        if (error) throw error
        toast.success('Timetable created successfully')
      }

      setDialogOpen(false)
      setEditingTimetable(null)
      setFormData({
        class_id: '',
        day: 'Monday',
        period: 1,
        subject_id: '',
        teacher_id: ''
      })
      fetchTimetables(formData.class_id)
    } catch (error: any) {
      toast.error(error.message || 'Failed to save timetable')
    }
  }

  async function handleDelete(timetableId: string) {
    if (!confirm('Are you sure you want to delete this timetable entry?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('timetables')
        .delete()
        .eq('id', timetableId)

      if (error) throw error
      toast.success('Timetable entry deleted successfully')
      fetchTimetables(selectedClass)
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete timetable entry')
    }
  }

  function handleEdit(timetable: any) {
    setEditingTimetable(timetable)
    setFormData({
      class_id: timetable.class_id,
      day: timetable.day,
      period: timetable.period,
      subject_id: timetable.subject_id,
      teacher_id: timetable.teacher_id
    })
    setDialogOpen(true)
  }

  function handleCreate() {
    setEditingTimetable(null)
    setFormData({
      class_id: selectedClass,
      day: 'Monday',
      period: 1,
      subject_id: '',
      teacher_id: ''
    })
    setDialogOpen(true)
  }

  function getTimetableForDayAndPeriod(day: string, period: number) {
    return timetables.find(t => t.day === day && t.period === period)
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

  const canManageTimetable = user.role === 'super_admin' || user.role === 'admin' || user.role === 'teacher'

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Class Timetable
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              View and manage class schedules
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name} - {cls.section}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {canManageTimetable && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={handleCreate}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Entry
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {editingTimetable ? 'Edit Timetable Entry' : 'Add Timetable Entry'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingTimetable ? 'Update timetable information' : 'Add a new timetable entry'}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="class_id">Class</Label>
                      <Select
                        value={formData.class_id}
                        onValueChange={(value) => setFormData({ ...formData, class_id: value })}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a class" />
                        </SelectTrigger>
                        <SelectContent>
                          {classes.map((cls) => (
                            <SelectItem key={cls.id} value={cls.id}>
                              {cls.name} - {cls.section}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="day">Day</Label>
                      <Select
                        value={formData.day}
                        onValueChange={(value) => setFormData({ ...formData, day: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DAYS.map((day) => (
                            <SelectItem key={day} value={day}>
                              {day}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="period">Period</Label>
                      <Select
                        value={formData.period.toString()}
                        onValueChange={(value) => setFormData({ ...formData, period: parseInt(value) })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PERIODS.map((period) => (
                            <SelectItem key={period} value={period.toString()}>
                              Period {period}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject_id">Subject</Label>
                      <Select
                        value={formData.subject_id}
                        onValueChange={(value) => setFormData({ ...formData, subject_id: value })}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a subject" />
                        </SelectTrigger>
                        <SelectContent>
                          {subjects
                            .filter(s => !formData.class_id || s.class_id === formData.class_id)
                            .map((subject) => (
                            <SelectItem key={subject.id} value={subject.id}>
                              {subject.name} ({subject.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="teacher_id">Teacher</Label>
                      <Select
                        value={formData.teacher_id}
                        onValueChange={(value) => setFormData({ ...formData, teacher_id: value })}
                        required
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
                      {editingTimetable ? 'Update Entry' : 'Add Entry'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {selectedClass && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Weekly Timetable
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">Period</TableHead>
                      {DAYS.map((day) => (
                        <TableHead key={day} className="min-w-[150px]">{day}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {PERIODS.map((period) => (
                      <TableRow key={period}>
                        <TableCell className="font-medium">Period {period}</TableCell>
                        {DAYS.map((day) => {
                          const entry = getTimetableForDayAndPeriod(day, period)
                          return (
                            <TableCell key={`${day}-${period}`}>
                              {entry ? (
                                <div className="space-y-1">
                                  <div className="font-medium text-sm">
                                    {entry.subjects?.name}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {entry.profiles?.full_name}
                                  </div>
                                  {canManageTimetable && (
                                    <div className="flex gap-1 mt-1">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={() => handleEdit(entry)}
                                      >
                                        <Pencil className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={() => handleDelete(entry.id)}
                                      >
                                        <Trash2 className="h-3 w-3 text-red-500" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-400 text-sm">Free</span>
                              )}
                            </TableCell>
                          )
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
