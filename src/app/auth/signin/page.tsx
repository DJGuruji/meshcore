import SignInClient from '@/components/SignInClient';
import { Suspense } from 'react';

export default function SignIn({ searchParams }: { searchParams: any }) {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#030712]">
        <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-4 text-sm text-slate-300 shadow-xl shadow-black/50">
          Loading…
        </div>
      </div>
    }>
      <SignInClient />
    </Suspense>
  );
}