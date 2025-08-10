import { redirect } from 'next/navigation'

export default function RootPage() {
  // This page should never be reached due to middleware redirect
  // But if it is, redirect to /ja as a fallback
  redirect('/ja')
}