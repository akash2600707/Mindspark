/**
 * Organizer console shell.
 *
 * Kept separate from the participant shell so the admin pages keep their
 * container width without carrying the MIND SPARK marketing header/footer.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-[min(1180px,calc(100%-2.5rem))]">{children}</div>;
}
