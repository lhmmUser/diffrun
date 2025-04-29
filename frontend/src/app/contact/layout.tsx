import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact Us | Diffrun',
  description:
    'Get in touch with Diffrun. Have questions? We’re here to help with all your photo book needs.',
}

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}