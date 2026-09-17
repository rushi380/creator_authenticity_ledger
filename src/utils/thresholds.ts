/**
 * thresholds.ts
 *
 * Pure TypeScript mirror of the arithmetic enforced by the Compact circuit
 * (contracts/creator_authenticity.compact → proveAuthenticity).
 *
 * This is ONLY a client-side convenience: it powers the live pass/fail preview
 * before a creator spends a transaction. The authoritative result always comes
 * from the ZK circuit executed against the deployed Midnight contract.
 */

export interface ThresholdCheck {
  passed: boolean;
  failReason: string | null;
}

export function evaluateThresholds(
  followerCount: number | bigint,
  genuineEngagementCount: number | bigint,
  postingConsistencyScore: number | bigint,
  verifiedAudienceScore: number | bigint,
  minEngagementBps: number | bigint,
  minConsistency: number | bigint,
  minAudienceScore: number | bigint,
): ThresholdCheck {
  const followers = BigInt(followerCount);
  const genuine = BigInt(genuineEngagementCount);
  const consistency = BigInt(postingConsistencyScore);
  const audience = BigInt(verifiedAudienceScore);
  const minBps = BigInt(minEngagementBps);
  const minCons = BigInt(minConsistency);
  const minAud = BigInt(minAudienceScore);

  // Mirrors Compact: assert(followers > 0)
  if (followers <= 0n) {
    return { passed: false, failReason: 'Follower count must be greater than zero' };
  }

  // Mirrors Compact: assert(consistency <= 100), assert(audience <= 100)
  if (consistency > 100n || audience > 100n) {
    return { passed: false, failReason: 'Score values must be between 0 and 100' };
  }

  // Mirrors Compact: genuine * 10000 >= followers * minEngagementBps
  if (genuine * 10000n < followers * minBps) {
    return { passed: false, failReason: 'Engagement rate is below the required threshold' };
  }

  // Mirrors Compact: consistency >= minConsistency
  if (consistency < minCons) {
    return { passed: false, failReason: 'Posting consistency is below the required threshold' };
  }

  // Mirrors Compact: audience >= minAudienceScore
  if (audience < minAud) {
    return { passed: false, failReason: 'Verified audience score is below the required threshold' };
  }

  return { passed: true, failReason: null };
}
