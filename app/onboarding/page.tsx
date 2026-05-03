import { createAuthClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import OnboardingWrapper from '@/components/onboarding/OnboardingWrapper'

export default async function OnboardingPage() {
  const sb = await createAuthClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/login')

  const { data: settings } = await sb
    .from('settings').select('*').eq('id', user.id).maybeSingle()
  const step = settings?.onboarding_step || 1

  return <OnboardingWrapper initialStep={step} initialData={settings || {}} />
}
