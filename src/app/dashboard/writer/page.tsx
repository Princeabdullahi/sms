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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { Plus, Pencil, Trash2, Upload, Eye, Calendar, FileText, Image as ImageIcon, Video } from 'lucide-react'
import { format } from 'date-fns'

export default function WriterDashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [posts, setPosts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPost, setEditingPost] = useState<any>(null)
  const [mediaDialogOpen, setMediaDialogOpen] = useState(false)
  const [selectedPostForMedia, setSelectedPostForMedia] = useState<any>(null)
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    category: 'news',
    status: 'draft',
    featured_image: ''
  })
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image')
  const [mediaCaption, setMediaCaption] = useState('')

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      if (user.role !== 'writer' && user.role !== 'super_admin' && user.role !== 'admin') {
        router.push('/dashboard')
        return
      }
      fetchPosts()
      fetchCategories()
    }
  }, [user])

  async function fetchPosts() {
    if (!user) return
    try {
      const query = user.role === 'writer'
        ? supabase
            .from('blog_posts')
            .select('*, profiles:author_id(full_name)')
            .eq('author_id', user.id)
            .order('created_at', { ascending: false })
        : supabase
            .from('blog_posts')
            .select('*, profiles:author_id(full_name)')
            .order('created_at', { ascending: false })

      const { data, error } = await query
      if (error) throw error
      setPosts(data || [])
    } catch (error) {
      console.error('Error fetching posts:', error)
      toast.error('Failed to fetch posts')
    }
  }

  async function fetchCategories() {
    try {
      const { data, error } = await supabase
        .from('blog_categories')
        .select('*')
        .order('name')

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    try {
      const slug = formData.slug || formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      
      if (editingPost) {
        const { error } = await supabase
          .from('blog_posts')
          .update({
            title: formData.title,
            slug,
            content: formData.content,
            excerpt: formData.excerpt,
            category: formData.category,
            status: formData.status,
            featured_image: formData.featured_image,
            published_at: formData.status === 'published' && !editingPost.published_at ? new Date().toISOString() : editingPost.published_at
          })
          .eq('id', editingPost.id)

        if (error) throw error
        toast.success('Post updated successfully')
      } else {
        const { error } = await supabase
          .from('blog_posts')
          .insert({
            title: formData.title,
            slug,
            content: formData.content,
            excerpt: formData.excerpt,
            category: formData.category,
            status: formData.status,
            featured_image: formData.featured_image,
            author_id: user!.id,
            published_at: formData.status === 'published' ? new Date().toISOString() : null
          })

        if (error) throw error
        toast.success('Blog created successfully!')
      }

      setDialogOpen(false)
      setEditingPost(null)
      setFormData({
        title: '',
        slug: '',
        content: '',
        excerpt: '',
        category: 'news',
        status: 'draft',
        featured_image: ''
      })
      fetchPosts()
    } catch (error: any) {
      toast.error(error.message || 'Failed to save post')
    }
  }

  async function handleDelete(postId: string) {
    if (!confirm('Are you sure you want to delete this post?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', postId)

      if (error) throw error
      toast.success('Post deleted successfully')
      fetchPosts()
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete post')
    }
  }

  async function handleEdit(post: any) {
    setEditingPost(post)
    setFormData({
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt || '',
      category: post.category,
      status: post.status,
      featured_image: post.featured_image || ''
    })
    setDialogOpen(true)
  }

  async function handleCreate() {
    setEditingPost(null)
    setFormData({
      title: '',
      slug: '',
      content: '',
      excerpt: '',
      category: 'news',
      status: 'draft',
      featured_image: ''
    })
    setDialogOpen(true)
  }

  async function handlePublish(post: any) {
    try {
      const { error } = await supabase
        .from('blog_posts')
        .update({
          status: 'published',
          published_at: new Date().toISOString()
        })
        .eq('id', post.id)

      if (error) throw error
      toast.success('Post published successfully')
      fetchPosts()
    } catch (error: any) {
      toast.error(error.message || 'Failed to publish post')
    }
  }

  async function handleUnpublish(post: any) {
    try {
      const { error } = await supabase
        .from('blog_posts')
        .update({ status: 'draft' })
        .eq('id', post.id)

      if (error) throw error
      toast.success('Post unpublished successfully')
      fetchPosts()
    } catch (error: any) {
      toast.error(error.message || 'Failed to unpublish post')
    }
  }

  async function handleMediaSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!mediaFile || !selectedPostForMedia) return

    try {
      const fileExt = mediaFile.name.split('.').pop()
      const fileName = `blog/${selectedPostForMedia.id}_${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('blog-media')
        .upload(fileName, mediaFile)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('blog-media')
        .getPublicUrl(fileName)

      const { error: insertError } = await supabase
        .from('blog_media')
        .insert({
          blog_post_id: selectedPostForMedia.id,
          media_type: mediaType,
          media_url: publicUrl,
          alt_text: mediaCaption,
          caption: mediaCaption
        })

      if (insertError) throw insertError

      toast.success('Media uploaded successfully')
      setMediaDialogOpen(false)
      setMediaFile(null)
      setMediaCaption('')
      setSelectedPostForMedia(null)
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload media')
    }
  }

  function getStatusBadgeColor(status: string) {
    const colors: Record<string, string> = {
      draft: 'bg-gray-500',
      published: 'bg-green-500',
      archived: 'bg-red-500'
    }
    return colors[status] || 'bg-gray-500'
  }

  function getCategoryColor(category: string) {
    const colors: Record<string, string> = {
      news: 'bg-blue-500',
      events: 'bg-green-500',
      achievements: 'bg-purple-500',
      sports: 'bg-orange-500',
      academics: 'bg-pink-500'
    }
    return colors[category] || 'bg-gray-500'
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

  if (user.role !== 'writer' && user.role !== 'super_admin' && user.role !== 'admin') {
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
              Blog Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Create and manage blog posts, news, and events
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                New Post
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingPost ? 'Edit Post' : 'Create New Post'}
                </DialogTitle>
                <DialogDescription>
                  {editingPost ? 'Update post information' : 'Write a new blog post'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="Post title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug (URL-friendly title)</Label>
                  <Input
                    id="slug"
                    placeholder="post-url-slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="excerpt">Excerpt</Label>
                  <Textarea
                    id="excerpt"
                    placeholder="Brief description of the post"
                    value={formData.excerpt}
                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    placeholder="Write your post content here..."
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    required
                    rows={10}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.slug}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="featured_image">Featured Image URL</Label>
                  <Input
                    id="featured_image"
                    placeholder="https://example.com/image.jpg"
                    value={formData.featured_image}
                    onChange={(e) => setFormData({ ...formData, featured_image: e.target.value })}
                  />
                </div>
                <Button type="submit" className="w-full">
                  {editingPost ? 'Update Post' : 'Create Post'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      No posts found
                    </TableCell>
                  </TableRow>
                ) : (
                  posts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell className="font-medium">{post.title}</TableCell>
                      <TableCell>
                        <Badge className={getCategoryColor(post.category)}>
                          {post.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(post.status)}>
                          {post.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(post.created_at), 'PPP')}
                      </TableCell>
                      <TableCell>
                        {post.published_at ? format(new Date(post.published_at), 'PPP') : 'Not published'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(post)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {post.status === 'draft' ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handlePublish(post)}
                            >
                              <Eye className="h-4 w-4 text-green-500" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleUnpublish(post)}
                            >
                              <Eye className="h-4 w-4 text-gray-500" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedPostForMedia(post)
                              setMediaDialogOpen(true)
                            }}
                          >
                            <Upload className="h-4 w-4 text-blue-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(post.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Media Upload Dialog */}
        <Dialog open={mediaDialogOpen} onOpenChange={setMediaDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Upload Media</DialogTitle>
              <DialogDescription>
                Add images or videos to your blog post
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleMediaSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="media_type">Media Type</Label>
                <Select
                  value={mediaType}
                  onValueChange={(value: 'image' | 'video') => setMediaType(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="media_file">Media File</Label>
                <Input
                  id="media_file"
                  type="file"
                  accept={mediaType === 'image' ? 'image/*' : 'video/*'}
                  onChange={(e) => setMediaFile(e.target.files?.[0] || null)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="media_caption">Caption</Label>
                <Input
                  id="media_caption"
                  placeholder="Image or video caption"
                  value={mediaCaption}
                  onChange={(e) => setMediaCaption(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full">
                <Upload className="h-4 w-4 mr-2" />
                Upload Media
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
