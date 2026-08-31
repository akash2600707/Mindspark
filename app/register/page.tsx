import SiteShell from '@/components/SiteShell';
import RegistrationForm from '@/components/registration/RegistrationForm';

export const metadata = { title: 'Register · MIND SPARK' };

export default function RegisterPage() {
  return (
    <SiteShell>
      <main className="py-14 sm:py-20">
        <div className="mx-auto max-w-xl">
          <p className="eyebrow">Registration</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight uppercase sm:text-5xl">
            Join the challenge
          </h1>
          <p className="text-muted-foreground mt-4 mb-10">
            Register once. Your Challenge ID is generated instantly and the quiz begins when the
            host starts it.
          </p>
          <RegistrationForm />
        </div>
      </main>
    </SiteShell>
  );
}
