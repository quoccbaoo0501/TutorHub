"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart, BookOpen, DollarSign, Users } from "lucide-react"
import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalCustomers: 0,
    totalTutors: 0,
    pendingClasses: 0,
    totalStaff: 0,
    monthlyRevenue: 0,
  });

  const [tutors, setTutors] = useState<any[]>([]);
  const [filteredTutors, setFilteredTutors] = useState<any[]>([]);
  const [isLoadingTutors, setIsLoadingTutors] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // New state for last visit time and recent additions
  const [lastVisitTime, setLastVisitTime] = useState<Date | null>(null);
  const [recentTutors, setRecentTutors] = useState<any[]>([]);
  const [recentCustomers, setRecentCustomers] = useState<any[]>([]);
  const [recentClasses, setRecentClasses] = useState<any[]>([]);

  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalStaffSalary, setTotalStaffSalary] = useState(0);

  const [userRole, setUserRole] = useState<string | null>(null);

  // lastVisit cho từng loại
  const [lastVisitCustomers, setLastVisitCustomers] = useState<string | null>(null);
  const [lastVisitClasses, setLastVisitClasses] = useState<string | null>(null);
  const [lastVisitTutors, setLastVisitTutors] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin-stats")
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error("API ERROR:", err));

    // Lấy role người dùng
    const supabase = createClientComponentClient();
    async function fetchRoleAndFinanceStats() {
      const { data: { session } } = await supabase.auth.getSession();
      setUserRole(session?.user?.user_metadata?.role || null);
      // Tổng doanh thu: sum actual_fee payments (mọi trạng thái, mọi thời điểm)
      const { data: revenueData, error: revenueError } = await supabase
        .from("payments")
        .select("actual_fee");
      if (!revenueError && revenueData) {
        setTotalRevenue(revenueData.reduce((sum, p) => sum + (p.actual_fee || 0), 0));
      }
      // Tổng lương nhân viên: sum total_salary staff_salaries (mọi trạng thái, mọi thời điểm)
      const { data: salaryData, error: salaryError } = await supabase
        .from("staff_salaries")
        .select("total_salary");
      if (!salaryError && salaryData) {
        setTotalStaffSalary(salaryData.reduce((sum, s) => sum + (s.total_salary || 0), 0));
      }
    }
    fetchRoleAndFinanceStats();
  }, []);

  useEffect(() => {
    async function fetchTutors() {
      setIsLoadingTutors(true);
      try {
        const res = await fetch("/api/tutors");
        const data = await res.json();
        setTutors(data || []);
        setFilteredTutors(data || []);
      } catch (err) {
        setTutors([]);
        setFilteredTutors([]);
      } finally {
        setIsLoadingTutors(false);
      }
    }
    fetchTutors();
  }, []);

  useEffect(() => {
    let filtered = tutors;
    if (searchTerm) {
      filtered = filtered.filter((tutor) =>
        tutor.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tutor.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (selectedStatus !== "all") {
      filtered = filtered.filter((tutor) =>
        selectedStatus === "approved" ? tutor.certificate_approve : !tutor.certificate_approve
      );
    }
    setFilteredTutors(filtered);
  }, [searchTerm, selectedStatus, tutors]);

  // Update last visit time on component mount
  useEffect(() => {
    const storedLastVisit = localStorage.getItem("adminLastVisit");
    if (storedLastVisit) {
      setLastVisitTime(new Date(storedLastVisit));
    } else {
      const now = new Date();
      localStorage.setItem("adminLastVisit", now.toISOString());
      setLastVisitTime(now);
    }
  }, []);

  // Fetch recent additions since last visit
  useEffect(() => {
    if (!lastVisitTime) return;

    async function fetchRecentAdditions() {
      const supabase = createClientComponentClient();
      const lastVisitISO = lastVisitTime.toISOString();

      // Fetch recent tutors
      const { data: tutorsData } = await supabase
        .from("tutors")
        .select(`
          id,
          education,
          experience,
          subjects,
          created_at,
          profiles!inner (
            full_name,
            email,
            phone_number,
            address,
            gender
          )
        `)
        .gt("created_at", lastVisitTutors || lastVisitISO)
        .order("created_at", { ascending: false });

      // Fetch recent customers
      const { data: customersData } = await supabase
        .from("profiles")
        .select(`
          id,
          full_name,
          email,
          phone_number,
          address,
          gender,
          created_at
        `)
        .eq("role", "customer")
        .gt("created_at", lastVisitCustomers || lastVisitISO)
        .order("created_at", { ascending: false });

      // Fetch recent classes
      const { data: classesData } = await supabase
        .from("classes")
        .select(`
          id,
          name,
          subject,
          level,
          province,
          district,
          address,
          schedule,
          status,
          created_at,
          customer_id,
          customer_profiles:profiles!customer_id (
            full_name,
            email,
            phone_number,
            gender
          )
        `)
        .gt("created_at", lastVisitClasses || lastVisitISO)
        .order("created_at", { ascending: false });

      setRecentTutors(tutorsData || []);
      setRecentCustomers(customersData || []);
      setRecentClasses(classesData || []);
    }

    fetchRecentAdditions();
  }, [lastVisitTime]);

  // Khi click acknowledge
  const handleAcknowledgeNewCustomers = () => {
    const now = new Date().toISOString();
    localStorage.setItem("adminLastVisitCustomers", now);
    setLastVisitCustomers(now);
    setRecentCustomers([]);
  };
  const handleAcknowledgeNewClasses = () => {
    const now = new Date().toISOString();
    localStorage.setItem("adminLastVisitClasses", now);
    setLastVisitClasses(now);
    setRecentClasses([]);
  };
  const handleAcknowledgeNewTutors = () => {
    const now = new Date().toISOString();
    localStorage.setItem("adminLastVisitTutors", now);
    setLastVisitTutors(now);
    setRecentTutors([]);
  };

  return (
    <div className="min-h-screen w-full bg-[#7de3eb] dark:bg-[#1a2b3c] py-8 px-0">
      <div className="max-w-7xl mx-auto px-4">
        {/* Thống kê tổng quan */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="min-h-[170px] flex flex-col justify-between p-6 bg-[#ffe4c4] border-orange-200 shadow-md hover:shadow-xl transition-transform hover:scale-105">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <span className="bg-orange-100 p-2 rounded-full"><BookOpen className="h-7 w-7 text-orange-500" /></span>
              <CardTitle className="text-base font-semibold text-orange-700">Lớp học</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-extrabold text-orange-700">{stats.totalClasses}</div>
              {recentClasses.length > 0 && (
                <div className="mt-2 text-sm text-orange-600 cursor-pointer hover:underline" onClick={handleAcknowledgeNewClasses}>
                  + {recentClasses.length} lớp mới
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="min-h-[170px] flex flex-col justify-between p-6 bg-[#b3e5fc] border-blue-200 shadow-md hover:shadow-xl transition-transform hover:scale-105">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <span className="bg-blue-100 p-2 rounded-full"><Users className="h-7 w-7 text-blue-500" /></span>
              <CardTitle className="text-base font-semibold text-blue-700">Khách hàng</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-extrabold text-blue-700">{stats.totalCustomers}</div>
              {recentCustomers.length > 0 && (
                <div className="mt-2 text-sm text-blue-600 cursor-pointer hover:underline" onClick={handleAcknowledgeNewCustomers}>
                  + {recentCustomers.length} khách hàng mới
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="min-h-[170px] flex flex-col justify-between p-6 bg-[#d1c4e9] border-purple-200 shadow-md hover:shadow-xl transition-transform hover:scale-105">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <span className="bg-purple-100 p-2 rounded-full"><Users className="h-7 w-7 text-purple-500" /></span>
              <CardTitle className="text-base font-semibold text-purple-700">Gia sư</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-extrabold text-purple-700">{stats.totalTutors}</div>
              {recentTutors.length > 0 && (
                <div className="mt-2 text-sm text-purple-600 cursor-pointer hover:underline" onClick={handleAcknowledgeNewTutors}>
                  + {recentTutors.length} gia sư mới
                </div>
              )}
            </CardContent>
          </Card>
          {userRole === 'admin' && (
            <Card className="min-h-[170px] flex flex-col justify-between p-6 bg-[#c8e6c9] border-green-200 shadow-md hover:shadow-xl transition-transform hover:scale-105">
              <CardHeader className="flex flex-row items-center gap-3 pb-2">
                <span className="bg-green-100 p-2 rounded-full"><Users className="h-7 w-7 text-green-500" /></span>
                <CardTitle className="text-base font-semibold text-green-700">Nhân viên</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-extrabold text-green-700">{stats.totalStaff}</div>
              </CardContent>
            </Card>
          )}
        </div>
        {userRole === 'admin' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-8 w-full">
            <Card className="min-h-[170px] flex flex-col justify-between p-6 bg-[#fff9c4] border-yellow-200 shadow-md hover:shadow-xl transition-transform hover:scale-105">
              <CardHeader className="flex flex-row items-center gap-3 pb-2">
                <span className="bg-yellow-100 p-2 rounded-full"><DollarSign className="h-7 w-7 text-yellow-600" /></span>
                <CardTitle className="text-base font-semibold text-yellow-700">Tổng doanh thu</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-extrabold text-yellow-700">{totalRevenue.toLocaleString("vi-VN")} đ</div>
              </CardContent>
            </Card>
            <Card className="min-h-[170px] flex flex-col justify-between p-6 bg-[#ffe0e0] border-red-200 shadow-md hover:shadow-xl transition-transform hover:scale-105">
              <CardHeader className="flex flex-row items-center gap-3 pb-2">
                <span className="bg-red-100 p-2 rounded-full"><DollarSign className="h-7 w-7 text-red-500" /></span>
                <CardTitle className="text-base font-semibold text-red-700">Tổng lương nhân viên</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-extrabold text-red-700">{totalStaffSalary.toLocaleString("vi-VN")} đ</div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
