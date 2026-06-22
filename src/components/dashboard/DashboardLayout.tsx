'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  Calendar, 
  DollarSign, 
  FileText, 
  Settings, 
  LogOut,
  GraduationCap,
  UserCheck,
  Receipt,
  Upload,
  Bell,
  Menu,
  X,
  PenTool
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface NavItem {
  title: string
  href: string
  icon: any
  roles: string[]
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['super_admin', 'admin', 'accountant', 'teacher', 'student', 'parent', 'writer']
  },
  {
    title: 'Users',
    href: '/dashboard/users',
    icon: Users,
    roles: ['super_admin', 'admin']
  },
  {
    title: 'Classes',
    href: '/dashboard/classes',
    icon: GraduationCap,
    roles: ['super_admin', 'admin', 'teacher']
  },
  {
    title: 'Subjects',
    href: '/dashboard/subjects',
    icon: BookOpen,
    roles: ['super_admin', 'admin', 'teacher']
  },
  {
    title: 'Exams & Grades',
    href: '/dashboard/exams',
    icon: FileText,
    roles: ['super_admin', 'admin', 'teacher', 'student', 'parent']
  },
  {
    title: 'Timetable',
    href: '/dashboard/timetable',
    icon: Calendar,
    roles: ['super_admin', 'admin', 'teacher', 'student', 'parent']
  },
  {
    title: 'Payments',
    href: '/dashboard/payments',
    icon: DollarSign,
    roles: ['super_admin', 'admin', 'accountant', 'parent']
  },
  {
    title: 'Noticeboard',
    href: '/dashboard/noticeboard',
    icon: Bell,
    roles: ['super_admin', 'admin', 'teacher', 'student', 'parent']
  },
  {
    title: 'Blog',
    href: '/dashboard/writer',
    icon: PenTool,
    roles: ['super_admin', 'admin', 'writer']
  },
  {
    title: 'Study Materials',
    href: '/dashboard/materials',
    icon: Upload,
    roles: ['teacher', 'student', 'parent']
  },
  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
    roles: ['super_admin', 'admin']
  }
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  const filteredNavItems = navItems.filter(item => 
    user && item.roles.includes(user.role)
  )

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      super_admin: 'bg-red-500',
      admin: 'bg-blue-500',
      accountant: 'bg-green-500',
      teacher: 'bg-purple-500',
      student: 'bg-yellow-500',
      parent: 'bg-pink-500'
    }
    return colors[role] || 'bg-gray-500'
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 fixed top-0 left-0 right-0 z-50 h-16">
        <div className="flex items-center justify-between h-full px-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
              Golden Olives Academy
            </h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 sm:h-auto">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:block ml-2 text-sm font-medium">{user.full_name}</span>
                  <span className={cn(
                    "hidden sm:inline-block ml-2 px-2 py-0.5 text-xs text-white rounded-full",
                    getRoleBadgeColor(user.role)
                  )}>
                    {user.role.replace('_', ' ')}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/profile">
                    <UserCheck className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-16 bottom-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 z-40",
          sidebarOpen ? "w-64 translate-x-0" : "w-64 -translate-x-full lg:translate-x-0 lg:w-64"
        )}
      >
        <nav className="p-4 space-y-2">
          {filteredNavItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.title}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 lg:hidden z-50">
        <div className="flex justify-around items-center h-16">
          {filteredNavItems.slice(0, 5).map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center w-full h-full",
                  isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-400"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs mt-1">{item.title}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main
        className={cn(
          "pt-16 transition-all duration-300",
          "lg:ml-64",
          "pb-16 lg:pb-0"
        )}
      >
        <div className="p-4 sm:p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
