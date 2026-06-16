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
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { Settings as SettingsIcon, Save } from 'lucide-react'

export default function SettingsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [settings, setSettings] = useState<Record<string, any>>({})
  const [formData, setFormData] = useState({
    school_name: '',
    school_address: '',
    school_phone: '',
    school_email: '',
    academic_year: ''
  })

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchSettings()
    }
  }, [user])

  async function fetchSettings() {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')

      if (error) throw error
      
      const settingsMap: Record<string, any> = {}
      data?.forEach(setting => {
        settingsMap[setting.key] = setting.value
      })
      
      setSettings(settingsMap)
      setFormData({
        school_name: settingsMap.school_name || '',
        school_address: settingsMap.school_address || '',
        school_phone: settingsMap.school_phone || '',
        school_email: settingsMap.school_email || '',
        academic_year: settingsMap.academic_year || ''
      })
    } catch (error) {
      console.error('Error fetching settings:', error)
      toast.error('Failed to fetch settings')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    try {
      const updates = [
        { key: 'school_name', value: formData.school_name },
        { key: 'school_address', value: formData.school_address },
        { key: 'school_phone', value: formData.school_phone },
        { key: 'school_email', value: formData.school_email },
        { key: 'academic_year', value: formData.academic_year }
      ]

      for (const update of updates) {
        const { error } = await supabase
          .from('settings')
          .upsert({ key: update.key, value: update.value }, { onConflict: 'key' })

        if (error) throw error
      }

      toast.success('Settings updated successfully')
      fetchSettings()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update settings')
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            System Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage school-wide settings and configurations
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              School Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="school_name">School Name</Label>
                  <Input
                    id="school_name"
                    value={formData.school_name}
                    onChange={(e) => setFormData({ ...formData, school_name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="academic_year">Academic Year</Label>
                  <Input
                    id="academic_year"
                    placeholder="e.g., 2024-2025"
                    value={formData.academic_year}
                    onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="school_phone">Phone Number</Label>
                  <Input
                    id="school_phone"
                    type="tel"
                    value={formData.school_phone}
                    onChange={(e) => setFormData({ ...formData, school_phone: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="school_email">Email Address</Label>
                  <Input
                    id="school_email"
                    type="email"
                    value={formData.school_email}
                    onChange={(e) => setFormData({ ...formData, school_email: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="school_address">School Address</Label>
                <Textarea
                  id="school_address"
                  value={formData.school_address}
                  onChange={(e) => setFormData({ ...formData, school_address: e.target.value })}
                  rows={3}
                  required
                />
              </div>
              <Button type="submit" className="w-full md:w-auto">
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="font-medium">School Name</span>
                <span className="text-gray-600 dark:text-gray-400">{settings.school_name || 'Not set'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="font-medium">Academic Year</span>
                <span className="text-gray-600 dark:text-gray-400">{settings.academic_year || 'Not set'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="font-medium">Phone</span>
                <span className="text-gray-600 dark:text-gray-400">{settings.school_phone || 'Not set'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="font-medium">Email</span>
                <span className="text-gray-600 dark:text-gray-400">{settings.school_email || 'Not set'}</span>
              </div>
              <div className="flex justify-between items-start py-2">
                <span className="font-medium">Address</span>
                <span className="text-gray-600 dark:text-gray-400 text-right">{settings.school_address || 'Not set'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
