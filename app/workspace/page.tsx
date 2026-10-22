'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import { useWorkspacePreferences } from '@/components/workspace/use-workspace-preferences';
import { workspacePath } from '@/lib/frontend/workspace-preferences';

export default function WorkspaceEntry() {
  const { snapshot } = useWorkspacePreferences();
  const router = useRouter();
  const plan = snapshot?.preferences.preferredPlan;
  useEffect(() => { if (plan) router.replace(workspacePath(plan)); }, [plan, router]);
  return <AuthLayout variant="application"><p role="status">Opening your workspace…</p></AuthLayout>;
}
