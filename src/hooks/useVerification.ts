import { useState, useCallback } from 'react';
import type { CreatorPrivateMetrics, VerificationState, VerificationStep } from '@/types';
import { proveCreatorAuthenticity } from '@/utils/contract';
import { getEnvironment } from '@/utils/environment';

const INITIAL_STATE: VerificationState = {
  step: 'idle',
  txHash: null,
  contractAddress: null,
  error: null,
  timestamp: null,
};

export function useVerification() {
  const [verificationState, setVerificationState] = useState<VerificationState>(INITIAL_STATE);

  const prove = useCallback(async (metrics: CreatorPrivateMetrics) => {
    const env = getEnvironment();
    const { thresholds } = env;

    setVerificationState(prev => ({ ...prev, step: 'preparing', error: null }));

    const result = await proveCreatorAuthenticity(
      metrics,
      thresholds.minEngagementBps,
      thresholds.minConsistency,
      thresholds.minAudienceScore,
      (step: string) => {
        setVerificationState(prev => ({
          ...prev,
          step: step as VerificationStep,
        }));
      }
    );

    setVerificationState(result.verificationState);
    return result;
  }, []);

  const reset = useCallback(() => {
    setVerificationState(INITIAL_STATE);
  }, []);

  return {
    verificationState,
    prove,
    reset,
    isIdle: verificationState.step === 'idle',
    isProcessing: !['idle', 'verified', 'failed'].includes(verificationState.step),
    isVerified: verificationState.step === 'verified',
    isFailed: verificationState.step === 'failed',
  };
}
