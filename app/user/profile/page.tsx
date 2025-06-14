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
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Hồ sơ của tôi</h1>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin cá nhân</CardTitle>
          <CardDescription>Thông tin chi tiết về tài khoản của bạn</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {profile && profile ? (
            <>
              {/* Badge for tutor approval status */}
              {profile.role === "tutor" && (
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Trạng thái tài khoản</h3>
                  <Badge
                    variant={tutorInfo?.certificate_approve ? "default" : "secondary"}
                    className={
                      tutorInfo?.certificate_approve
                        ? "bg-green-100 text-green-800 border-green-200"
                        : "bg-yellow-100 text-yellow-800 border-yellow-200"
                    }
                  >
                    {tutorInfo?.certificate_approve ? "Đã được duyệt" : "Chờ duyệt"}
                  </Badge>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Email</h3>
                  <p>{profile.email}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Họ và tên</h3>
                  <p>{profile.full_name || "Chưa cập nhật"}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Giới tính</h3>
                  <p>{getGenderText(profile.gender)}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Số điện thoại</h3>
                  <p>{profile.phone_number || "Chưa cập nhật"}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Địa chỉ</h3>
                  <p>{profile.address || "Chưa cập nhật"}</p>
                </div>
              </div>

              {profile.role === "tutor" && (
                <div className="mt-6 pt-6 border-t">
                  <h2 className="text-xl font-semibold mb-4">Chứng chỉ bằng cấp</h2>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground mb-2">Tải lên chứng chỉ</h3>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleFileChange}
                        disabled={isUploading}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 disabled:opacity-50"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Chấp nhận file ảnh (JPG, PNG) hoặc PDF. Tối đa 5MB.
                      </p>
                      {isUploading && (
                        <div className="flex items-center mt-2">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          <span className="text-sm">Đang tải lên...</span>
                        </div>
                      )}
                    </div>

                    {/* Certificate status display */}
                    <div className="space-y-2">
                      <h3 className="font-medium text-sm text-muted-foreground">Trạng thái chứng chỉ</h3>
                      {tutorInfo?.certificate_image ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          <span className="text-sm text-green-600">Đã tải lên chứng chỉ</span>
                          {tutorInfo.certificate_approve ? (
                            <Badge className="bg-green-100 text-green-800 border-green-200">Đã được duyệt</Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                              Chờ duyệt
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                          <span className="text-sm text-gray-600">Chưa tải lên chứng chỉ</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Hiển thị thông tin bổ sung cho gia sư từ bảng tutors */}
              {profile.role === "tutor" && (
                <div className="mt-6 pt-6 border-t">
                  <h2 className="text-xl font-semibold mb-4">Thông tin gia sư</h2>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground">Học vấn</h3>
                      <p>{tutorInfo?.education || "Chưa cập nhật"}</p>
                    </div>
                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground">Kinh nghiệm</h3>
                      <p>{tutorInfo?.experience || "Chưa cập nhật"}</p>
                    </div>
                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground">Môn dạy</h3>
                      <p>{tutorInfo?.subjects || "Chưa cập nhật"}</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p>Không tìm thấy thông tin hồ sơ. Vui lòng liên hệ quản trị viên.</p>
          )}
        </CardContent>
      </Card>

      {/* Hiển thị dữ liệu JSON cho mục đích debug */}
      <Card>
        <CardHeader>
          <CardTitle>Dữ liệu người dùng (Debug)</CardTitle>
          <CardDescription>Thông tin chi tiết từ cơ sở dữ liệu</CardDescription>
        </CardHeader>
        <CardContent>
          <h3 className="text-sm font-medium mb-2">Thông tin hồ sơ:</h3>
          <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-auto text-xs mb-4">
            {JSON.stringify(profile, null, 2)}
          </pre>

          {profile?.role === "tutor" && (
            <>
              <h3 className="text-sm font-medium mb-2">Thông tin gia sư:</h3>
              <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-auto text-xs">
                {JSON.stringify(tutorInfo, null, 2)}
              </pre>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
