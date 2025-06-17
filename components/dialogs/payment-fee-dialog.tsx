"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, AlertCircle, CheckCircle, Clock, XCircle, DollarSign } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

interface PaymentFeeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  classId: string
}

interface PaymentFee {
  id: string
  fee_percentage: number
  contract_amount: number
  calculated_fee: number
  actual_fee: number
  status: "pending" | "paid" | "waived" | "overdue"
  due_date: string | null
  paid_date: string | null
  payment_method: string | null
  notes: string | null
  created_at: string
  class: {
    name: string
    subject: string
  }
  tutor: {
    profiles: {
      full_name: string
    }
  }
  contracts: {
    fee: number
  } | null
}

export default function PaymentFeeDialog({ open, onOpenChange, classId }: PaymentFeeDialogProps) {
  const [paymentFee, setPaymentFee] = useState<PaymentFee | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && classId) {
      fetchPaymentFee()
    }
  }, [open, classId])

  const fetchPaymentFee = async () => {
    try {
      setIsLoading(true)
      setError(null)
      setPaymentFee(null) // Reset paymentFee về null

      const supabase = createClientComponentClient()

      const { data, error } = await supabase
        .from("payments")
        .select(`
        *,
        class:classes (
          name,
          subject
        ),
        tutor:tutors (
          profiles (
            full_name
          )
        ),
        contracts (
          fee
        )
      `)
        .eq("class_id", classId)
        .single()

      if (error) {
        if (error.code === "PGRST116") {
          setError("Chưa có thông tin phí môi giới cho lớp học này")
          setPaymentFee(null) // Đảm bảo reset về null
        } else {
          throw error
        }
        return
      }

      setPaymentFee(data)
    } catch (err) {
      console.error("Error fetching payment fee:", err)
      setError("Có lỗi xảy ra khi tải thông tin phí môi giới")
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "overdue":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case "waived":
        return <XCircle className="h-4 w-4 text-gray-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "paid":
        return "Đã thanh toán"
      case "pending":
        return "Chờ thanh toán"
      case "overdue":
        return "Quá hạn"
      case "waived":
        return "Miễn phí"
      default:
        return status
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "paid":
        return "default"
      case "pending":
        return "secondary"
      case "overdue":
        return "destructive"
      case "waived":
        return "outline"
      default:
        return "secondary"
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(dateString))
  }

  const getStatusBadge = (status: string) => {
    return (
      <Badge variant={getStatusVariant(status)} className="flex items-center gap-1">
        {getStatusIcon(status)}
        {getStatusText(status)}
      </Badge>
    )
  }

  useEffect(() => {
    if (!open) {
      setPaymentFee(null)
      setError(null)
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Thông tin phí môi giới</DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Đang tải thông tin phí môi giới...</span>
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">{error}</p>
          </div>
        )}

        {paymentFee && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  {paymentFee.class.name}
                </div>
                {getStatusBadge(paymentFee.status)}
              </CardTitle>
              <div className="text-sm text-muted-foreground">
                <div>Gia sư: {paymentFee.tutor.profiles.full_name}</div>
                <div>Môn: {paymentFee.class.subject}</div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Giá trị hợp đồng:</span>
                  <span className="font-medium">{formatCurrency(paymentFee.contract_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Phí tính toán ({paymentFee.fee_percentage}%):</span>
                  <span className="font-medium">{formatCurrency(paymentFee.calculated_fee)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="font-medium">Phí thực tế:</span>
                  <span className="font-bold text-lg">{formatCurrency(paymentFee.actual_fee)}</span>
                </div>
              </div>

              {paymentFee.due_date && (
                <div className="text-sm text-muted-foreground">
                  <strong>Hạn thanh toán:</strong> {formatDate(paymentFee.due_date)}
                </div>
              )}

              {paymentFee.paid_date && (
                <div className="text-sm text-muted-foreground">
                  <strong>Ngày thanh toán:</strong> {formatDate(paymentFee.paid_date)}
                </div>
              )}

              {paymentFee.payment_method && (
                <div className="text-sm text-muted-foreground">
                  <strong>Phương thức thanh toán:</strong> {paymentFee.payment_method}
                </div>
              )}

              {paymentFee.notes && (
                <div className="text-sm text-muted-foreground">
                  <strong>Ghi chú:</strong> {paymentFee.notes}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  )
}
