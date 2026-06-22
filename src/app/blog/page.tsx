'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Calendar, User, Search, ArrowLeft, Clock } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import Image from 'next/image'

export default function BlogPage() {
  const [posts, setPosts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPosts()
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchPosts()
  }, [selectedCategory, searchQuery])

  async function fetchPosts() {
    try {
      setLoading(true)
      let query = supabase
        .from('blog_posts')
        .select('*, profiles:author_id(full_name, avatar_url), blog_media(media_url, media_type)')
        .eq('status', 'published')
        .order('published_at', { ascending: false })

      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory)
      }

      if (searchQuery) {
        query = query.ilike('title', `%${searchQuery}%`)
      }

      const { data, error } = await query

      if (error) throw error
      setPosts(data || [])
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft className="h-5 w-5" />
              <span className="font-semibold">Back to Home</span>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">School Blog</h1>
            <div></div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">Latest News & Updates</h2>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Stay informed about school events, achievements, and announcements
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search and Filter */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              onClick={() => setSelectedCategory('all')}
            >
              All
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.slug ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(category.slug)}
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Featured Post */}
        {posts.length > 0 && posts[0].featured_image && (
          <Card className="mb-8 overflow-hidden border-0 shadow-xl">
            <div className="relative h-96">
              <img
                src={posts[0].featured_image}
                alt={posts[0].title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <Badge className={getCategoryColor(posts[0].category)}>{posts[0].category}</Badge>
                <h3 className="text-3xl font-bold mt-2 mb-2">{posts[0].title}</h3>
                <p className="text-gray-200 mb-4 line-clamp-2">{posts[0].excerpt || posts[0].content.substring(0, 200)}</p>
                <div className="flex items-center gap-4 text-sm text-gray-300">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {posts[0].profiles?.full_name}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {posts[0].published_at ? format(new Date(posts[0].published_at), 'PPP') : format(new Date(posts[0].created_at), 'PPP')}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Blog Grid */}
        {posts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-gray-500">No blog posts found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {post.featured_image && (
                  <div className="relative h-48">
                    <img
                      src={post.featured_image}
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                    <Badge className={`absolute top-4 right-4 ${getCategoryColor(post.category)}`}>
                      {post.category}
                    </Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-xl line-clamp-2">{post.title}</CardTitle>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {post.profiles?.full_name}
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {post.published_at ? format(new Date(post.published_at), 'PPP') : format(new Date(post.created_at), 'PPP')}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 line-clamp-3 mb-4">
                    {post.excerpt || post.content.substring(0, 150)}
                  </p>
                  <Button variant="outline" className="w-full">
                    <Link href={`/blog/${post.slug}`} className="w-full">
                      Read More
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2026 Golden Olives Academy. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
