// Định nghĩa các kiểu dữ liệu liên quan đến xác thực

// Kiểu dữ liệu cho vai trò người dùng
export type UserRole = "customer" | "tutor" | "admin" | "staff"

// Kiểu dữ liệu cho metadata của người dùng
export interface UserMetadata {
  role: UserRole
  full_name: string
  phone_number: string
  address: string
  education?: string
  experience?: string
  subjects?: string
  email_verified?: boolean
  phone_verified?: boolean
}

// Kiểu dữ liệu cho hồ sơ người dùng
export interface Profile {
  id: string
  email: string
  full_name: string
  phone_number: string
  address: string
  role: UserRole
  education?: string
  experience?: string
  subjects?: string
  created_at?: string
  updated_at?: string
}

// Kiểu dữ liệu cho form đăng ký
export interface RegisterFormData {
  email: string
  password: string
  confirmPassword: string
  fullName: string
  phoneNumber: string
  address: string
  userType: "customer" | "tutor"
  education?: string
  experience?: string
  subjects?: string
}
