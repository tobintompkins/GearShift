import { redirect } from 'next/navigation';

export default function HomePage() {
  // Redirect to login first, then middleware will handle the rest
  redirect('/login');
}



