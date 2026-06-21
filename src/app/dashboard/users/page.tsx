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
import { Plus, Pencil, Trash2, Search, Eye, Upload } from 'lucide-react'
import { signUp } from '@/lib/auth'

export default function UsersPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [viewingUser, setViewingUser] = useState<any>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: '',
    phone: '',
    student_id: '',
    avatar_url: '' as string | File,
    class_id: '',
    linked_student_id: ''
  })
  const [classes, setClasses] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchUsers()
      fetchClasses()
      fetchStudents()
    }
  }, [user])

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

  async function fetchStudents() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student')
        .order('full_name', { ascending: true })

      if (error) throw error
      setStudents(data || [])
    } catch (error) {
      console.error('Error fetching students:', error)
    }
  }

  async function fetchUsers() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Failed to fetch users')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    try {
      let avatarUrl = formData.avatar_url

      // Handle image upload if a new file is selected
      if (formData.avatar_url instanceof File) {
        const file = formData.avatar_url as File
        const fileExt = file.name.split('.').pop()
        const fileName = `${formData.email}_${Date.now()}.${fileExt}`
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, file)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName)
        
        avatarUrl = publicUrl
      }

      if (editingUser) {
        // Update existing user
        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: formData.full_name,
            role: formData.role,
            phone: formData.phone,
            student_id: formData.student_id,
            avatar_url: avatarUrl
          })
          .eq('id', editingUser.id)

        if (error) throw error
        toast.success('User updated successfully')
      } else {
        // Create new user
        const authData = await signUp(
          formData.email,
          formData.password,
          formData.full_name,
          formData.role as any,
          formData.phone,
          formData.student_id
        )
        
        // Use the returned auth data instead of getting current user
        if (authData.user) {
          // Update avatar after user creation
          if (avatarUrl) {
            await supabase
              .from('profiles')
              .update({ avatar_url: avatarUrl })
              .eq('id', authData.user.id)
          }

          // Handle student class assignment
          if (formData.role === 'student' && formData.class_id) {
            await supabase
              .from('students')
              .insert({
                user_id: authData.user.id,
                class_id: formData.class_id,
                roll_number: formData.student_id || 'N/A',
                date_of_birth: new Date().toISOString().split('T')[0],
                address: 'To be updated'
              })
          }

          // Handle parent-child linking
          if (formData.role === 'parent' && formData.linked_student_id) {
            await supabase
              .from('students')
              .update({ parent_id: authData.user.id })
              .eq('user_id', formData.linked_student_id)
          }
        }
        
        toast.success('User created successfully')
      }

      setDialogOpen(false)
      setEditingUser(null)
      setFormData({
        email: '',
        password: '',
        full_name: '',
        role: '',
        phone: '',
        student_id: '',
        avatar_url: '',
        class_id: '',
        linked_student_id: ''
      })
      fetchUsers()
    } catch (error: any) {
      toast.error(error.message || 'Failed to save user')
    }
  }

  async function handleDelete(userId: string) {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return
    }

    try {
      // Delete from profiles (cascade will handle auth)
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)

      if (error) throw error
      toast.success('User deleted successfully')
      fetchUsers()
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete user')
    }
  }

  function handleEdit(user: any) {
    setEditingUser(user)
    setFormData({
      email: user.email,
      password: '',
      full_name: user.full_name,
      role: user.role,
      phone: user.phone,
      student_id: user.student_id || '',
      avatar_url: user.avatar_url || '',
      class_id: user.class_id || '',
      linked_student_id: user.linked_student_id || ''
    })
    setDialogOpen(true)
  }

  function handleCreate() {
    setEditingUser(null)
    setFormData({
      email: '',
      password: '',
      full_name: '',
      role: '',
      phone: '',
      student_id: '',
      avatar_url: '',
      class_id: '',
      linked_student_id: ''
    })
    setDialogOpen(true)
  }

  function handleView(user: any) {
    setViewingUser(user)
    setViewDialogOpen(true)
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.student_id && user.student_id.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    
    return matchesSearch && matchesRole
  })

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

  if (user.role !== 'super_admin' && user.role !== 'admin') {
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
              User Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage all user accounts in the system
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingUser ? 'Edit User' : 'Create New User'}
                </DialogTitle>
                <DialogDescription>
                  {editingUser ? 'Update user information' : 'Add a new user to the system'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    disabled={!!editingUser}
                  />
                </div>
                {!editingUser && (
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => setFormData({ ...formData, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="accountant">Accountant</SelectItem>
                      <SelectItem value="teacher">Teacher</SelectItem>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="parent">Parent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="student_id">
                    {formData.role === 'teacher' ? 'Teacher ID' : formData.role === 'student' ? 'Student ID' : formData.role === 'parent' ? 'Parent ID' : 'ID'} (Optional)
                  </Label>
                  <Input
                    id="student_id"
                    value={formData.student_id}
                    onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                    placeholder={formData.role === 'teacher' ? 'e.g., GOA-T-001' : formData.role === 'student' ? 'e.g., GOA-S-001' : formData.role === 'parent' ? 'e.g., GOA-P-001' : 'e.g., GOA-001'}
                  />
                </div>
                {formData.role === 'student' && (
                  <div className="space-y-2">
                    <Label htmlFor="class">Class</Label>
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
                )}
                {formData.role === 'parent' && (
                  <div className="space-y-2">
                    <Label htmlFor="linked_student">Link to Student</Label>
                    <Select
                      value={formData.linked_student_id}
                      onValueChange={(value) => setFormData({ ...formData, linked_student_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Search by Student ID or Name" />
                      </SelectTrigger>
                      <SelectContent>
                        {students.map((student) => (
                          <SelectItem key={student.id} value={student.id}>
                            {student.full_name} ({student.student_id || 'No ID'})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="avatar">Profile Picture (Passport)</Label>
                  <div className="flex items-center gap-4">
                    {formData.avatar_url && typeof formData.avatar_url === 'string' && (
                      <img 
                        src={formData.avatar_url} 
                        alt="Current avatar"
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <Input
                        id="avatar"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            setFormData({ ...formData, avatar_url: file })
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
                <Button type="submit" className="w-full">
                  {editingUser ? 'Update User' : 'Create User'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* User Detail View Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>User ID Card</DialogTitle>
              <DialogDescription>
                View user details
              </DialogDescription>
            </DialogHeader>
            {viewingUser && (
              <div className="space-y-4">
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold">
                    {viewingUser.avatar_url ? (
                      <img 
                        src={viewingUser.avatar_url} 
                        alt={viewingUser.full_name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      viewingUser.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
                    )}
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {viewingUser.full_name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {viewingUser.role.replace('_', ' ').toUpperCase()}
                    </p>
                  </div>
                </div>
                <div className="space-y-3 pt-4 border-t">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Student ID:</span>
                    <span className="text-sm text-gray-900 dark:text-white">{viewingUser.student_id || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Email:</span>
                    <span className="text-sm text-gray-900 dark:text-white">{viewingUser.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Phone:</span>
                    <span className="text-sm text-gray-900 dark:text-white">{viewingUser.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Joined:</span>
                    <span className="text-sm text-gray-900 dark:text-white">{new Date(viewingUser.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-2 flex-1">
                <Search className="h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="roleFilter">Filter by Role:</Label>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger id="roleFilter" className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="accountant">Accountant</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="parent">Parent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.student_id || '-'}</TableCell>
                      <TableCell className="font-medium">{user.full_name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {user.role.replace('_', ' ')}
                        </span>
                      </TableCell>
                      <TableCell>{user.phone}</TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleView(user)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(user)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {user.role === 'super_admin' ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled
                              title="Cannot delete super admin"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(user.id)}
                              disabled={user.role === 'super_admin'}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
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
      </div>
    </DashboardLayout>
  )
}
