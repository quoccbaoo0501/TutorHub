import { redirect } from 'next/navigation';

export default function UserRootPage() {
  redirect('/login');

  return null;
}
