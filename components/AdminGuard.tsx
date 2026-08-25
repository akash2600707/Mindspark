'use client';
import {useEffect,useState} from 'react';import {useRouter} from 'next/navigation';import {supabaseBrowser} from '@/lib/supabase-browser';
export default function AdminGuard({children}:{children:React.ReactNode}){const [ready,setReady]=useState(false);const r=useRouter();useEffect(()=>{supabaseBrowser().auth.getSession().then(({data})=>{if(!data.session)r.replace('/admin/login');else setReady(true)})},[r]);if(!ready)return <main className="section"><div className="card center">Checking admin session…</div></main>;return <>{children}</>}
