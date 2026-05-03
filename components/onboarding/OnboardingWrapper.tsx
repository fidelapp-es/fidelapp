'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import StepIndicator from './StepIndicator'
import Step1Business from './Step1Business'
import Step2Profile from './Step2Profile'
import Step3Branding from './Step3Branding'
import Step4Complete from './Step4Complete'
import LeftPanel from './LeftPanel'

interface Props {
  initialStep: number
  initialData: Record<string, any>
}

export default function OnboardingWrapper({ initialStep, initialData }: Props) {
  const router = useRouter()
  const [step, setStep] = useState(initialStep)
  const [saving, setSaving] = useState(false)
  const [data, setData] = useState(initialData)

  async function saveStep(stepData: Record<string, any>, nextStep: number) {
    setSaving(true)
    try {
      await fetch('/api/onboarding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...stepData, onboarding_step: nextStep }),
      })
      setData(prev => ({ ...prev, ...stepData }))
      if (nextStep > 4) {
        await fetch('/api/onboarding', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ onboarding_completed: true }),
        })
        router.push('/dashboard')
      } else {
        setStep(nextStep)
      }
    } finally {
      setSaving(false)
    }
  }

  function goBack() {
    setStep(s => Math.max(1, s - 1))
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#ECF0EF' }}>
      {/* Panel izquierdo — oculto en móvil */}
      <div className="hidden md:flex" style={{ width: '40%', minHeight: '100vh' }}>
        <LeftPanel step={step} />
      </div>

      {/* Panel derecho — formulario */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <div style={{ maxWidth: 560, margin: '0 auto', width: '100%', padding: '40px 24px 60px' }}>
          <StepIndicator currentStep={step} />
          <div style={{ marginTop: 32 }}>
            {step === 1 && <Step1Business data={data} onNext={d => saveStep(d, 2)} saving={saving} />}
            {step === 2 && <Step2Profile data={data} onNext={d => saveStep(d, 3)} onBack={goBack} saving={saving} />}
            {step === 3 && <Step3Branding data={data} onNext={d => saveStep(d, 4)} onBack={goBack} saving={saving} />}
            {step === 4 && <Step4Complete data={data} onFinish={() => saveStep({}, 5)} saving={saving} />}
          </div>
        </div>
      </div>
    </div>
  )
}
