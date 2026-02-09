'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get('email');

  useEffect(() => {
    // Redirect to new OTP verification page
    if (email) {
      router.push(`/auth/verify-otp?email=${encodeURIComponent(email)}`);
    } else {
      router.push('/auth/verify-otp');
    }
  }, [email, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b1220]">
      <div className="text-center text-white">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
        <p>Redirecting to verification page...</p>
      </div>
    </div>
  );
}
