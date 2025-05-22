"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { ClassRequest } from "@/types/class"
// First, update the import to use the JSON file instead of the TS file
// Replace:
// With:
import vietnamProvincesData from "@/data/vietnam-provinces.json"

interface ClassRequestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (classRequest: Omit<ClassRequest, "id" | "customer_id" | "created_at" | "status">) => Promise<boolean>
}

// Component hiển thị dialog tạo yêu cầu mở lớp mới
export function ClassRequestDialog({ open, onOpenChange, onSubmit }: ClassRequestDialogProps) {
  // State cho các trường dữ liệu của form
  const [subject, setSubject] = useState("")
  const [level, setLevel] = useState("")
  const [province, setProvince] = useState("")
  const [district, setDistrict] = useState("")
  const [address, setAddress] = useState("")
  const [schedule, setSchedule] = useState("")
  const [tutorRequirements, setTutorRequirements] = useState("")
  const [specialRequirements, setSpecialRequirements] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [districts, setDistricts] = useState<string[]>([])

  // Reset form khi dialog mở/đóng
  useEffect(() => {
    if (!open) {
      resetForm()
    }
  }, [open])

  // Then update the component to handle the new data structure
  // Update the useEffect that handles province selection:
  // Replace the existing useEffect for province selection with:
  useEffect(() => {
    if (province) {
      const selectedProvince = vietnamProvincesData.find((p) => p.CityName === province)
      setDistricts(selectedProvince?.Districts || [])
      setDistrict("")
    } else {
      setDistricts([])
      setDistrict("")
    }
  }, [province])

  // Hàm reset form về trạng thái ban đầu
  const resetForm = () => {
    setSubject("")
    setLevel("")
    setProvince("")
    setDistrict("")
    setAddress("")
    setSchedule("")
    setTutorRequirements("")
    setSpecialRequirements("")
    setError(null)
  }

  // Xử lý khi người dùng submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    // Kiểm tra các trường bắt buộc
    if (!subject || !level || !province || !district || !schedule || !address) {
      setError("Vui lòng điền đầy đủ thông tin bắt buộc")
      setIsLoading(false)
      return
    }

    // Tạo đối tượng yêu cầu mở lớp
    const classRequest = {
      name: subject, // Thêm trường name
      subject,
      level,
      province,
      district,
      address,
      schedule,
      tutor_requirements: tutorRequirements,
      special_requirements: specialRequirements,
      updated_at: new Date().toISOString(), // Thêm trường updated_at
    }

    // Gửi yêu cầu
    const success = await onSubmit(classRequest)

    if (success) {
      onOpenChange(false)
      resetForm()
    }

    setIsLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Gửi yêu cầu tìm gia sư</DialogTitle>
          <DialogDescription>Điền đầy đủ thông tin để gửi yêu cầu tìm gia sư</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 py-2">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="subject">
                Môn học <span className="text-red-500">*</span>
              </Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Toán, Lý, Hóa, Văn, Anh..."
                disabled={isLoading}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="level">
                Cấp độ <span className="text-red-500">*</span>
              </Label>
              <Select value={level} onValueChange={setLevel} disabled={isLoading}>
                <SelectTrigger id="level">
                  <SelectValue placeholder="Chọn cấp độ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="primary">Tiểu học</SelectItem>
                  <SelectItem value="secondary">THCS</SelectItem>
                  <SelectItem value="high">THPT</SelectItem>
                  <SelectItem value="other">Khác</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="province">
                Tỉnh/Thành phố <span className="text-red-500">*</span>
              </Label>
              <Select value={province} onValueChange={setProvince} disabled={isLoading}>
                <SelectTrigger id="province">
                  <SelectValue placeholder="Chọn tỉnh/thành phố" />
                </SelectTrigger>
                {/* Update the province select dropdown: */}
                {/* Replace: */}
                {/* With: */}
                <SelectContent className="max-h-[300px]">
                  {vietnamProvincesData.map((p) => (
                    <SelectItem key={p.CityName} value={p.CityName}>
                      {p.CityName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="district">
                Quận/Huyện <span className="text-red-500">*</span>
              </Label>
              <Select value={district} onValueChange={setDistrict} disabled={isLoading || !province}>
                <SelectTrigger id="district">
                  <SelectValue placeholder={province ? "Chọn quận/huyện" : "Chọn tỉnh/thành phố trước"} />
                </SelectTrigger>
                <SelectContent>
                  {districts.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="address">
              Địa chỉ cụ thể <span className="text-red-500">*</span>
            </Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Số nhà, đường, phường/xã..."
              disabled={isLoading}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="schedule">
              Lịch học mong muốn <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="schedule"
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
              placeholder="Các ngày trong tuần, thời gian cụ thể..."
              disabled={isLoading}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="tutorRequirements">Yêu cầu về gia sư</Label>
            <Textarea
              id="tutorRequirements"
              value={tutorRequirements}
              onChange={(e) => setTutorRequirements(e.target.value)}
              placeholder="Giới tính, kinh nghiệm, trường học..."
              disabled={isLoading}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="specialRequirements">Yêu cầu đặc biệt khác</Label>
            <Textarea
              id="specialRequirements"
              value={specialRequirements}
              onChange={(e) => setSpecialRequirements(e.target.value)}
              placeholder="Ví dụ: cần gia sư có kinh nghiệm dạy trẻ đặc biệt..."
              disabled={isLoading}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                "Gửi yêu cầu"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
