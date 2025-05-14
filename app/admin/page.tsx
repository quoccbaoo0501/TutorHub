import { redirect } from 'next/navigation';

export default function UserRootPage() {
  redirect('/dashboards');

  return null;
}
