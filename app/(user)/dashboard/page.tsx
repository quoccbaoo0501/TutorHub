import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Users, BookOpen, CheckCircle, Award, BarChart3, Layers } from 'lucide-react';

export default function DashboardPage() {
  return (
    <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-background to-muted">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="space-y-4">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Hệ Thống Quản Lý Trung Tâm Gia Sư
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl">
                  Giải pháp toàn diện giúp kết nối gia sư với học viên, quản lý lớp học và tối ưu hóa hoạt động của
                  trung tâm gia sư.
                </p>
              </div>
              <div className="flex justify-center">
                <div className="relative w-full max-w-md aspect-video rounded-lg overflow-hidden border bg-background p-6 shadow-lg">
                  <div className="space-y-4">
                    <div className="h-2 w-1/2 rounded-full bg-primary/20"></div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="h-20 rounded-md bg-muted"></div>
                      <div className="h-20 rounded-md bg-muted"></div>
                      <div className="h-20 rounded-md bg-muted"></div>
                    </div>
                    <div className="h-2 w-3/4 rounded-full bg-primary/20"></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="h-32 rounded-md bg-muted"></div>
                      <div className="h-32 rounded-md bg-muted"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="w-full py-12 md:py-24 bg-background">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-primary px-3 py-1 text-sm text-primary-foreground">
                  Tính năng
                </div>
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">Tính năng chính</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Hệ thống được thiết kế với đầy đủ tính năng để đáp ứng nhu cầu của tất cả người dùng
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mt-8">
              <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
                <Users className="h-12 w-12 text-primary" />
                <h3 className="text-xl font-bold">Quản lý người dùng</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Phân quyền rõ ràng cho phụ huynh, gia sư, nhân viên và giám đốc
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
                <BookOpen className="h-12 w-12 text-primary" />
                <h3 className="text-xl font-bold">Quản lý lớp học</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Tạo lớp, duyệt gia sư, theo dõi tiến độ và quản lý lịch học
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
                <CheckCircle className="h-12 w-12 text-primary" />
                <h3 className="text-xl font-bold">Đăng ký & Duyệt lớp</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Gia sư đăng ký nhận lớp, nhân viên duyệt và phụ huynh chọn gia sư
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
                <Award className="h-12 w-12 text-primary" />
                <h3 className="text-xl font-bold">Quản lý hợp đồng</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Tạo và quản lý hợp đồng giữa trung tâm, gia sư và phụ huynh
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
                <BarChart3 className="h-12 w-12 text-primary" />
                <h3 className="text-xl font-bold">Báo cáo & Thống kê</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Thống kê doanh thu, khách hàng, gia sư và các báo cáo tài chính
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
                <Layers className="h-12 w-12 text-primary" />
                <h3 className="text-xl font-bold">Kiến trúc 3 tầng</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Thiết kế theo mô hình 3 tầng giúp dễ bảo trì và mở rộng
                </p>
              </div>
            </div>
          </div>
        </section>

      </main>
  );
}
