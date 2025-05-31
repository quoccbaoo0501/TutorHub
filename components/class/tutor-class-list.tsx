import type React from "react"
import { Card, CardContent } from "@/components/ui/card"

interface TutorClassListProps {
  tutorApplications: any[] // Replace 'any' with a more specific type if possible
}

const TutorClassList: React.FC<TutorClassListProps> = ({ tutorApplications }) => {
  console.log("TutorClassList applications:", tutorApplications)
  tutorApplications.forEach((app, index) => {
    console.log(`Application ${index}:`, app)
    console.log(`Classes data:`, app.classes)
  })

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {tutorApplications.map((application) => {
        if (!application.classes) {
          return (
            <Card key={application.id} className="w-full opacity-50">
              <CardContent className="p-6">
                <div className="text-center text-gray-500">
                  <p>Không thể tải thông tin lớp học</p>
                  <p className="text-sm">ID: {application.class_id}</p>
                </div>
              </CardContent>
            </Card>
          )
        }

        return (
          <Card key={application.id} className="w-full">
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Class Information */}
                <div>
                  <h2 className="text-lg font-semibold text-blue-600">{application.classes.name}</h2>
                  <p className="text-sm text-gray-600">Môn: {application.classes.subject}</p>
                  <p className="text-sm text-gray-600">Cấp độ: {application.classes.level}</p>
                </div>

                {/* Location */}
                <div>
                  <h3 className="font-medium text-gray-800">Địa điểm:</h3>
                  <p className="text-sm text-gray-600">{application.classes.address}</p>
                  <p className="text-sm text-gray-600">
                    {application.classes.district}, {application.classes.province}
                  </p>
                </div>

                {/* Schedule */}
                <div>
                  <h3 className="font-medium text-gray-800">Lịch học:</h3>
                  <p className="text-sm text-gray-600">{application.classes.schedule}</p>
                </div>

                {/* Created Date */}
                <div>
                  <h3 className="font-medium text-gray-800">Ngày tạo:</h3>
                  <p className="text-sm text-gray-600">
                    {new Date(application.classes.created_at).toLocaleDateString("vi-VN")}
                  </p>
                </div>

                {/* Customer Contact Information - Only show if status is "selected" */}
                {application.status === "selected" && (
                  <div className="border-t pt-3">
                    <h3 className="font-medium text-gray-800">Thông tin liên hệ khách hàng:</h3>
                    <p className="text-sm text-gray-600">Tên: {application.classes.customer_profiles?.full_name}</p>
                    <p className="text-sm text-gray-600">Email: {application.classes.customer_profiles?.email}</p>
                    <p className="text-sm text-gray-600">SĐT: {application.classes.customer_profiles?.phone_number}</p>
                  </div>
                )}

                {/* Application Status */}
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Trạng thái:</span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        application.status === "selected"
                          ? "bg-green-100 text-green-800"
                          : application.status === "approved"
                            ? "bg-blue-100 text-blue-800"
                            : application.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {application.status === "selected"
                        ? "Đã được chọn"
                        : application.status === "approved"
                          ? "Đã duyệt"
                          : application.status === "pending"
                            ? "Chờ duyệt"
                            : application.status}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

export default TutorClassList
