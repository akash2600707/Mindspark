import { Suspense } from "react";
import RegistrationSuccessClient from "./RegistrationSuccessClient";

function Loading() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div>Loading...</div>
    </main>
  );
}

export default function RegistrationSuccessPage() {
  return (
    <Suspense fallback={<Loading />}>
      <RegistrationSuccessClient />
    </Suspense>
  );
}
