'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, GraduationCap, BookOpen, DollarSign, Calendar, Bell, FileText } from 'lucide-react'
import { supabase } from '@/lib/supabase'

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
    recentNotices: 0
  })

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchStats()
    }
  }, [user])

  async function fetchStats() {
    try {
      const [students, teachers, classes, subjects, payments, exams, notices] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'teacher'),
        supabase.from('classes').select('id', { count: 'exact', head: true }),
        supabase.from('subjects').select('id', { count: 'exact', head: true }),
        supabase.from('payments').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('exams').select('id', { count: 'exact', head: true }).gte('exam_date', new Date().toISOString()),
        supabase.from('notices').select('id', { count: 'exact', head: true })
      ])

      setStats({
        totalStudents: students.count || 0,
        totalTeachers: teachers.count || 0,
        totalClasses: classes.count || 0,
        totalSubjects: subjects.count || 0,
        pendingPayments: payments.count || 0,
        upcomingExams: exams.count || 0,
        recentNotices: notices.count || 0
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
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
    }
  ]

  const filteredStatCards = statCards.filter(card => 
    card.roles.includes(user.role)
  )

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user.full_name}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Here's what's happening with your school today.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
