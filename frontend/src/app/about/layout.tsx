import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About us | Diffrun',
  description: 'Learn more about Diffrun — our mission, values, and what drives us to create meaningful photo books.',
}

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}