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
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { Plus, Trash2, Upload, Download, FileText } from 'lucide-react'

export default function MaterialsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [materials, setMaterials] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject_id: '',
    file_url: ''
  })
  const [file, setFile] = useState<File | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchMaterials()
      fetchSubjects()
    }
  }, [user])

  async function fetchMaterials() {
    try {
      let query = supabase
        .from('study_materials')
        .select('*, subjects(name, code), profiles:teacher_id(full_name)')
        .order('created_at', { ascending: false })

      if (user?.role === 'student') {
        const { data: studentData } = await supabase
          .from('students')
          .select('class_id')
          .eq('user_id', user.id)
          .single()
        
        if (studentData) {
          const { data: subjectData } = await supabase
            .from('subjects')
            .select('id')
            .eq('class_id', studentData.class_id)
          
          if (subjectData) {
            const subjectIds = subjectData.map(s => s.id)
            query = query.in('subject_id', subjectIds)
          }
        }
      }

      const { data, error } = await query

      if (error) throw error
      setMaterials(data || [])
    } catch (error) {
      console.error('Error fetching materials:', error)
      toast.error('Failed to fetch materials')
    }
  }

  async function fetchSubjects() {
    try {
      let query = supabase
        .from('subjects')
        .select('*')
        .order('name', { ascending: true })

      if (user?.role === 'teacher') {
        query = query.eq('teacher_id', user.id)
      }

      const { data, error } = await query

      if (error) throw error
      setSubjects(data || [])
    } catch (error) {
      console.error('Error fetching subjects:', error)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!file) {
      toast.error('Please select a file to upload')
      return
    }

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}_${file.name}`
      const filePath = `materials/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('study-materials')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('study-materials')
        .getPublicUrl(filePath)

      const { error } = await supabase
        .from('study_materials')
        .insert({
          title: formData.title,
          description: formData.description,
          file_url: publicUrl,
          subject_id: formData.subject_id,
          teacher_id: user!.id
        })

      if (error) throw error
      toast.success('Study material uploaded successfully')

      setDialogOpen(false)
      setFormData({
        title: '',
        description: '',
        subject_id: '',
        file_url: ''
      })
      setFile(null)
      fetchMaterials()
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload material')
    }
  }

  async function handleDelete(materialId: string) {
    if (!confirm('Are you sure you want to delete this study material?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('study_materials')
        .delete()
        .eq('id', materialId)

      if (error) throw error
      toast.success('Study material deleted successfully')
      fetchMaterials()
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete material')
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

  const canUploadMaterials = user.role === 'teacher'

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Study Materials
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Educational resources and documents
            </p>
          </div>
          {canUploadMaterials && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Upload Material
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Upload Study Material</DialogTitle>
                  <DialogDescription>
                    Share educational resources with students
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      required
                    />
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
                        {subjects.map((subject) => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {subject.name} ({subject.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="file">File</Label>
                    <Input
                      id="file"
                      type="file"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Material
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {materials.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No study materials found</p>
              </CardContent>
            </Card>
          ) : (
            materials.map((material) => (
              <Card key={material.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{material.title}</CardTitle>
                  <div className="text-sm text-gray-500">
                    {material.subjects?.name} ({material.subjects?.code})
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 dark:text-gray-300 mb-4 line-clamp-2">
                    {material.description}
                  </p>
                  <div className="text-sm text-gray-500 mb-4">
                    Uploaded by {material.profiles?.full_name || 'Unknown'}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => window.open(material.file_url, '_blank')}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                    {canUploadMaterials && material.teacher_id === user.id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(material.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
