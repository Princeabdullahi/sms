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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { Plus, Pencil, Trash2, FileText, GraduationCap } from 'lucide-react'

export default function ExamsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [exams, setExams] = useState<any[]>([])
  const [grades, setGrades] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [gradeDialogOpen, setGradeDialogOpen] = useState(false)
  const [editingExam, setEditingExam] = useState<any>(null)
  const [selectedExam, setSelectedExam] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    class_id: '',
    subject_id: '',
    exam_date: '',
    total_marks: 100
  })
  const [gradeFormData, setGradeFormData] = useState({
    student_id: '',
    marks_obtained: 0
  })

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchExams()
      fetchClasses()
      fetchSubjects()
    }
  }, [user])

  useEffect(() => {
    if (selectedExam) {
      fetchGrades(selectedExam.id)
      fetchStudents(selectedExam.class_id)
    }
  }, [selectedExam])

  async function fetchExams() {
    try {
      const { data, error } = await supabase
        .from('exams')
        .select('*, classes(name, section), subjects(name, code)')
        .order('exam_date', { ascending: true })

      if (error) throw error
      setExams(data || [])
    } catch (error) {
      console.error('Error fetching exams:', error)
      toast.error('Failed to fetch exams')
    }
  }

  async function fetchGrades(examId: string) {
    try {
      const { data, error } = await supabase
        .from('grades')
        .select('*, students(user_id, roll_number), profiles:students.user_id(full_name)')
        .eq('exam_id', examId)

      if (error) throw error
      setGrades(data || [])
    } catch (error) {
      console.error('Error fetching grades:', error)
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

  async function fetchStudents(classId: string) {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*, profiles:user_id(full_name)')
        .eq('class_id', classId)
        .order('roll_number', { ascending: true })

      if (error) throw error
      setStudents(data || [])
    } catch (error) {
      console.error('Error fetching students:', error)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    try {
      if (editingExam) {
        const { error } = await supabase
          .from('exams')
          .update({
            name: formData.name,
            class_id: formData.class_id,
            subject_id: formData.subject_id,
            exam_date: formData.exam_date,
            total_marks: formData.total_marks
          })
          .eq('id', editingExam.id)

        if (error) throw error
        toast.success('Exam updated successfully')
      } else {
        const { error } = await supabase
          .from('exams')
          .insert({
            name: formData.name,
            class_id: formData.class_id,
            subject_id: formData.subject_id,
            exam_date: formData.exam_date,
            total_marks: formData.total_marks
          })

        if (error) throw error
        toast.success('Exam created successfully')
      }

      setDialogOpen(false)
      setEditingExam(null)
      setFormData({
        name: '',
        class_id: '',
        subject_id: '',
        exam_date: '',
        total_marks: 100
      })
      fetchExams()
    } catch (error: any) {
      toast.error(error.message || 'Failed to save exam')
    }
  }

  async function handleGradeSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    try {
      const { error } = await supabase
        .from('grades')
        .upsert({
          student_id: gradeFormData.student_id,
          exam_id: selectedExam.id,
          marks_obtained: gradeFormData.marks_obtained
        })

      if (error) throw error
      toast.success('Grade saved successfully')
      setGradeDialogOpen(false)
      setGradeFormData({ student_id: '', marks_obtained: 0 })
      fetchGrades(selectedExam.id)
    } catch (error: any) {
      toast.error(error.message || 'Failed to save grade')
    }
  }

  async function handleDelete(examId: string) {
    if (!confirm('Are you sure you want to delete this exam? This will also delete all associated grades.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('exams')
        .delete()
        .eq('id', examId)

      if (error) throw error
      toast.success('Exam deleted successfully')
      fetchExams()
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete exam')
    }
  }

  function handleEdit(exam: any) {
    setEditingExam(exam)
    setFormData({
      name: exam.name,
      class_id: exam.class_id,
      subject_id: exam.subject_id,
      exam_date: exam.exam_date,
      total_marks: exam.total_marks
    })
    setDialogOpen(true)
  }

  function handleCreate() {
    setEditingExam(null)
    setFormData({
      name: '',
      class_id: '',
      subject_id: '',
      exam_date: '',
      total_marks: 100
    })
    setDialogOpen(true)
  }

  function handleViewGrades(exam: any) {
    setSelectedExam(exam)
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

  const canManageExams = user.role === 'super_admin' || user.role === 'admin' || user.role === 'teacher'

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Exams & Grades
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage exams and student grades
            </p>
          </div>
          {canManageExams && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Exam
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingExam ? 'Edit Exam' : 'Create New Exam'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingExam ? 'Update exam information' : 'Add a new exam to the system'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Exam Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Mid-Term Exam"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
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
                    <Label htmlFor="exam_date">Exam Date</Label>
                    <Input
                      id="exam_date"
                      type="date"
                      value={formData.exam_date}
                      onChange={(e) => setFormData({ ...formData, exam_date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="total_marks">Total Marks</Label>
                    <Input
                      id="total_marks"
                      type="number"
                      value={formData.total_marks}
                      onChange={(e) => setFormData({ ...formData, total_marks: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    {editingExam ? 'Update Exam' : 'Create Exam'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Tabs defaultValue="exams" className="w-full">
          <TabsList>
            <TabsTrigger value="exams">Exams</TabsTrigger>
            {selectedExam && (
              <TabsTrigger value="grades">Grades - {selectedExam.name}</TabsTrigger>
            )}
          </TabsList>
          <TabsContent value="exams">
            <Card>
              <CardHeader>
                <CardTitle>All Exams</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Exam Name</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Total Marks</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {exams.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          No exams found
                        </TableCell>
                      </TableRow>
                    ) : (
                      exams.map((exam) => (
                        <TableRow key={exam.id}>
                          <TableCell className="font-medium">{exam.name}</TableCell>
                          <TableCell>
                            {exam.classes ? `${exam.classes.name} - ${exam.classes.section}` : 'N/A'}
                          </TableCell>
                          <TableCell>
                            {exam.subjects ? `${exam.subjects.name} (${exam.subjects.code})` : 'N/A'}
                          </TableCell>
                          <TableCell>{new Date(exam.exam_date).toLocaleDateString()}</TableCell>
                          <TableCell>{exam.total_marks}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewGrades(exam)}
                              >
                                <FileText className="h-4 w-4 mr-1" />
                                Grades
                              </Button>
                              {canManageExams && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEdit(exam)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDelete(exam.id)}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          {selectedExam && (
            <TabsContent value="grades">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Grades - {selectedExam.name}</CardTitle>
                    {canManageExams && (
                      <Dialog open={gradeDialogOpen} onOpenChange={setGradeDialogOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Grade
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Add Student Grade</DialogTitle>
                            <DialogDescription>
                              Enter marks for a student
                            </DialogDescription>
                          </DialogHeader>
                          <form onSubmit={handleGradeSubmit} className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="student_id">Student</Label>
                              <Select
                                value={gradeFormData.student_id}
                                onValueChange={(value) => setGradeFormData({ ...gradeFormData, student_id: value })}
                                required
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a student" />
                                </SelectTrigger>
                                <SelectContent>
                                  {students.map((student) => (
                                    <SelectItem key={student.id} value={student.id}>
                                      {student.profiles?.full_name} ({student.roll_number})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="marks_obtained">Marks Obtained</Label>
                              <Input
                                id="marks_obtained"
                                type="number"
                                max={selectedExam.total_marks}
                                value={gradeFormData.marks_obtained}
                                onChange={(e) => setGradeFormData({ ...gradeFormData, marks_obtained: parseInt(e.target.value) })}
                                required
                              />
                            </div>
                            <Button type="submit" className="w-full">
                              Save Grade
                            </Button>
                          </form>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Roll Number</TableHead>
                        <TableHead>Marks Obtained</TableHead>
                        <TableHead>Total Marks</TableHead>
                        <TableHead>Percentage</TableHead>
                        {canManageExams && <TableHead className="text-right">Actions</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {grades.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8">
                            No grades found for this exam
                          </TableCell>
                        </TableRow>
                      ) : (
                        grades.map((grade) => (
                          <TableRow key={grade.id}>
                            <TableCell className="font-medium">
                              {grade.profiles?.full_name || 'Unknown'}
                            </TableCell>
                            <TableCell>{grade.students?.roll_number || 'N/A'}</TableCell>
                            <TableCell>{grade.marks_obtained}</TableCell>
                            <TableCell>{selectedExam.total_marks}</TableCell>
                            <TableCell>
                              {((grade.marks_obtained / selectedExam.total_marks) * 100).toFixed(2)}%
                            </TableCell>
                            {canManageExams && (
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setGradeFormData({
                                      student_id: grade.student_id,
                                      marks_obtained: grade.marks_obtained
                                    })
                                    setGradeDialogOpen(true)
                                  }}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            )}
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
