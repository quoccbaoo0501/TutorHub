
/*******************************************************************
*  CORE FUNCTION – tự động cập nhật cột updated_at                 *
*******************************************************************/
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

/*******************************************************************
*  BẢNG CHÍNH                                                      *
*******************************************************************/
-- 1. profiles -----------------------------------------------------
CREATE TABLE profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT UNIQUE NOT NULL,
  full_name    TEXT,
  phone_number TEXT,
  address      TEXT,
  gender       TEXT CHECK (gender IN ('male','female','other')),
  role         TEXT NOT NULL CHECK (role IN ('customer','tutor','admin','staff')),
  created_at   TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. customers ----------------------------------------------------
CREATE TABLE customers (
  id         UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. tutors -------------------------------------------------------
CREATE TABLE tutors (
  id                 UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  certificate_image  TEXT,
  certificate_approve BOOLEAN DEFAULT FALSE,
  education          TEXT,
  experience         TEXT,
  subjects           TEXT,
  created_at         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. classes ------------------------------------------------------
CREATE TABLE classes (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,
  subject             TEXT NOT NULL,
  description         TEXT,
  status              TEXT NOT NULL DEFAULT 'active'
                       CHECK (status IN ('active','completed','cancelled',
                                         'pending','approved','matched','rejected')),
  customer_id         UUID REFERENCES profiles(id),
  level               TEXT,
  province            TEXT,
  district            TEXT,
  address             TEXT,
  schedule            TEXT,
  tutor_requirements  TEXT,
  special_requirements TEXT,
  selected_tutor_id   UUID REFERENCES tutors(id),
  created_at          TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. contracts ----------------------------------------------------
CREATE TABLE contracts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id  UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  tutor_id     UUID NOT NULL REFERENCES tutors(id)    ON DELETE CASCADE,
  class_id     UUID NOT NULL REFERENCES classes(id)   ON DELETE CASCADE,
  start_date   DATE NOT NULL,
  end_date     DATE NOT NULL,
  total_hours  INT  NOT NULL,
  hourly_rate  NUMERIC(10,2) NOT NULL,
  total_amount NUMERIC(10,2) NOT NULL,
  status       TEXT NOT NULL DEFAULT 'active'
               CHECK (status IN ('active','completed','cancelled')),
  created_at   TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6. payments -----------------------------------------------------
CREATE TABLE payments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id   UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  amount        NUMERIC(10,2) NOT NULL,
  payment_date  TIMESTAMPTZ   NOT NULL,
  payment_method TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','completed','failed')),
  created_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 7. tutor_applications ------------------------------------------
CREATE TABLE tutor_applications (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id  UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  tutor_id  UUID NOT NULL REFERENCES tutors(id)  ON DELETE CASCADE,
  self_introduction TEXT,
  status    TEXT DEFAULT 'pending'
            CHECK (status IN ('pending','approved','rejected','selected')),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

/*******************************************************************
*  TRIGGER updated_at cho mọi bảng                                 *
*******************************************************************/
-- profiles, tutors, customers, classes, contracts, payments, tutor_applications
CREATE TRIGGER trig_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trig_tutors_updated_at
BEFORE UPDATE ON tutors
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trig_customers_updated_at
BEFORE UPDATE ON customers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trig_classes_updated_at
BEFORE UPDATE ON classes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trig_contracts_updated_at
BEFORE UPDATE ON contracts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trig_payments_updated_at
BEFORE UPDATE ON payments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trig_tutor_apps_updated_at
BEFORE UPDATE ON tutor_applications
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

/*******************************************************************
*  HÀM + TRIGGER tạo hồ sơ khi người dùng đăng ký mới               *
*******************************************************************/
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  INSERT INTO profiles(id,email,role,full_name,phone_number,address,gender)
  VALUES ( NEW.id,
           NEW.email,
           COALESCE(NEW.raw_user_meta_data->>'role','customer'),
           NEW.raw_user_meta_data->>'full_name',
           NEW.raw_user_meta_data->>'phone_number',
           NEW.raw_user_meta_data->>'address',
           NEW.raw_user_meta_data->>'gender');

  IF NEW.raw_user_meta_data->>'role' = 'customer' THEN
    INSERT INTO customers(id) VALUES (NEW.id);
  ELSIF NEW.raw_user_meta_data->>'role' = 'tutor' THEN
    INSERT INTO tutors(id,education,experience,subjects)
    VALUES (NEW.id,
            NEW.raw_user_meta_data->>'education',
            NEW.raw_user_meta_data->>'experience',
            NEW.raw_user_meta_data->>'subjects');
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

/*******************************************************************
*  CHỈ SỐ                                                          *
*******************************************************************/
CREATE INDEX idx_classes_customer_id ON classes(customer_id);
CREATE INDEX idx_classes_status      ON classes(status);

/*******************************************************************
*  ROW-LEVEL SECURITY (RLS) & POLICIES                             *
*******************************************************************/
-- PROFILES --------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_select_own
  ON profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY profiles_insert_own
  ON profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY profiles_update_own
  ON profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- TUTORS ----------------------------------------------------------
ALTER TABLE tutors ENABLE ROW LEVEL SECURITY;

CREATE POLICY tutors_select
  ON tutors FOR SELECT TO authenticated
  USING (auth.uid() = id OR certificate_approve = TRUE);

CREATE POLICY tutors_insert_own
  ON tutors FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY tutors_update_own
  ON tutors FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- CLASSES ---------------------------------------------------------
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

-- Khách tạo / sở hữu lớp
CREATE POLICY classes_insert_owner
  ON classes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY classes_update_owner
  ON classes FOR UPDATE TO authenticated
  USING (auth.uid() = customer_id)
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY classes_delete_owner
  ON classes FOR DELETE TO authenticated
  USING (auth.uid() = customer_id);

-- Quyền xem lớp
CREATE POLICY classes_select_general
  ON classes FOR SELECT TO authenticated
  USING (
    -- Chủ lớp
    auth.uid() = customer_id
    -- Hoặc lớp đã được duyệt
    OR status = 'approved'
    -- Hoặc admin / staff
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin','staff')
    )
  );

-- ADMIN & STAFF chỉnh sửa bất kỳ lớp nào
CREATE POLICY classes_admin_update
  ON classes FOR UPDATE TO authenticated
  USING (EXISTS (
           SELECT 1 FROM profiles p
           WHERE p.id = auth.uid() AND p.role IN ('admin','staff')
         ));

-- CUSTOMERS -------------------------------------------------------
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY customers_select_own
  ON customers FOR SELECT TO authenticated
  USING (auth.uid() = id);



/*******************************************************************
*  Tạo policy cho select các thông tin profiles của customer và tutor          *
*******************************************************************/
-- Tạo policy mới không dính tới bảng classes
CREATE POLICY profiles_select_public
ON profiles
FOR SELECT
TO authenticated
USING (
      /* A. Chính chủ */
      auth.uid() = id

      /* B. Hồ sơ tutor đã duyệt chứng chỉ – cho mọi user xem */
      OR EXISTS (
          SELECT 1
          FROM tutors t
          WHERE t.id = profiles.id
            AND t.certificate_approve = TRUE
      )

      /* C. Nếu người đăng nhập là tutor,
            cho phép xem tất cả hồ sơ có role = 'customer'  */
      OR (
          EXISTS (SELECT 1 FROM tutors t2 WHERE t2.id = auth.uid())
          AND role = 'customer'
      )
);


-- Cho phép người dùng đã xác thực upload file vào bucket "certificates"
CREATE POLICY "Authenticated users can upload to certificates"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'certificates'
  AND auth.role() = 'authenticated'
);

-- Cho phép người dùng authenticated xem file của mình trong bucket certificates
CREATE POLICY "Authenticated users can read from certificates"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'certificates'
);

-- Cho phép người dùng authenticated update file của mình trong bucket certificates
CREATE POLICY "Authenticated users can update certificates"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'certificates'
  AND auth.role() = 'authenticated'
);

-- Cho phép staff có thể xem được 
CREATE POLICY "Staff can view all certificates"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id IN ('certificates')
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'staff'
  )
);
