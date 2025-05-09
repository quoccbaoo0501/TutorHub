import '../../styles/global.css'; 

export const metadata = {
  title: 'Admin Dashboard | TutorHub',
  description: 'Admin layout for TutorHub',
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi">
      <body>
        {/* Ví dụ: <Sidebar /> */}
        <main>{children}</main>
        {/* Ví dụ: <Footer /> */}
      </body>
    </html>
  )
}
