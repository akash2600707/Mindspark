import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'International Service Quiz | Rotaract Club of Madras Millenia',
  description: 'A live international knowledge quiz by Rotaract Club of Madras Millenia.'
};

export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="en"><body><div className="container"><nav className="nav"><Link href="/" className="brand">INTERNATIONAL SERVICE QUIZ<small>Rotaract Club of Madras Millenia</small></Link><div className="navlinks"><Link href="/rules">Rules</Link><Link href="/register">Register</Link><Link href="/join">Join</Link></div></nav>{children}<footer className="footer">© {new Date().getFullYear()} Rotaract Club of Madras Millenia · International Service</footer></div></body></html>
}
