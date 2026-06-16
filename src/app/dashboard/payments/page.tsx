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
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { Plus, Check, X, Upload, Receipt } from 'lucide-react'

export default function PaymentsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [payments, setPayments] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<any>(null)
  const [formData, setFormData] = useState({
    student_id: '',
    amount: 0,
    payment_type: 'tuition',
    payment_method: 'bank_transfer',
    due_date: '',
    notes: ''
  })
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [transactionId, setTransactionId] = useState('')

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchPayments()
      fetchStudents()
    }
  }, [user])

  async function fetchPayments() {
    try {
      let query = supabase
        .from('payments')
        .select('*, students(user_id, roll_number), profiles:students.user_id(full_name)')
        .order('created_at', { ascending: false })

      if (user?.role === 'student') {
        const { data: studentData } = await supabase
          .from('students')
          .select('id')
          .eq('user_id', user.id)
          .single()
        
        if (studentData) {
          query = query.eq('student_id', studentData.id)
        }
      } else if (user?.role === 'parent') {
        const { data: childrenData } = await supabase
          .from('students')
          .select('id')
          .eq('parent_id', user.id)
        
        if (childrenData && childrenData.length > 0) {
          const childIds = childrenData.map(c => c.id)
          query = query.in('student_id', childIds)
        }
      }

      const { data, error } = await query

      if (error) throw error
      setPayments(data || [])
    } catch (error) {
      console.error('Error fetching payments:', error)
      toast.error('Failed to fetch payments')
    }
  }

  async function fetchStudents() {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*, profiles:user_id(full_name)')
        .order('roll_number', { ascending: true })

      if (error) throw error
      setStudents(data || [])
    } catch (error) {
      console.error('Error fetching students:', error)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    try {
      const { error } = await supabase
        .from('payments')
        .insert({
          student_id: formData.student_id,
          amount: formData.amount,
          payment_type: formData.payment_type,
          payment_method: formData.payment_method,
          due_date: formData.due_date,
          notes: formData.notes,
          status: 'pending'
        })

      if (error) throw error
      toast.success('Payment record created successfully')

      setDialogOpen(false)
      setFormData({
        student_id: '',
        amount: 0,
        payment_type: 'tuition',
        payment_method: 'bank_transfer',
        due_date: '',
        notes: ''
      })
      fetchPayments()
    } catch (error: any) {
      toast.error(error.message || 'Failed to create payment record')
    }
  }

  async function handleUploadReceipt(e: React.FormEvent) {
    e.preventDefault()
    
    if (!receiptFile) {
      toast.error('Please select a receipt file')
      return
    }

    try {
      const fileExt = receiptFile.name.split('.').pop()
      const fileName = `${selectedPayment.id}_${Date.now()}.${fileExt}`
      const filePath = `receipts/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('payment-receipts')
        .upload(filePath, receiptFile)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('payment-receipts')
        .getPublicUrl(filePath)

      const { error: updateError } = await supabase
        .from('payments')
        .update({
          receipt_url: publicUrl,
          transaction_id: transactionId,
          paid_date: new Date().toISOString()
        })
        .eq('id', selectedPayment.id)

      if (updateError) throw updateError

      toast.success('Receipt uploaded successfully')
      setReceiptDialogOpen(false)
      setReceiptFile(null)
      setTransactionId('')
      setSelectedPayment(null)
      fetchPayments()
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload receipt')
    }
  }

  async function handleConfirmPayment(paymentId: string) {
    if (!confirm('Are you sure you want to confirm this payment?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('payments')
        .update({
          status: 'confirmed',
          confirmed_by: user!.id
        })
        .eq('id', paymentId)

      if (error) throw error
      toast.success('Payment confirmed successfully')
      fetchPayments()
    } catch (error: any) {
      toast.error(error.message || 'Failed to confirm payment')
    }
  }

  async function handleRejectPayment(paymentId: string) {
    if (!confirm('Are you sure you want to reject this payment?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('payments')
        .update({
          status: 'rejected'
        })
        .eq('id', paymentId)

      if (error) throw error
      toast.success('Payment rejected successfully')
      fetchPayments()
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject payment')
    }
  }

  function getStatusBadgeColor(status: string) {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-500',
      confirmed: 'bg-green-500',
      rejected: 'bg-red-500'
    }
    return colors[status] || 'bg-gray-500'
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

  const canManagePayments = user.role === 'super_admin' || user.role === 'admin' || user.role === 'accountant'
  const canUploadReceipt = user.role === 'student' || user.role === 'parent'

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Payments & Fees
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage school fees and payments
            </p>
          </div>
          {canManagePayments && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Payment Record
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create Payment Record</DialogTitle>
                  <DialogDescription>
                    Add a new payment record for a student
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="student_id">Student</Label>
                    <Select
                      value={formData.student_id}
                      onValueChange={(value) => setFormData({ ...formData, student_id: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a student" />
                      </SelectTrigger>
                      <SelectContent>
                        {students.map((student) => (
                          <SelectItem key={student.id} value={student.id}>
                            {student.profiles?.full_name} ({student.roll_number})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payment_type">Payment Type</Label>
                    <Select
                      value={formData.payment_type}
                      onValueChange={(value) => setFormData({ ...formData, payment_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tuition">Tuition Fee</SelectItem>
                        <SelectItem value="exam">Exam Fee</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payment_method">Payment Method</Label>
                    <Select
                      value={formData.payment_method}
                      onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="online">Online Payment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="due_date">Due Date</Label>
                    <Input
                      id="due_date"
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Input
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Create Payment Record
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No payments found
                    </TableCell>
                  </TableRow>
                ) : (
                  payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">
                        {payment.profiles?.full_name || 'Unknown'}
                      </TableCell>
                      <TableCell>${payment.amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{payment.payment_type}</Badge>
                      </TableCell>
                      <TableCell>{payment.payment_method}</TableCell>
                      <TableCell>{new Date(payment.due_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(payment.status)}>
                          {payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {canUploadReceipt && payment.status === 'pending' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedPayment(payment)
                                setReceiptDialogOpen(true)
                              }}
                            >
                              <Upload className="h-4 w-4 mr-1" />
                              Receipt
                            </Button>
                          )}
                          {payment.receipt_url && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(payment.receipt_url, '_blank')}
                            >
                              <Receipt className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          )}
                          {canManagePayments && payment.status === 'pending' && payment.receipt_url && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleConfirmPayment(payment.id)}
                              >
                                <Check className="h-4 w-4 text-green-500" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRejectPayment(payment.id)}
                              >
                                <X className="h-4 w-4 text-red-500" />
                              </Button>
                            </>
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

        <Dialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Upload Payment Receipt</DialogTitle>
              <DialogDescription>
                Upload the bank transfer receipt for payment confirmation
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUploadReceipt} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="transaction_id">Transaction ID</Label>
                <Input
                  id="transaction_id"
                  placeholder="Enter transaction reference number"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="receipt">Receipt File</Label>
                <Input
                  id="receipt"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Upload Receipt
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
