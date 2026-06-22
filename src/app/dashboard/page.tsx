'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, GraduationCap, BookOpen, DollarSign, Calendar, Bell, FileText, PenTool, UserCheck, Upload } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    totalSubjects: 0,
    pendingPayments: 0,
    upcomingExams: 0,
    recentNotices: 0,
    totalBlogPosts: 0,
    publishedBlogPosts: 0,
    totalParents: 0,
    totalWriters: 0
  })
  const [notices, setNotices] = useState<any[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchStats()
      fetchNotices()
    }
  }, [user])

  async function fetchStats() {
    try {
      const [students, teachers, classes, subjects, payments, exams, notices, blogPosts, publishedPosts, parents, writers] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'teacher'),
        supabase.from('classes').select('id', { count: 'exact', head: true }),
        supabase.from('subjects').select('id', { count: 'exact', head: true }),
        supabase.from('payments').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('exams').select('id', { count: 'exact', head: true }).gte('exam_date', new Date().toISOString()),
        supabase.from('notices').select('id', { count: 'exact', head: true }),
        supabase.from('blog_posts').select('id', { count: 'exact', head: true }),
        supabase.from('blog_posts').select('id', { count: 'exact', head: true }).eq('status', 'published'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'parent'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'writer')
      ])

      setStats({
        totalStudents: students.count || 0,
        totalTeachers: teachers.count || 0,
        totalClasses: classes.count || 0,
        totalSubjects: subjects.count || 0,
        pendingPayments: payments.count || 0,
        upcomingExams: exams.count || 0,
        recentNotices: notices.count || 0,
        totalBlogPosts: blogPosts.count || 0,
        publishedBlogPosts: publishedPosts.count || 0,
        totalParents: parents.count || 0,
        totalWriters: writers.count || 0
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  async function fetchNotices() {
    try {
      const { data, error } = await supabase
        .from('notices')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setNotices(data || [])
    } catch (error) {
      console.error('Error fetching notices:', error)
    }
  }

  function getNoticesForDate(date: Date) {
    if (!date) return []
    const dateStr = format(date, 'yyyy-MM-dd')
    return notices.filter(notice => {
      const noticeDate = notice.event_date ? format(new Date(notice.event_date), 'yyyy-MM-dd') : format(new Date(notice.created_at), 'yyyy-MM-dd')
      return noticeDate === dateStr
    })
  }

  function hasNotice(date: Date) {
    const dateStr = format(date, 'yyyy-MM-dd')
    return notices.some(notice => {
      const noticeDate = notice.event_date ? format(new Date(notice.event_date), 'yyyy-MM-dd') : format(new Date(notice.created_at), 'yyyy-MM-dd')
      return noticeDate === dateStr
    })
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

  const statCards = [
    {
      title: 'Total Students',
      value: stats.totalStudents,
      icon: Users,
      color: 'bg-blue-500',
      roles: ['super_admin', 'admin', 'teacher']
    },
    {
      title: 'Total Teachers',
      value: stats.totalTeachers,
      icon: GraduationCap,
      color: 'bg-green-500',
      roles: ['super_admin', 'admin']
    },
    {
      title: 'Total Classes',
      value: stats.totalClasses,
      icon: Calendar,
      color: 'bg-purple-500',
      roles: ['super_admin', 'admin', 'teacher']
    },
    {
      title: 'Total Subjects',
      value: stats.totalSubjects,
      icon: BookOpen,
      color: 'bg-orange-500',
      roles: ['super_admin', 'admin', 'teacher']
    },
    {
      title: 'Pending Payments',
      value: stats.pendingPayments,
      icon: DollarSign,
      color: 'bg-red-500',
      roles: ['super_admin', 'admin', 'accountant']
    },
    {
      title: 'Upcoming Exams',
      value: stats.upcomingExams,
      icon: FileText,
      color: 'bg-indigo-500',
      roles: ['super_admin', 'admin', 'teacher', 'student', 'parent']
    },
    {
      title: 'Recent Notices',
      value: stats.recentNotices,
      icon: Bell,
      color: 'bg-pink-500',
      roles: ['super_admin', 'admin', 'teacher', 'student', 'parent']
    },
    {
      title: 'Blog Posts',
      value: stats.totalBlogPosts,
      icon: PenTool,
      color: 'bg-teal-500',
      roles: ['super_admin', 'admin', 'writer']
    },
    {
      title: 'Published Posts',
      value: stats.publishedBlogPosts,
      icon: FileText,
      color: 'bg-cyan-500',
      roles: ['super_admin', 'admin', 'writer']
    },
    {
      title: 'Total Parents',
      value: stats.totalParents,
      icon: UserCheck,
      color: 'bg-amber-500',
      roles: ['super_admin', 'admin']
    },
    {
      title: 'Total Writers',
      value: stats.totalWriters,
      icon: PenTool,
      color: 'bg-lime-500',
      roles: ['super_admin', 'admin']
    }
  ]

  const filteredStatCards = statCards.filter(card => 
    card.roles.includes(user.role)
  )

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Mobile App-like Header */}
        <div className="lg:hidden">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user.full_name}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:block">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user.full_name}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Here's what's happening with your school today.
          </p>
        </div>

        {/* Mobile Stats Grid - App-like */}
        <div className="lg:hidden grid grid-cols-2 gap-3">
          {filteredStatCards.slice(0, 4).map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.title} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className={`p-2 rounded-full ${stat.color} w-8 h-8 flex items-center justify-center mb-2`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">{stat.title}</div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Desktop Stats Grid */}
        <div className="hidden lg:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStatCards.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-full ${stat.color}`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Mobile Calendar Section */}
        <div className="lg:hidden">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Calendar & Notices</CardTitle>
            </CardHeader>
            <CardContent>
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
                modifiers={{
                  hasNotice: hasNotice
                }}
                modifiersStyles={{
                  hasNotice: {
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    fontWeight: 'bold'
                  }
                }}
              />
              {selectedDate && getNoticesForDate(selectedDate).length > 0 && (
                <div className="mt-4 space-y-2">
                  <h4 className="font-medium text-sm">Notices for {format(selectedDate, 'PPP')}</h4>
                  {getNoticesForDate(selectedDate).map((notice) => (
                    <div key={notice.id} className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{notice.title}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                            {notice.content}
                          </p>
                        </div>
                        <Badge className={getAudienceBadgeColor(notice.target_audience)}>
                          {notice.target_audience}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="hidden lg:grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Calendar & Notices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border"
                  modifiers={{
                    hasNotice: hasNotice
                  }}
                  modifiersStyles={{
                    hasNotice: {
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      fontWeight: 'bold'
                    }
                  }}
                />
                {selectedDate && getNoticesForDate(selectedDate).length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h4 className="font-medium text-sm">Notices for {format(selectedDate, 'PPP')}</h4>
                    {getNoticesForDate(selectedDate).map((notice) => (
                      <div key={notice.id} className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{notice.title}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                              {notice.content}
                            </p>
                          </div>
                          <Badge className={getAudienceBadgeColor(notice.target_audience)}>
                            {notice.target_audience}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Mobile Quick Actions */}
          <div className="lg:hidden">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {user.role === 'super_admin' || user.role === 'admin' ? (
                  <>
                    <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="text-sm">Create New User</span>
                    </button>
                    <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                        <GraduationCap className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                      <span className="text-sm">Add New Class</span>
                    </button>
                    <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                        <Bell className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <span className="text-sm">Create Announcement</span>
                    </button>
                  </>
                ) : user.role === 'teacher' ? (
                  <>
                    <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                        <Upload className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                      </div>
                      <span className="text-sm">Upload Study Material</span>
                    </button>
                    <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-3">
                      <div className="w-8 h-8 bg-pink-100 dark:bg-pink-900 rounded-full flex items-center justify-center">
                        <FileText className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                      </div>
                      <span className="text-sm">Create Assignment</span>
                    </button>
                  </>
                ) : user.role === 'parent' ? (
                  <>
                    <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                        <BookOpen className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <span className="text-sm">View Child's Progress</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-3">
                      <div className="w-8 h-8 bg-cyan-100 dark:bg-cyan-900 rounded-full flex items-center justify-center">
                        <FileText className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                      </div>
                      <span className="text-sm">View My Grades</span>
                    </button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {user.role === 'super_admin' || user.role === 'admin' ? (
                <>
                  <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    Create New User
                  </button>
                  <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    Add New Class
                  </button>
                  <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    Create Announcement
                  </button>
                </>
              ) : user.role === 'teacher' ? (
                <>
                  <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    Upload Study Material
                  </button>
                  <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    Create Assignment
                  </button>
                  <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    Update Exam Grades
                  </button>
                </>
              ) : user.role === 'accountant' ? (
                <>
                  <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    Review Pending Payments
                  </button>
                  <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    Generate Payment Report
                  </button>
                </>
              ) : user.role === 'parent' ? (
                <>
                  <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    Make Fee Payment
                  </button>
                  <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    View Child's Progress
                  </button>
                </>
              ) : (
                <>
                  <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    View My Grades
                  </button>
                  <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    Check Assignments
                  </button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Mobile Recent Activity */}
          <div className="lg:hidden">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 mt-2 rounded-full bg-blue-500"></div>
                    <div>
                      <p className="text-sm font-medium">System updated successfully</p>
                      <p className="text-xs text-gray-500">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 mt-2 rounded-full bg-green-500"></div>
                    <div>
                      <p className="text-sm font-medium">New student enrolled</p>
                      <p className="text-xs text-gray-500">5 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 mt-2 rounded-full bg-purple-500"></div>
                    <div>
                      <p className="text-sm font-medium">Exam results published</p>
                      <p className="text-xs text-gray-500">1 day ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 mt-2 rounded-full bg-blue-500"></div>
                  <div>
                    <p className="text-sm font-medium">System updated successfully</p>
                    <p className="text-xs text-gray-500">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 mt-2 rounded-full bg-green-500"></div>
                  <div>
                    <p className="text-sm font-medium">New student enrolled</p>
                    <p className="text-xs text-gray-500">5 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 mt-2 rounded-full bg-purple-500"></div>
                  <div>
                    <p className="text-sm font-medium">Exam results published</p>
                    <p className="text-xs text-gray-500">1 day ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
