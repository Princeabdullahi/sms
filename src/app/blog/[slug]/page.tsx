'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Calendar, User, ArrowLeft, Share2 } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import Image from 'next/image'

export default function BlogPostPage() {
  const params = useParams()
  const router = useRouter()
  const [post, setPost] = useState<any>(null)
  const [media, setMedia] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.slug) {
      fetchPost()
    }
  }, [params.slug])

  async function fetchPost() {
    try {
      setLoading(true)
      const { data: postData, error: postError } = await supabase
        .from('blog_posts')
        .select('*, profiles:author_id(full_name, avatar_url)')
        .eq('slug', params.slug)
        .eq('status', 'published')
        .single()

      if (postError) throw postError
      setPost(postData)

      if (postData) {
        const { data: mediaData, error: mediaError } = await supabase
          .from('blog_media')
          .select('*')
          .eq('blog_post_id', postData.id)
          .order('order_index')

        if (mediaError) throw mediaError
        setMedia(mediaData || [])
      }
    } catch (error) {
      console.error('Error fetching post:', error)
      router.push('/blog')
    } finally {
      setLoading(false)
    }
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

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Post not found</h2>
          <Button onClick={() => router.push('/blog')}>Back to Blog</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/blog" className="flex items-center gap-2">
              <ArrowLeft className="h-5 w-5" />
              <span className="font-semibold">Back to Blog</span>
            </Link>
            <Button variant="ghost" size="icon">
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Featured Image */}
      {post.featured_image && (
        <div className="relative h-96 w-full">
          <img
            src={post.featured_image}
            alt={post.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>
      )}

      {/* Content */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Badge className={getCategoryColor(post.category)}>{post.category}</Badge>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mt-4 mb-4">
            {post.title}
          </h1>
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              {post.profiles?.full_name}
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {post.published_at ? format(new Date(post.published_at), 'PPP') : format(new Date(post.created_at), 'PPP')}
            </div>
          </div>
        </div>

        {/* Excerpt */}
        {post.excerpt && (
          <div className="mb-8">
            <p className="text-xl text-gray-600 dark:text-gray-300 italic">
              {post.excerpt}
            </p>
          </div>
        )}

        {/* Content */}
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <div className="whitespace-pre-wrap">{post.content}</div>
        </div>

        {/* Media Gallery */}
        {media.length > 0 && (
          <div className="mt-12">
            <h3 className="text-2xl font-bold mb-6">Gallery</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {media.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  {item.media_type === 'image' ? (
                    <img
                      src={item.media_url}
                      alt={item.alt_text || ''}
                      className="w-full h-64 object-cover"
                    />
                  ) : (
                    <video
                      src={item.media_url}
                      controls
                      className="w-full h-64"
                    />
                  )}
                  {item.caption && (
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400">{item.caption}</p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}
      </article>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2024 Golden Olives Academy. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
