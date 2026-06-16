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
import { Calendar } from '@/components/ui/calendar'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { Plus, Pencil, Trash2, Bell, Calendar as CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'

export default function NoticeboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [notices, setNotices] = useState<any[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingNotice, setEditingNotice] = useState<any>(null)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    target_audience: 'all',
    event_date: undefined as Date | undefined
  })

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchNotices()
    }
  }, [user])

  async function fetchNotices() {
    try {
      const { data, error } = await supabase
        .from('notices')
        .select('*, profiles:created_by(full_name)')
        .order('created_at', { ascending: false })

      if (error) throw error
      setNotices(data || [])
    } catch (error) {
      console.error('Error fetching notices:', error)
      toast.error('Failed to fetch notices')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    try {
      if (editingNotice) {
        const { error } = await supabase
          .from('notices')
          .update({
            title: formData.title,
            content: formData.content,
            target_audience: formData.target_audience,
            event_date: formData.event_date ? formData.event_date.toISOString() : null
          })
          .eq('id', editingNotice.id)

        if (error) throw error
        toast.success('Notice updated successfully')
      } else {
        const { error } = await supabase
          .from('notices')
          .insert({
            title: formData.title,
            content: formData.content,
            target_audience: formData.target_audience,
            event_date: formData.event_date ? formData.event_date.toISOString() : null,
            created_by: user!.id
          })

        if (error) throw error
        toast.success('Notice created successfully')
      }

      setDialogOpen(false)
      setEditingNotice(null)
      setFormData({
        title: '',
        content: '',
        target_audience: 'all',
        event_date: undefined
      })
      fetchNotices()
    } catch (error: any) {
      toast.error(error.message || 'Failed to save notice')
    }
  }

  async function handleDelete(noticeId: string) {
    if (!confirm('Are you sure you want to delete this notice?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('notices')
        .delete()
        .eq('id', noticeId)

      if (error) throw error
      toast.success('Notice deleted successfully')
      fetchNotices()
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete notice')
    }
  }

  function handleEdit(notice: any) {
    setEditingNotice(notice)
    setFormData({
      title: notice.title,
      content: notice.content,
      target_audience: notice.target_audience,
      event_date: notice.event_date ? new Date(notice.event_date) : null
    })
    setDialogOpen(true)
  }

  function handleCreate() {
    setEditingNotice(null)
    setFormData({
      title: '',
      content: '',
      target_audience: 'all',
      event_date: undefined
    })
    setDialogOpen(true)
  }

  function getAudienceBadgeColor(audience: string) {
    const colors: Record<string, string> = {
      all: 'bg-blue-500',
      students: 'bg-green-500',
      teachers: 'bg-purple-500',
      parents: 'bg-pink-500',
      admins: 'bg-orange-500'
    }
    return colors[audience] || 'bg-gray-500'
  }

  function canViewNotice(notice: any) {
    if (notice.target_audience === 'all') return true
    if (user?.role === 'super_admin' || user?.role === 'admin') return true
    return notice.target_audience === user?.role
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

  const canManageNotices = user.role === 'super_admin' || user.role === 'admin'
  const filteredNotices = notices.filter(canViewNotice)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Noticeboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              School notices and events
            </p>
          </div>
          {canManageNotices && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Notice
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingNotice ? 'Edit Notice' : 'Create New Notice'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingNotice ? 'Update notice information' : 'Add a new notice to the noticeboard'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      placeholder="Notice title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="content">Content</Label>
                    <Textarea
                      id="content"
                      placeholder="Notice content"
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      required
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="target_audience">Target Audience</Label>
                    <Select
                      value={formData.target_audience}
                      onValueChange={(value) => setFormData({ ...formData, target_audience: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Everyone</SelectItem>
                        <SelectItem value="students">Students</SelectItem>
                        <SelectItem value="teachers">Teachers</SelectItem>
                        <SelectItem value="parents">Parents</SelectItem>
                        <SelectItem value="admins">Admins</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Event Date (Optional)</Label>
                    <div className="relative">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                        onClick={() => setCalendarOpen(!calendarOpen)}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.event_date ? format(formData.event_date, 'PPP') : 'Pick a date'}
                      </Button>
                      {calendarOpen && (
                        <div className="absolute top-full left-0 z-50 mt-2 bg-white dark:bg-gray-800 border rounded-lg shadow-lg p-4">
                          <Calendar
                            mode="single"
                            selected={formData.event_date}
                            onSelect={(date) => {
                              setFormData({ ...formData, event_date: date })
                              setCalendarOpen(false)
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <Button type="submit" className="w-full">
                    {editingNotice ? 'Update Notice' : 'Create Notice'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotices.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="text-center py-12">
                <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No notices found</p>
              </CardContent>
            </Card>
          ) : (
            filteredNotices.map((notice) => (
              <Card key={notice.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg">{notice.title}</CardTitle>
                    <Badge className={getAudienceBadgeColor(notice.target_audience)}>
                      {notice.target_audience}
                    </Badge>
                  </div>
                  {notice.event_date && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <CalendarIcon className="h-4 w-4" />
                      {format(new Date(notice.event_date), 'PPP')}
                    </div>
                  )}
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {notice.content}
                  </p>
                  <div className="mt-4 pt-4 border-t text-sm text-gray-500">
                    Posted by {notice.profiles?.full_name || 'Unknown'}
                  </div>
                </CardContent>
                {canManageNotices && (
                  <div className="p-4 pt-0 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEdit(notice)}
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleDelete(notice.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
