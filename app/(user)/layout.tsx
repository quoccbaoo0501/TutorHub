import '../../styles/global.css'; // Hoặc đường dẫn chính xác tới global.css

export const metadata = {
  title: 'User Dashboard | TutorHub',
  description: 'User layout for TutorHub',
}

export default function UserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi">
      <body>
        {/* Ví dụ: <Topbar /> */}
        <main>{children}</main>
        {/* Ví dụ: <Footer /> */}
      </body>
    </html>
  )
}
