'use client';

import dynamic from 'next/dynamic';

const SetupForm = dynamic(() => import('@/components/SetupForm'), { ssr: false });

export default function HomePage() {
  return <SetupForm />;
}
