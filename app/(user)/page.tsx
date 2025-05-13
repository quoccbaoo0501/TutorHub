import { redirect } from 'next/navigation';

export default function UserRootPage() {
  redirect('/dashboard');

  return null;
}
