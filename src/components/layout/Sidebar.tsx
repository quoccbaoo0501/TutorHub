import Link from 'next/link';

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/profile', label: 'Hồ sơ' }, 
  { href: '/dashboard/quanli1', label: 'Quản lí 1' }, 
  { href: '/dashboard/quanli2', label: 'Quản lí 2' }, 
  { href: '/dashboard/quanli3', label: 'Quản lí 3' }, 
  { href: '/dashboard/quanli4', label: 'Quản lí 4' }, 
];

const Sidebar = () => {
  return (
    <aside className="w-64 bg-gray-100 dark:bg-gray-800 p-4 space-y-2 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      <div className="mb-4 pb-2 border-b border-gray-300 dark:border-gray-600">
        <Link href="/" className="text-2xl font-bold text-gray-800 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
          Trung Tâm Gia Sư
        </Link>
      </div>
      <nav className="flex-grow">
        <ul>
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="block w-full text-left px-3 py-2.5 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="mt-auto pt-4 border-t border-gray-300 dark:border-gray-600">
        <p className="text-xs text-center text-gray-500 dark:text-gray-400">
          © {new Date().getFullYear()} TutorHub
        </p>
      </div>
    </aside>
  );
};

export default Sidebar; 