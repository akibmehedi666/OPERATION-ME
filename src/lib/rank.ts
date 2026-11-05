import { AgentRank } from "@/types/database";

export interface RankTier {
  rank: AgentRank;
  minXp: number;
  maxXp: number | null; // null for highest rank
  clearanceLevel: string;
  badgeColor: string;
}

export const RANK_TIERS: RankTier[] = [
  {
    rank: 'Recruit',
    minXp: 0,
    maxXp: 250,
    clearanceLevel: 'LEVEL 1 - PROBATIONARY',
    badgeColor: '#94a3b8',
  },
  {
    rank: 'Field Agent',
    minXp: 250,
    maxXp: 1000,
    clearanceLevel: 'LEVEL 2 - ACTIVE OPERATIVE',
    badgeColor: '#00ff66',
  },
  {
    rank: 'Elite',
    minXp: 1000,
    maxXp: 2500,
    clearanceLevel: 'LEVEL 3 - BLACK OPS',
    badgeColor: '#ffb700',
  },
  {
    rank: 'Director',
    minXp: 2500,
    maxXp: null,
    clearanceLevel: 'LEVEL 5 - COMMAND CLEARED',
    badgeColor: '#ef4444',
  },
];

export function getRankFromXp(totalXp: number) {
  let tier = RANK_TIERS[0];
  for (const t of RANK_TIERS) {
    if (totalXp >= t.minXp) {
      tier = t;
    }
  }

  let progress = 100;
  let xpToNext = 0;

  if (tier.maxXp !== null) {
    const range = tier.maxXp - tier.minXp;
    const currentInTier = totalXp - tier.minXp;
    progress = Math.min(100, Math.max(0, Math.round((currentInTier / range) * 100)));
    xpToNext = Math.max(0, tier.maxXp - totalXp);
  }

  return {
    rank: tier.rank,
    clearanceLevel: tier.clearanceLevel,
    badgeColor: tier.badgeColor,
    totalXp,
    progress,
    xpToNext,
    currentTierMin: tier.minXp,
    nextTierTarget: tier.maxXp ?? tier.minXp,
  };
}

