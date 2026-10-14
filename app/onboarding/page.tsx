'use client';

import { Suspense } from 'react';
import HomePortOnboarding, { OnboardingLoading } from '@/components/onboarding/HomePortOnboarding';

export default function OnboardingPage() {
  return <Suspense fallback={<OnboardingLoading />}><HomePortOnboarding /></Suspense>;
}
