'use client';

import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase-browser';
import AdminGuard from '@/components/AdminGuard';
import AdminNav from '@/components/AdminNav';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

function Participants() {
  const sb = supabaseBrowser();
  const [items, setItems] = useState<any[]>([]);

  async function load() {
    const { data: q } = await sb
      .from('quizzes')
      .select('id')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (q) {
      const { data } = await sb
        .from('participants')
        .select('challenge_id,participant_code,full_name,designation,club_name,email,status,created_at')
        .eq('quiz_id', q.id)
        .order('created_at', { ascending: true });
      setItems(data ?? []);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="pb-16">
      <AdminNav />
      <p className="eyebrow">Registration list</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">
        Participants <span className="text-muted-foreground font-normal">({items.length})</span>
      </h1>

      <Card className="mt-7">
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Challenge ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Club</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Registered</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((x) => (
                <TableRow key={x.participant_code}>
                  <TableCell className="font-semibold tracking-wider">{x.challenge_id}</TableCell>
                  <TableCell>{x.full_name}</TableCell>
                  <TableCell>{x.designation || '—'}</TableCell>
                  <TableCell>{x.club_name}</TableCell>
                  <TableCell>{x.email || '—'}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{x.status}</Badge>
                  </TableCell>
                  <TableCell>{new Date(x.created_at).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}

export default function Page() {
  return (
    <AdminGuard>
      <Participants />
    </AdminGuard>
  );
}
