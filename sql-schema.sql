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
CREATE TABLE public.profiles (
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
CREATE TABLE public.customers (
  id         UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. tutors -------------------------------------------------------
CREATE TABLE public.tutors (
  id                 UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  certificate_image  TEXT,
  certificate_approve BOOLEAN DEFAULT FALSE,
  education          TEXT,
  experience         TEXT,
  subjects           TEXT,
  created_at         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. classes ------------------------------------------------------
CREATE TABLE public.classes (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,
  subject             TEXT NOT NULL,
  description         TEXT,
  status              TEXT NOT NULL DEFAULT 'active'
                       CHECK (status IN ('active','completed','cancelled',
                                         'pending','approved','matched','rejected')),
  customer_id         UUID REFERENCES public.profiles(id),
  level               TEXT,
  province            TEXT,
  district            TEXT,
  address             TEXT,
  schedule            TEXT,
  tutor_requirements  TEXT,
  special_requirements TEXT,
  selected_tutor_id   UUID REFERENCES public.tutors(id),
  created_at          TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. contracts ----------------------------------------------------
CREATE TABLE public.contracts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id  UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  tutor_id     UUID NOT NULL REFERENCES public.tutors(id)    ON DELETE CASCADE,
  class_id     UUID NOT NULL REFERENCES public.classes(id)   ON DELETE CASCADE,
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

-- 6. tutor_applications -------------------------------------------
CREATE TABLE public.tutor_applications (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id  UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  tutor_id  UUID NOT NULL REFERENCES public.tutors(id)  ON DELETE CASCADE,
  self_introduction TEXT,
  status    TEXT DEFAULT 'pending'
            CHECK (status IN ('pending','approved','rejected','selected')),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 7. Cài đặt phí môi giới -----------------------------------------
CREATE TABLE public.payment_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fee_percentage NUMERIC(5,2) NOT NULL DEFAULT 10.00,
  min_fee NUMERIC(12,2) DEFAULT 0,
  max_fee NUMERIC(12,2),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 8. Thanh toán phí môi giới --------------------------------------
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  tutor_id UUID NOT NULL REFERENCES public.tutors(id) ON DELETE CASCADE,
  contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
  fee_percentage NUMERIC(5,2) NOT NULL,
  contract_amount NUMERIC(12,2) NOT NULL,
  calculated_fee NUMERIC(12,2) NOT NULL,
  actual_fee NUMERIC(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'waived', 'overdue')),
  due_date DATE,
  paid_date TIMESTAMPTZ,
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(class_id, tutor_id)
);

-- 9. Ca làm việc --------------------------------------------------
CREATE TABLE public.work_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  days_of_week INTEGER[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 10. Lịch làm việc nhân viên -------------------------------------
CREATE TABLE public.staff_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  shift_id UUID NOT NULL REFERENCES public.work_shifts(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(staff_id, shift_id, start_date)
);

-- 11. Lương nhân viên ---------------------------------------------
CREATE TABLE public.staff_salaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  base_salary NUMERIC(12,2) NOT NULL DEFAULT 0,
  bonus NUMERIC(12,2) DEFAULT 0,
  deduction NUMERIC(12,2) DEFAULT 0,
  total_salary NUMERIC(12,2) GENERATED ALWAYS AS (base_salary + COALESCE(bonus, 0) - COALESCE(deduction, 0)) STORED,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL CHECK (year >= 2020),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  paid_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(staff_id, month, year)
);

/*******************************************************************
*  TRIGGER updated_at cho mọi bảng                                 *
*******************************************************************/
CREATE TRIGGER trig_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trig_tutors_updated_at BEFORE UPDATE ON public.tutors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trig_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trig_classes_updated_at BEFORE UPDATE ON public.classes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trig_contracts_updated_at BEFORE UPDATE ON public.contracts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trig_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trig_tutor_apps_updated_at BEFORE UPDATE ON public.tutor_applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trig_payment_settings_updated_at BEFORE UPDATE ON public.payment_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trig_work_shifts_updated_at BEFORE UPDATE ON public.work_shifts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trig_staff_schedules_updated_at BEFORE UPDATE ON public.staff_schedules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trig_staff_salaries_updated_at BEFORE UPDATE ON public.staff_salaries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

/*******************************************************************
*  HÀM + TRIGGER tạo hồ sơ khi người dùng đăng ký mới              *
*******************************************************************/
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  INSERT INTO public.profiles(id,email,role,full_name,phone_number,address,gender)
  VALUES ( NEW.id,
           NEW.email,
           COALESCE(NEW.raw_user_meta_data->>'role','customer'),
           NEW.raw_user_meta_data->>'full_name',
           NEW.raw_user_meta_data->>'phone_number',
           NEW.raw_user_meta_data->>'address',
           NEW.raw_user_meta_data->>'gender');

  IF NEW.raw_user_meta_data->>'role' = 'customer' THEN
    INSERT INTO public.customers(id) VALUES (NEW.id);
  ELSIF NEW.raw_user_meta_data->>'role' = 'tutor' THEN
    INSERT INTO public.tutors(id,education,experience,subjects)
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
CREATE INDEX idx_classes_customer_id ON public.classes(customer_id);
CREATE INDEX idx_classes_status ON public.classes(status);
CREATE INDEX idx_payments_class_tutor ON public.payments(class_id, tutor_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_payments_due_date ON public.payments(due_date);

/*******************************************************************
*  ROW-LEVEL SECURITY (RLS) & POLICIES                             *
*******************************************************************/
-- PROFILES --------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_insert_own ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY profiles_update_own ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY profiles_select_policy ON public.profiles FOR SELECT TO authenticated USING (
  auth.uid() = id
  OR (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('admin', 'staff')
  OR (
    role = 'tutor' 
    AND EXISTS (SELECT 1 FROM public.tutors t WHERE t.id = profiles.id AND t.certificate_approve = TRUE)
  )
  OR (
    role = 'customer'
    AND (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'tutor'
  )
);

-- TUTORS ----------------------------------------------------------
ALTER TABLE public.tutors ENABLE ROW LEVEL SECURITY;

CREATE POLICY tutors_insert_own ON public.tutors FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY tutors_select_policy ON public.tutors FOR SELECT TO authenticated USING (
  auth.uid() = id 
  OR (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('admin', 'staff')
  OR certificate_approve = TRUE
);
CREATE POLICY tutors_update_policy ON public.tutors FOR UPDATE TO authenticated USING (
  auth.uid() = id 
  OR (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('admin', 'staff')
) WITH CHECK (
  auth.uid() = id 
  OR (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('admin', 'staff')
);

-- CUSTOMERS -------------------------------------------------------
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY customers_select_own ON public.customers FOR SELECT TO authenticated USING (auth.uid() = id);

-- CLASSES ---------------------------------------------------------
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY classes_insert_owner ON public.classes FOR INSERT TO authenticated WITH CHECK (auth.uid() = customer_id);
CREATE POLICY classes_update_owner ON public.classes FOR UPDATE TO authenticated USING (auth.uid() = customer_id) WITH CHECK (auth.uid() = customer_id);
CREATE POLICY classes_delete_owner ON public.classes FOR DELETE TO authenticated USING (auth.uid() = customer_id);
CREATE POLICY classes_select_general ON public.classes FOR SELECT TO authenticated USING (
  auth.uid() = customer_id
  OR status = 'approved'
  OR selected_tutor_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','staff'))
);
CREATE POLICY classes_admin_update ON public.classes FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','staff'))
);

-- CONTRACTS -------------------------------------------------------
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY contracts_select_involved_parties ON public.contracts FOR SELECT TO authenticated USING (
  auth.uid() = customer_id
  OR auth.uid() = tutor_id
  OR (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('admin', 'staff')
);
CREATE POLICY contracts_insert_customer ON public.contracts FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = customer_id
  OR (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('admin', 'staff')
);
CREATE POLICY contracts_update_involved_parties_or_admin ON public.contracts FOR UPDATE TO authenticated USING (
  auth.uid() = customer_id
  OR auth.uid() = tutor_id
  OR (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('admin', 'staff')
) WITH CHECK (
  auth.uid() = customer_id
  OR auth.uid() = tutor_id
  OR (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('admin', 'staff')
);

-- PAYMENTS --------------------------------------------------------
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY payments_admin_all ON public.payments FOR ALL TO authenticated USING (
  (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('admin', 'staff')
);
CREATE POLICY payments_tutor_own ON public.payments FOR SELECT TO authenticated USING (tutor_id = auth.uid());

-- TUTOR APPLICATIONS ----------------------------------------------
ALTER TABLE public.tutor_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY tutor_applications_insert_tutor ON public.tutor_applications FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = tutor_id
  AND (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'tutor'
);
CREATE POLICY tutor_applications_select_involved_or_admin ON public.tutor_applications FOR SELECT TO authenticated USING (
  auth.uid() = tutor_id
  OR EXISTS (SELECT 1 FROM public.classes cl WHERE cl.id = tutor_applications.class_id AND cl.customer_id = auth.uid())
  OR (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('admin', 'staff')
);
CREATE POLICY tutor_applications_update_class_owner_or_admin ON public.tutor_applications FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.classes cl WHERE cl.id = tutor_applications.class_id AND cl.customer_id = auth.uid())
  OR (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('admin', 'staff')
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.classes cl WHERE cl.id = tutor_applications.class_id AND cl.customer_id = auth.uid())
  OR (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('admin', 'staff')
);
CREATE POLICY tutor_applications_delete_own ON public.tutor_applications FOR DELETE TO authenticated USING (
  auth.uid() = tutor_id
  AND (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'tutor'
);

-- CÁC BẢNG QUẢN LÝ NHÂN SỰ ---------------------------------------
ALTER TABLE public.work_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_salaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;

-- Work Shifts
CREATE POLICY work_shifts_admin_all ON public.work_shifts FOR ALL TO authenticated USING (
  (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('admin', 'staff')
);

-- Staff Schedules
CREATE POLICY staff_schedules_admin_all ON public.staff_schedules FOR ALL TO authenticated USING (
  (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('admin', 'staff')
);
CREATE POLICY staff_schedules_staff_own ON public.staff_schedules FOR SELECT TO authenticated USING (staff_id = auth.uid());

-- Staff Salaries
CREATE POLICY staff_salaries_admin_all ON public.staff_salaries FOR ALL TO authenticated USING (
  (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
);
CREATE POLICY staff_salaries_staff_own ON public.staff_salaries FOR SELECT TO authenticated USING (staff_id = auth.uid());

-- Payment Settings
CREATE POLICY payment_settings_admin_all ON public.payment_settings FOR ALL TO authenticated USING (
  (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
);

/*******************************************************************
*  STORAGE POLICIES (BUCKET 'certificates')                        *
*******************************************************************/
CREATE POLICY "Authenticated users can upload to certificates" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'certificates' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read their own certificates" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'certificates' AND owner = auth.uid());

CREATE POLICY "Authenticated users can update their own certificates" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'certificates' AND owner = auth.uid());

CREATE POLICY "Staff can view all certificates" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'certificates' AND EXISTS (
  SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'admin')
));

CREATE POLICY "Staff can update all certificates" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'certificates' AND EXISTS (
  SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'admin')
));

/*******************************************************************
*  DỮ LIỆU MẪU                                                    *
*******************************************************************/
INSERT INTO public.work_shifts (name, start_time, end_time, days_of_week) VALUES
('Ca sáng (T2,T4,T6)', '08:00:00', '12:00:00', ARRAY[2,4,6]),
('Ca chiều (T2,T4,T6)', '13:00:00', '17:00:00', ARRAY[2,4,6]),
('Ca sáng (T3,T5,T7)', '08:00:00', '12:00:00', ARRAY[3,5,7]),
('Ca chiều (T3,T5,T7)', '13:00:00', '17:00:00', ARRAY[3,5,7]);

INSERT INTO public.payment_settings (fee_percentage, min_fee, max_fee) 
VALUES (10.00, 100000, 5000000);
