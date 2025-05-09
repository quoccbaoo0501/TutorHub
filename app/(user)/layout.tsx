import '../../styles/global.css'; 

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
        <main>{children}</main>
      </body>
    </html>
  )
}
