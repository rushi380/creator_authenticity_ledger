import type { VerificationStep } from '@/types';

interface VerificationStepsProps {
  currentStep: VerificationStep;
}

const STEPS: { id: VerificationStep; label: string; description: string }[] = [
  { id: 'preparing',        label: 'Preparing',          description: 'Building witness inputs' },
  { id: 'generating_proof', label: 'Generating ZK Proof', description: 'Local proof computation' },
  { id: 'executing_circuit',label: 'Executing Circuit',   description: 'Running Compact circuit' },
  { id: 'submitting',       label: 'Submitting',          description: 'Broadcasting to Midnight' },
  { id: 'confirmed',        label: 'Confirmed',           description: 'Transaction on-chain' },
  { id: 'verified',         label: 'Verified ✓',          description: 'Authenticity proven' },
];

function getStepStatus(stepId: VerificationStep, currentStep: VerificationStep): 'complete' | 'active' | 'upcoming' {
  const stepOrder: VerificationStep[] = ['idle', 'preparing', 'generating_proof', 'executing_circuit', 'submitting', 'confirmed', 'verified'];
  const currentIdx = stepOrder.indexOf(currentStep);
  const stepIdx    = stepOrder.indexOf(stepId);
  if (stepIdx < currentIdx)  return 'complete';
  if (stepIdx === currentIdx) return 'active';
  return 'upcoming';
}

export function VerificationSteps({ currentStep }: VerificationStepsProps) {
  if (currentStep === 'idle' || currentStep === 'failed') return null;

  return (
    <div className="relative">
      {/* Vertical connector line */}
      <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-800" aria-hidden />

      <div className="space-y-4">
        {STEPS.map(step => {
          const status = getStepStatus(step.id, currentStep);
          return (
            <div key={step.id} className="flex items-start gap-4 relative">
              {/* Step indicator */}
              <div className={`
                relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                border-2 transition-all duration-300
                ${status === 'complete'  ? 'bg-emerald-500 border-emerald-500' :
                  status === 'active'    ? 'bg-violet-600 border-violet-400 animate-pulse' :
                  'bg-gray-900 border-gray-700'}
              `}>
                {status === 'complete' ? (
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : status === 'active' ? (
                  <div className="w-2.5 h-2.5 rounded-full bg-white" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-gray-600" />
                )}
              </div>

              {/* Step text */}
              <div className="flex-1 pb-1">
                <p className={`text-sm font-semibold transition-colors ${
                  status === 'complete'  ? 'text-emerald-400' :
                  status === 'active'    ? 'text-violet-300' :
                  'text-gray-500'
                }`}>
                  {step.label}
                </p>
                <p className="text-xs text-gray-500">{step.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
