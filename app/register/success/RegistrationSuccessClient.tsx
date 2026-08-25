"use client";

import { useSearchParams } from "next/navigation";

export default function RegistrationSuccessClient() {
  const searchParams = useSearchParams();

  const code = searchParams.get("code");
  const name = searchParams.get("name");

  return (
    <main className="min-h-screen">
      {/* Keep your existing registration-success UI here */}
      <p>{name}</p>
      <p>{code}</p>
    </main>
  );
}
