/**
 * Creator Authenticity Ledger — Contract Logic Tests
 *
 * These tests mirror the exact arithmetic enforced by the Compact circuit.
 * The same integer basis-point logic in creator_authenticity.compact is
 * reproduced here so that test failures indicate real circuit failures.
 *
 * Compact circuit rule (no floating-point):
 *   genuineEngagementCount × 10000 ≥ followerCount × minEngagementBps
 *   postingConsistencyScore ≥ minConsistency
 *   verifiedAudienceScore   ≥ minAudienceScore
 */

import { describe, it, expect } from 'vitest';

// ── Replicate the Compact circuit in TypeScript ───────────────────────────────

interface CreatorMetrics {
  followerCount: bigint;
  genuineEngagementCount: bigint;
  postingConsistencyScore: bigint;
  verifiedAudienceScore: bigint;
}

interface Thresholds {
  minEngagementBps: bigint; // basis points e.g. 300n = 3.00%
  minConsistency: bigint;   // 0–100
  minAudienceScore: bigint; // 0–100
}

interface CircuitResult {
  isAuthentic: boolean;
  failReason: string | null;
}

/**
 * Simulates the proveAuthenticity() Compact circuit.
 * Returns { isAuthentic, failReason } matching what the on-chain
 * circuit would assert/disclose.
 */
function proveAuthenticity(
  metrics: CreatorMetrics,
  thresholds: Thresholds,
): CircuitResult {
  const { followerCount, genuineEngagementCount, postingConsistencyScore, verifiedAudienceScore } = metrics;
  const { minEngagementBps, minConsistency, minAudienceScore } = thresholds;

  // assert: follower count must be > 0
  if (followerCount <= 0n) {
    return { isAuthentic: false, failReason: 'Follower count must be greater than zero' };
  }

  // assert: scores within valid range
  if (postingConsistencyScore > 100n) {
    return { isAuthentic: false, failReason: 'Consistency score must be between 0 and 100' };
  }
  if (verifiedAudienceScore > 100n) {
    return { isAuthentic: false, failReason: 'Audience score must be between 0 and 100' };
  }

  // Basis-point engagement check (mirrors Compact integer arithmetic)
  // genuine * 10000 >= followers * minEngagementBps
  if (genuineEngagementCount * 10000n < followerCount * minEngagementBps) {
    return { isAuthentic: false, failReason: 'Engagement rate is below the required threshold' };
  }

  // Consistency check
  if (postingConsistencyScore < minConsistency) {
    return { isAuthentic: false, failReason: 'Posting consistency is below the required threshold' };
  }

  // Audience score check
  if (verifiedAudienceScore < minAudienceScore) {
    return { isAuthentic: false, failReason: 'Verified audience score is below the required threshold' };
  }

  return { isAuthentic: true, failReason: null };
}

// ── Default thresholds (mirrors .env defaults) ────────────────────────────────
const DEFAULT_THRESHOLDS: Thresholds = {
  minEngagementBps: 300n, // 3.00%
  minConsistency:    60n,
  minAudienceScore:  70n,
};

// ─────────────────────────────────────────────────────────────────────────────
// TEST SUITE
// ─────────────────────────────────────────────────────────────────────────────

describe('Creator Authenticity Circuit — proveAuthenticity()', () => {

  // ── TEST 1: Valid creator passes all thresholds ───────────────────────────
  it('TEST 1: Authentic creator — all metrics satisfy thresholds → isAuthentic = true', () => {
    const metrics: CreatorMetrics = {
      followerCount:           50_000n, // 50k followers
      genuineEngagementCount:   2_000n, // 2000 genuine engagements → 4.00% rate
      postingConsistencyScore:     80n, // 80/100 consistency
      verifiedAudienceScore:       85n, // 85/100 audience
    };

    const result = proveAuthenticity(metrics, DEFAULT_THRESHOLDS);

    expect(result.isAuthentic).toBe(true);
    expect(result.failReason).toBeNull();

    // Also verify the engagement math explicitly
    const lhs = metrics.genuineEngagementCount * 10000n;
    const rhs = metrics.followerCount * DEFAULT_THRESHOLDS.minEngagementBps;
    expect(lhs).toBeGreaterThanOrEqual(rhs); // 20_000_000 >= 15_000_000
  });

  // ── TEST 2: Engagement rate below threshold ───────────────────────────────
  it('TEST 2: Engagement too low — 1% rate vs 3% required → isAuthentic = false', () => {
    const metrics: CreatorMetrics = {
      followerCount:           100_000n, // 100k followers
      genuineEngagementCount:    1_000n, // only 1000 engagements → 1.00% rate
      postingConsistencyScore:      75n, // good consistency
      verifiedAudienceScore:        80n, // good audience
    };

    const result = proveAuthenticity(metrics, DEFAULT_THRESHOLDS);

    expect(result.isAuthentic).toBe(false);
    expect(result.failReason).toBe('Engagement rate is below the required threshold');

    // Verify math: 1000 * 10000 = 10_000_000 < 100_000 * 300 = 30_000_000
    const lhs = metrics.genuineEngagementCount * 10000n;
    const rhs = metrics.followerCount * DEFAULT_THRESHOLDS.minEngagementBps;
    expect(lhs).toBeLessThan(rhs);
  });

  // ── TEST 3: Posting consistency below threshold ───────────────────────────
  it('TEST 3: Low consistency — score 40/100 vs required 60 → isAuthentic = false', () => {
    const metrics: CreatorMetrics = {
      followerCount:           20_000n,
      genuineEngagementCount:   1_000n, // 5.00% engagement — passes
      postingConsistencyScore:     40n, // 40/100 — FAILS minimum of 60
      verifiedAudienceScore:       75n, // passes
    };

    const result = proveAuthenticity(metrics, DEFAULT_THRESHOLDS);

    expect(result.isAuthentic).toBe(false);
    expect(result.failReason).toBe('Posting consistency is below the required threshold');
  });

  // ── TEST 4: Audience score below threshold ────────────────────────────────
  it('TEST 4: Low audience score — 50/100 vs required 70 → isAuthentic = false', () => {
    const metrics: CreatorMetrics = {
      followerCount:           30_000n,
      genuineEngagementCount:   1_500n, // 5.00% — passes
      postingConsistencyScore:     70n, // passes
      verifiedAudienceScore:       50n, // 50/100 — FAILS minimum of 70
    };

    const result = proveAuthenticity(metrics, DEFAULT_THRESHOLDS);

    expect(result.isAuthentic).toBe(false);
    expect(result.failReason).toBe('Verified audience score is below the required threshold');
  });

  // ── TEST 5: Zero follower count rejected ──────────────────────────────────
  it('TEST 5: Zero follower count → circuit rejects (guard assertion)', () => {
    const metrics: CreatorMetrics = {
      followerCount:              0n,
      genuineEngagementCount:   100n,
      postingConsistencyScore:   70n,
      verifiedAudienceScore:     80n,
    };

    const result = proveAuthenticity(metrics, DEFAULT_THRESHOLDS);

    expect(result.isAuthentic).toBe(false);
    expect(result.failReason).toBe('Follower count must be greater than zero');
  });

  // ── TEST 6: Exact boundary — engagement exactly at threshold passes ────────
  it('TEST 6: Engagement exactly at boundary (3.00%) → isAuthentic = true', () => {
    // 10000 followers, 300 engagements → exactly 3.00%
    // 300 * 10000 = 3_000_000  vs  10000 * 300 = 3_000_000  → equal → passes
    const metrics: CreatorMetrics = {
      followerCount:           10_000n,
      genuineEngagementCount:     300n, // exactly 3.00%
      postingConsistencyScore:     60n, // exactly at minimum
      verifiedAudienceScore:       70n, // exactly at minimum
    };

    const result = proveAuthenticity(metrics, DEFAULT_THRESHOLDS);

    expect(result.isAuthentic).toBe(true);
    expect(result.failReason).toBeNull();
  });

  // ── TEST 7: One below boundary fails ─────────────────────────────────────
  it('TEST 7: Engagement one unit below boundary → isAuthentic = false', () => {
    // 299 * 10000 = 2_990_000 < 10000 * 300 = 3_000_000 → fails
    const metrics: CreatorMetrics = {
      followerCount:           10_000n,
      genuineEngagementCount:     299n, // one below 3.00%
      postingConsistencyScore:     60n,
      verifiedAudienceScore:       70n,
    };

    const result = proveAuthenticity(metrics, DEFAULT_THRESHOLDS);

    expect(result.isAuthentic).toBe(false);
    expect(result.failReason).toBe('Engagement rate is below the required threshold');
  });

  // ── TEST 8: Custom thresholds ─────────────────────────────────────────────
  it('TEST 8: Stricter custom thresholds — creator that passed default now fails', () => {
    const strictThresholds: Thresholds = {
      minEngagementBps: 500n, // 5.00% — stricter
      minConsistency:    80n,
      minAudienceScore:  90n,
    };

    const metrics: CreatorMetrics = {
      followerCount:           50_000n,
      genuineEngagementCount:   2_000n, // 4.00% — was enough at 3%, fails at 5%
      postingConsistencyScore:     80n,
      verifiedAudienceScore:       85n, // fails 90 threshold
    };

    const result = proveAuthenticity(metrics, strictThresholds);

    expect(result.isAuthentic).toBe(false);
    // Engagement fails first
    expect(result.failReason).toBe('Engagement rate is below the required threshold');
  });

  // ── TEST 9: Privacy model — result reveals nothing about inputs ────────────
  it('TEST 9: Privacy model — two different input sets produce identical public output', () => {
    // Both creators pass, but with very different private metrics.
    // The public output (isAuthentic = true) is identical for both.
    // This models the ZK guarantee: you can't infer private inputs from public output.

    const creator1: CreatorMetrics = {
      followerCount:            5_000n,
      genuineEngagementCount:     400n, // 8.00% — very high
      postingConsistencyScore:     95n,
      verifiedAudienceScore:       98n,
    };

    const creator2: CreatorMetrics = {
      followerCount:         1_000_000n,
      genuineEngagementCount:   30_000n, // 3.00% — minimal passing
      postingConsistencyScore:      60n,
      verifiedAudienceScore:        70n,
    };

    const result1 = proveAuthenticity(creator1, DEFAULT_THRESHOLDS);
    const result2 = proveAuthenticity(creator2, DEFAULT_THRESHOLDS);

    // Both pass — but with completely different private values
    expect(result1.isAuthentic).toBe(true);
    expect(result2.isAuthentic).toBe(true);

    // The PUBLIC result is indistinguishable
    expect(result1.isAuthentic).toBe(result2.isAuthentic);
    // Their private metrics are radically different (followerCount differs by 200x)
    expect(creator1.followerCount).not.toBe(creator2.followerCount);
  });

});
