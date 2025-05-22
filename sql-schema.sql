-- Tạo bảng profiles để lưu thông tin người dùng
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone_number TEXT,
  address TEXT,
  role TEXT NOT NULL CHECK (role IN ('customer', 'tutor', 'admin', 'staff')),
  education TEXT,
  experience TEXT,
  subjects TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tạo bảng classes để lưu thông tin lớp học
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tạo bảng tutors để lưu thông tin gia sư
CREATE TABLE IF NOT EXISTS tutors (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  rating NUMERIC(3,2) DEFAULT 0,
  hourly_rate NUMERIC(10,2),
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tạo bảng customers để lưu thông tin khách hàng
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tạo bảng contracts để lưu thông tin hợp đồng
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  tutor_id UUID NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_hours INTEGER NOT NULL,
  hourly_rate NUMERIC(10,2) NOT NULL,
  total_amount NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tạo bảng sessions để lưu thông tin buổi học
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  tutor_id UUID NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tạo bảng payments để lưu thông tin thanh toán
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  payment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  payment_method TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tạo bảng reviews để lưu thông tin đánh giá
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  tutor_id UUID NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tạo trigger để tự động cập nhật updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Áp dụng trigger cho tất cả các bảng
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_classes_updated_at
BEFORE UPDATE ON classes
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tutors_updated_at
BEFORE UPDATE ON tutors
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at
BEFORE UPDATE ON customers
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contracts_updated_at
BEFORE UPDATE ON contracts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at
BEFORE UPDATE ON sessions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
BEFORE UPDATE ON payments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at
BEFORE UPDATE ON reviews
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();



-- Cập nhật user_metadata cho tất cả người dùng dựa trên vai trò trong bảng profiles
UPDATE auth.users u
SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object('role', p.role)
FROM profiles p
WHERE u.id = p.id;

-- Kiểm tra kết quả
SELECT id, email, raw_user_meta_data
FROM auth.users;


-- Thêm các trường mới vào bảng profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS certificate_image TEXT,
ADD COLUMN IF NOT EXISTS certificate_approve BOOLEAN DEFAULT FALSE;

-- Thêm các trường cần thiết vào bảng classes để hỗ trợ chức năng yêu cầu mở lớp
ALTER TABLE classes
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS level TEXT,
ADD COLUMN IF NOT EXISTS province TEXT,
ADD COLUMN IF NOT EXISTS district TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS schedule TEXT,
ADD COLUMN IF NOT EXISTS tutor_requirements TEXT,
ADD COLUMN IF NOT EXISTS special_requirements TEXT;

-- Cập nhật kiểm tra ràng buộc cho trường status trong bảng classes
ALTER TABLE classes
DROP CONSTRAINT IF EXISTS classes_status_check;

ALTER TABLE classes
ADD CONSTRAINT classes_status_check 
CHECK (status IN ('active', 'completed', 'cancelled', 'pending', 'approved', 'matched', 'rejected'));

-- Tạo các chỉ mục để tăng tốc truy vấn
CREATE INDEX IF NOT EXISTS idx_classes_customer_id ON classes(customer_id);
CREATE INDEX IF NOT EXISTS idx_classes_status ON classes(status);

-- Tạo các chính sách bảo mật hàng (RLS) cho bảng classes
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

-- Chính sách cho phép khách hàng xem các lớp học của họ
CREATE POLICY customer_select_own_classes ON classes 
  FOR SELECT 
  USING (auth.uid() = customer_id);

-- Chính sách cho phép khách hàng tạo lớp học mới
CREATE POLICY customer_insert_own_classes ON classes 
  FOR INSERT 
  WITH CHECK (auth.uid() = customer_id);

-- Chính sách cho phép admin và staff xem tất cả lớp học
CREATE POLICY admin_staff_select_all_classes ON classes 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.role = 'admin' OR profiles.role = 'staff')
    )
  );

-- Chính sách cho phép admin và staff cập nhật tất cả lớp học
CREATE POLICY admin_staff_update_all_classes ON classes 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.role = 'admin' OR profiles.role = 'staff')
    )
  );


-- Chuyển 2 rows certificate từ profiles sang tutors , xóa thông tin không cần thiết của tutors
  ALTER TABLE tutors
DROP COLUMN IF EXISTS rating,
DROP COLUMN IF EXISTS hourly_rate,
DROP COLUMN IF EXISTS is_available;
ALTER TABLE tutors
ADD COLUMN IF NOT EXISTS certificate_image TEXT,
ADD COLUMN IF NOT EXISTS certificate_approve BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles
DROP COLUMN IF EXISTS certificate_image,
DROP COLUMN IF EXISTS certificate_approve;



-- Chuyển 3 rows dành cho tutors từ profiles sang tutors , xóa thông tin không cần thiết của tutors
ALTER TABLE tutors
ADD COLUMN IF NOT EXISTS education TEXT,
ADD COLUMN IF NOT EXISTS experience TEXT,
ADD COLUMN IF NOT EXISTS subjects TEXT;
ALTER TABLE profiles
DROP COLUMN IF EXISTS education,
DROP COLUMN IF EXISTS experience,
DROP COLUMN IF EXISTS subjects;


--Thêm row vào tutors table : Gia sư được chọn 
ALTER TABLE classes
ADD COLUMN IF NOT EXISTS selected_tutor_id UUID REFERENCES tutors(id);


-- Tạo bảng danh sách gia sư đăng kí vào 1 lớp 
CREATE TABLE IF NOT EXISTS tutor_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  tutor_id UUID NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' 
    CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE tutor_applications
ADD column IF NOT EXISTS self_introduction TEXT;


--Xóa table , row không cần thiết
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;


-- Thêm policy cho việc customer có thể xóa lớp họ đã đăng kí 
CREATE POLICY customer_delete_own_classes ON classes
  FOR DELETE
  USING (auth.uid() = customer_id);


-- Tạo policy mới cho phép người dùng xem lớp đã duyệt
CREATE POLICY "Allow viewing approved classes for all users"
ON classes
FOR SELECT
USING (
  status = 'approved'
);