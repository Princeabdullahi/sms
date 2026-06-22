'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { Plus, Pencil, Trash2, Calendar, FileText, CheckCircle, XCircle } from 'lucide-react'
import { format } from 'date-fns'

export default function AssignmentsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [assignments, setAssignments] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<any>(null)
  const [monthlyCount, setMonthlyCount] = useState(0)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    class_id: '',
    due_date: '',
    points: '',
    status: 'active'
  })

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchAssignments()
      fetchClasses()
      fetchMonthlyCount()
    }
  }, [user])

  async function fetchAssignments() {
    if (!user) return
    try {
      let query = supabase
        .from('assignments')
        .select('*, classes(name, section), profiles:created_by(full_name)')
        .order('created_at', { ascending: false })

      if (user.role === 'teacher') {
        query = query.eq('created_by', user.id)
      }

      const { data, error } = await query
      if (error) throw error
      setAssignments(data || [])
    } catch (error) {
      console.error('Error fetching assignments:', error)
      toast.error('Failed to fetch assignments')
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

  async function fetchMonthlyCount() {
    try {
      const startDate = new Date()
      startDate.setDate(1)
      startDate.setHours(0, 0, 0, 0)

      const { count } = await supabase
        .from('assignments')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString())

      setMonthlyCount(count || 0)
    } catch (error) {
      console.error('Error fetching monthly count:', error)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    try {
      if (editingAssignment) {
        const { error } = await supabase
          .from('assignments')
          .update({
            title: formData.title,
            description: formData.description,
            class_id: formData.class_id,
            due_date: formData.due_date,
            points: parseInt(formData.points),
            status: formData.status
          })
          .eq('id', editingAssignment.id)

        if (error) throw error
        toast.success('Assignment updated successfully')
      } else {
        const { error } = await supabase
          .from('assignments')
          .insert({
            title: formData.title,
            description: formData.description,
            class_id: formData.class_id,
            due_date: formData.due_date,
            points: parseInt(formData.points),
            status: formData.status,
            created_by: user!.id
          })

        if (error) throw error
        toast.success('Assignment created successfully')
      }

      setDialogOpen(false)
      setEditingAssignment(null)
      setFormData({
        title: '',
        description: '',
        class_id: '',
        due_date: '',
        points: '',
        status: 'active'
      })
      fetchAssignments()
      fetchMonthlyCount()
    } catch (error: any) {
      toast.error(error.message || 'Failed to save assignment')
    }
  }

  async function handleDelete(assignmentId: string) {
    if (!confirm('Are you sure you want to delete this assignment?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', assignmentId)

      if (error) throw error
      toast.success('Assignment deleted successfully')
      fetchAssignments()
      fetchMonthlyCount()
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete assignment')
    }
  }

  async function handleEdit(assignment: any) {
    setEditingAssignment(assignment)
    setFormData({
      title: assignment.title,
      description: assignment.description,
      class_id: assignment.class_id,
      due_date: assignment.due_date,
      points: assignment.points.toString(),
      status: assignment.status
    })
    setDialogOpen(true)
  }

  async function handleCreate() {
    setEditingAssignment(null)
    setFormData({
      title: '',
      description: '',
      class_id: '',
      due_date: '',
      points: '',
      status: 'active'
    })
    setDialogOpen(true)
  }

  function getStatusBadgeColor(status: string) {
    const colors: Record<string, string> = {
      active: 'bg-green-500',
      completed: 'bg-blue-500',
      overdue: 'bg-red-500'
    }
    return colors[status] || 'bg-gray-500'
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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Assignments
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage homework and assignments
            </p>
          </div>
          <div className="flex items-center gap-4">
            {(user.role === 'super_admin' || user.role === 'admin') && (
              <Card className="px-4 py-2">
                <div className="text-sm text-gray-600 dark:text-gray-400">This Month</div>
                <div className="text-2xl font-bold">{monthlyCount}</div>
              </Card>
            )}
            {(user.role === 'super_admin' || user.role === 'admin' || user.role === 'teacher') && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={handleCreate}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Assignment
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {editingAssignment ? 'Edit Assignment' : 'Create New Assignment'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingAssignment ? 'Update assignment details' : 'Create a new assignment'}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        placeholder="Assignment title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Assignment description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        required
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="class_id">Class</Label>
                      <Select
                        value={formData.class_id}
                        onValueChange={(value) => setFormData({ ...formData, class_id: value })}
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
                      <Label htmlFor="due_date">Due Date</Label>
                      <Input
                        id="due_date"
                        type="date"
                        value={formData.due_date}
                        onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="points">Points</Label>
                      <Input
                        id="points"
                        type="number"
                        placeholder="e.g., 100"
                        value={formData.points}
                        onChange={(e) => setFormData({ ...formData, points: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) => setFormData({ ...formData, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="overdue">Overdue</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="submit" className="w-full">
                      {editingAssignment ? 'Update Assignment' : 'Create Assignment'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created By</TableHead>
                  {(user.role === 'super_admin' || user.role === 'admin' || user.role === 'teacher') && (
                    <TableHead className="text-right">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No assignments found
                    </TableCell>
                  </TableRow>
                ) : (
                  assignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell className="font-medium">{assignment.title}</TableCell>
                      <TableCell>
                        {assignment.classes ? `${assignment.classes.name} - ${assignment.classes.section}` : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          {assignment.due_date ? format(new Date(assignment.due_date), 'PPP') : 'Not set'}
                        </div>
                      </TableCell>
                      <TableCell>{assignment.points}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(assignment.status)}>
                          {assignment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {assignment.profiles?.full_name || 'Unknown'}
                      </TableCell>
                      {(user.role === 'super_admin' || user.role === 'admin' || user.role === 'teacher') && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(assignment)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(assignment.id)}
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
