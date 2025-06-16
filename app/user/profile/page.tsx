"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

export default function ProfilePage() {
  // State để lưu trữ thông tin hồ sơ và trạng thái
  const [profile, setProfile] = useState<any>(null)
  const [tutorInfo, setTutorInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const { toast } = useToast()

  // Khởi tạo Supabase client
  const supabase = createClientComponentClient({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  })

  const handleCertificateUpload = async (file: File) => {
    try {
      setIsUploading(true)

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error("File quá lớn. Vui lòng chọn file nhỏ hơn 5MB.")
      }

      // Validate file type
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"]
      if (!allowedTypes.includes(file.type)) {
        throw new Error("Định dạng file không được hỗ trợ. Vui lòng chọn file JPG, PNG hoặc PDF.")
      }

      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        throw new Error("Không tìm thấy thông tin người dùng")
      }

      // Create unique filename
      const fileExt = file.name.split(".").pop()
      const fileName = `${userData.user.id}-${Date.now()}.${fileExt}`

      // Upload file to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("certificates")
        .upload(fileName, file, {
          upsert: true,
          contentType: file.type,
        })

      if (uploadError) {
        console.error("Upload error:", uploadError)
        throw new Error("Không thể tải lên file. Vui lòng thử lại.")
      }

      // Update tutor record with certificate image path
      const { error: updateError } = await supabase
        .from("tutors")
        .update({
          certificate_image: uploadData.path,
          certificate_approve: false, // Reset approval when new certificate is uploaded
        })
        .eq("id", userData.user.id)

      if (updateError) {
        console.error("Database update error:", updateError)
        throw new Error("Không thể cập nhật thông tin chứng chỉ.")
      }

      // Refresh tutor info
      const { data: tutorData, error: tutorError } = await supabase
        .from("tutors")
        .select(`
        id,
        education,
        experience,
        subjects,
        certificate_approve,
        certificate_image,
        created_at,
        updated_at,
        profiles (
          full_name,
          email,
          phone_number,
          address,
          gender,
          role
        )
      `)
        .eq("id", userData.user.id)
        .maybeSingle()

      if (!tutorError && tutorData) {
        setTutorInfo(tutorData)
      }

      toast({
        title: "Thành công",
        description: "Tải lên chứng chỉ thành công! Vui lòng chờ admin duyệt.",
      })
    } catch (error: any) {
      console.error("Certificate upload error:", error)
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tải lên chứng chỉ. Vui lòng thử lại.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      setSelectedFile(null)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      handleCertificateUpload(file)
    }
  }

  // Hàm hiển thị giới tính
  const getGenderText = (gender: string | undefined | null) => {
    if (!gender) return "Chưa cập nhật"

    switch (gender) {
      case "male":
        return "Nam"
      case "female":
        return "Nữ"
      case "other":
        return "Khác"
      default:
        return "Chưa cập nhật"
    }
  }

  // Tải thông tin hồ sơ khi component được tải
  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true)

        // Lấy thông tin người dùng hiện tại
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          setError("Không tìm thấy thông tin người dùng")
          return
        }

        // Lấy thông tin hồ sơ từ bảng profiles
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select(`
    id,
    email,
    full_name,
    phone_number,
    address,
    gender,
    role,
    created_at,
    updated_at
  `)
          .eq("id", user.id)
          .maybeSingle()

        if (profileError) {
          console.error("Lỗi lấy hồ sơ:", profileError)
          setError("Không thể tải thông tin hồ sơ")
          return
        }

        if (!profileData) {
          setError("Không tìm thấy thông tin hồ sơ")
          return
        }

        setProfile(profileData)

        // Nếu người dùng là gia sư, lấy thêm thông tin từ bảng tutors
        if (profileData.role === "tutor") {
          const { data: tutorData, error: tutorError } = await supabase
            .from("tutors")
            .select(`
    id,
    education,
    experience,
    subjects,
    certificate_approve,
    certificate_image,
    created_at,
    updated_at,
    profiles (
      full_name,
      email,
      phone_number,
      address,
      gender,
      role
    )
  `)
            .eq("id", user.id)
            .maybeSingle()

          if (tutorError) {
            console.error("Lỗi lấy thông tin gia sư:", tutorError)
          } else {
            setTutorInfo(tutorData)
          }
        }
      } catch (err) {
        console.error("Lỗi không mong muốn:", err)
        setError("Đã xảy ra lỗi khi tải thông tin hồ sơ")
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [supabase])

  // Hiển thị trạng thái đang tải
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  // Hiển thị thông báo lỗi nếu có
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Lỗi</CardTitle>
          <CardDescription>Không thể tải thông tin hồ sơ</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">{error}</p>
          <Button className="mt-4" onClick={() => window.location.reload()}>
            Thử lại
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Hiển thị thông tin hồ sơ
  return (
    <div
      className="min-h-screen w-full py-8 px-2 md:px-8 text-gray-900 dark:text-gray-100 bg-[#7de3eb] dark:bg-[#101a2b]"
      style={{ fontFamily: 'Roboto, Open Sans, sans-serif' }}
    >
      <div className="inline-block rounded-lg px-6 py-3 text-2xl font-bold text-center mb-6" style={{ color: '#d9534f', fontFamily: 'Roboto, Open Sans, sans-serif', background: 'transparent' }}>
        Hồ sơ của tôi
      </div>
      <Card className="bg-white dark:bg-[#23272a] border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-bold mb-2">Thông tin cá nhân</CardTitle>
          <CardDescription>Thông tin chi tiết về tài khoản của bạn</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-12">
            <div>
              <span className="font-medium text-[#8e24aa]">Email</span>
              <div>{profile.email}</div>
            </div>
            <div>
              <span className="font-medium text-[#8e24aa]">Họ và tên</span>
              <div>{profile.full_name}</div>
            </div>
            <div>
              <span className="font-medium text-[#8e24aa]">Giới tính</span>
              <div>{getGenderText(profile.gender)}</div>
            </div>
            <div>
              <span className="font-medium text-[#8e24aa]">Số điện thoại</span>
              <div>{profile.phone_number}</div>
            </div>
            <div>
              <span className="font-medium text-[#8e24aa]">Địa chỉ</span>
              <div>{profile.address}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
