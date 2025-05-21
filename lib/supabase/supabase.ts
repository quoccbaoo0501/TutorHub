import { createClient } from "@supabase/supabase-js"

// Lấy thông tin kết nối Supabase từ biến môi trường
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Kiểm tra xem biến môi trường có tồn tại không
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Thiếu biến môi trường Supabase. Vui lòng kiểm tra file .env.local")
}

// Tạo và xuất client Supabase
export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "")
