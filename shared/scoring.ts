import {
  VolleyballScoring,
  BasketballScoring,
  SoccerScoring,
  BaseballScoring,
  WrestlingScoring,
  TrackScoring,
  CrossCountryScoring,
  TennisScoring,
  GolfScoring,
} from './schema';

// Base interface for scoring calculation results
export interface ScoringResult {
  homeTotal: number;
  awayTotal: number;
  winnerTeamId: number | null; // null for ties
  decidedBy: string;
}

// Sport-specific calculation functions

/**
 * Volleyball scoring calculation
 * Best-of-3 or best-of-5 sets logic - count sets won by each team
 */
export function calculateVolleyballScore(
  details: VolleyballScoring,
  homeTeamId: number,
  awayTeamId: number
): ScoringResult {
  const setsWonHome = details.setsWonHome;
  const setsWonAway = details.setsWonAway;
  
  // Winner is determined by sets won
  let winnerTeamId: number | null = null;
  if (details.matchWinner === 'home') {
    winnerTeamId = homeTeamId;
  } else if (details.matchWinner === 'away') {
    winnerTeamId = awayTeamId;
  }

  return {
    homeTotal: setsWonHome,
    awayTotal: setsWonAway,
    winnerTeamId,
    decidedBy: 'regulation', // Volleyball doesn't have overtime
  };
}

/**
 * Basketball scoring calculation
 * Aggregate scoring with optional overtime periods - sum all periods
 */
export function calculateBasketballScore(
  details: BasketballScoring,
  homeTeamId: number,
  awayTeamId: number
): ScoringResult {
  const homeTotal = details.totalHomeScore;
  const awayTotal = details.totalAwayScore;
  
  let winnerTeamId: number | null = null;
  if (details.winner === 'home') {
    winnerTeamId = homeTeamId;
  } else if (details.winner === 'away') {
    winnerTeamId = awayTeamId;
  }

  return {
    homeTotal,
    awayTotal,
    winnerTeamId,
    decidedBy: details.decidedBy,
  };
}

/**
 * Soccer scoring calculation
 * Regulation + optional extra time + penalty kicks
 */
export function calculateSoccerScore(
  details: SoccerScoring,
  homeTeamId: number,
  awayTeamId: number
): ScoringResult {
  const homeTotal = details.totalHomeScore;
  const awayTotal = details.totalAwayScore;
  
  let winnerTeamId: number | null = null;
  if (details.winner === 'home') {
    winnerTeamId = homeTeamId;
  } else if (details.winner === 'away') {
    winnerTeamId = awayTeamId;
  }
  // Soccer can end in ties, so winnerTeamId remains null

  return {
    homeTotal,
    awayTotal,
    winnerTeamId,
    decidedBy: details.decidedBy,
  };
}

/**
 * Baseball/Softball scoring calculation
 * Inning-by-inning scoring - sum all innings for final score
 */
export function calculateBaseballScore(
  details: BaseballScoring,
  homeTeamId: number,
  awayTeamId: number
): ScoringResult {
  const homeTotal = details.totalHomeScore;
  const awayTotal = details.totalAwayScore;
  
  let winnerTeamId: number | null = null;
  if (details.winner === 'home') {
    winnerTeamId = homeTeamId;
  } else if (details.winner === 'away') {
    winnerTeamId = awayTeamId;
  }

  return {
    homeTotal,
    awayTotal,
    winnerTeamId,
    decidedBy: details.decidedBy,
  };
}

/**
 * Wrestling scoring calculation
 * Dual meet format with individual match scoring
 */
export function calculateWrestlingScore(
  details: WrestlingScoring,
  homeTeamId: number,
  awayTeamId: number
): ScoringResult {
  const homeTotal = details.totalHomeTeamPoints;
  const awayTotal = details.totalAwayTeamPoints;
  
  let winnerTeamId: number | null = null;
  if (details.winner === 'home') {
    winnerTeamId = homeTeamId;
  } else if (details.winner === 'away') {
    winnerTeamId = awayTeamId;
  }
  // Wrestling can end in ties

  return {
    homeTotal,
    awayTotal,
    winnerTeamId,
    decidedBy: 'regulation', // Wrestling matches are decided in regulation
  };
}

/**
 * Track & Field scoring calculation
 * Event-based team scoring with point totals
 */
export function calculateTrackScore(
  details: TrackScoring,
  homeTeamId: number,
  awayTeamId: number
): ScoringResult {
  const homeTotal = details.totalHomePoints;
  const awayTotal = details.totalAwayPoints;
  
  let winnerTeamId: number | null = null;
  if (details.winner === 'home') {
    winnerTeamId = homeTeamId;
  } else if (details.winner === 'away') {
    winnerTeamId = awayTeamId;
  }
  // Track can end in ties

  return {
    homeTotal,
    awayTotal,
    winnerTeamId,
    decidedBy: 'regulation',
  };
}

/**
 * Cross Country scoring calculation
 * Runner placement scoring (lower score wins)
 */
export function calculateCrossCountryScore(
  details: CrossCountryScoring,
  homeTeamId: number,
  awayTeamId: number
): ScoringResult {
  const homeTotal = details.homeTeamScore;
  const awayTotal = details.awayTeamScore;
  
  let winnerTeamId: number | null = null;
  if (details.winner === 'home') {
    winnerTeamId = homeTeamId;
  } else if (details.winner === 'away') {
    winnerTeamId = awayTeamId;
  }

  return {
    homeTotal,
    awayTotal,
    winnerTeamId,
    decidedBy: 'regulation',
  };
}

/**
 * Tennis scoring calculation
 * Singles/doubles match scoring
 */
export function calculateTennisScore(
  details: TennisScoring,
  homeTeamId: number,
  awayTeamId: number
): ScoringResult {
  const homeTotal = details.homeMatchesWon;
  const awayTotal = details.awayMatchesWon;
  
  let winnerTeamId: number | null = null;
  if (details.winner === 'home') {
    winnerTeamId = homeTeamId;
  } else if (details.winner === 'away') {
    winnerTeamId = awayTeamId;
  }
  // Tennis can end in ties

  return {
    homeTotal,
    awayTotal,
    winnerTeamId,
    decidedBy: 'regulation',
  };
}

/**
 * Golf scoring calculation
 * Stroke play team scoring (lower score wins)
 */
export function calculateGolfScore(
  details: GolfScoring,
  homeTeamId: number,
  awayTeamId: number
): ScoringResult {
  const homeTotal = details.homeTeamTotal;
  const awayTotal = details.awayTeamTotal;
  
  let winnerTeamId: number | null = null;
  if (details.winner === 'home') {
    winnerTeamId = homeTeamId;
  } else if (details.winner === 'away') {
    winnerTeamId = awayTeamId;
  }

  return {
    homeTotal,
    awayTotal,
    winnerTeamId,
    decidedBy: 'regulation',
  };
}

// Mapping of scoring types to calculation functions
const scoringCalculators = {
  set_match: calculateVolleyballScore,
  aggregate_with_periods: calculateBasketballScore,
  aggregate_with_tiebreaker: calculateSoccerScore,
  inning_line: calculateBaseballScore,
  dual_meet: calculateWrestlingScore,
  team_points: calculateTrackScore,
  runner_places: calculateCrossCountryScore,
  match_play: calculateTennisScore,
  stroke_play: calculateGolfScore,
} as const;

// Type for scoring calculation details
type ScoringDetails = 
  | VolleyballScoring
  | BasketballScoring
  | SoccerScoring
  | BaseballScoring
  | WrestlingScoring
  | TrackScoring
  | CrossCountryScoring
  | TennisScoring
  | GolfScoring;

/**
 * Main function to compute scoring summary
 * Takes scoring details and type, returns calculated results
 */
export function computeSummary(
  details: ScoringDetails,
  scoringType: keyof typeof scoringCalculators,
  homeTeamId: number,
  awayTeamId: number
): ScoringResult {
  const calculator = scoringCalculators[scoringType];
  
  if (!calculator) {
    throw new Error(`Unknown scoring type: ${scoringType}`);
  }

  // Type assertion needed due to union type complexity
  return calculator(details as any, homeTeamId, awayTeamId);
}

// Helper functions for specific scoring validations

/**
 * Validates volleyball scoring details
 */
export function validateVolleyballScoring(details: VolleyballScoring): string[] {
  const errors: string[] = [];
  
  // Check that sets won matches set details
  const calculatedHomeSets = details.sets.filter(set => set.winnerTeam === 'home').length;
  const calculatedAwaySets = details.sets.filter(set => set.winnerTeam === 'away').length;
  
  if (calculatedHomeSets !== details.setsWonHome) {
    errors.push(`Home sets won (${details.setsWonHome}) doesn't match set details (${calculatedHomeSets})`);
  }
  
  if (calculatedAwaySets !== details.setsWonAway) {
    errors.push(`Away sets won (${details.setsWonAway}) doesn't match set details (${calculatedAwaySets})`);
  }
  
  // Validate best-of logic
  const totalSets = details.setsWonHome + details.setsWonAway;
  const bestOf = parseInt(details.bestOf);
  const maxSetsNeeded = Math.ceil(bestOf / 2);
  
  if (details.setsWonHome < maxSetsNeeded && details.setsWonAway < maxSetsNeeded) {
    errors.push(`Match incomplete - need ${maxSetsNeeded} sets to win best of ${bestOf}`);
  }
  
  return errors;
}

/**
 * Validates basketball scoring details
 */
export function validateBasketballScoring(details: BasketballScoring): string[] {
  const errors: string[] = [];
  
  // Calculate totals from quarters
  const homeQuarterTotal = details.quarters.reduce((sum, quarter) => sum + quarter.homeScore, 0);
  const awayQuarterTotal = details.quarters.reduce((sum, quarter) => sum + quarter.awayScore, 0);
  
  let homeOvertimeTotal = 0;
  let awayOvertimeTotal = 0;
  
  if (details.overtimePeriods) {
    homeOvertimeTotal = details.overtimePeriods.reduce((sum, ot) => sum + ot.homeScore, 0);
    awayOvertimeTotal = details.overtimePeriods.reduce((sum, ot) => sum + ot.awayScore, 0);
  }
  
  const expectedHomeTotal = homeQuarterTotal + homeOvertimeTotal;
  const expectedAwayTotal = awayQuarterTotal + awayOvertimeTotal;
  
  if (expectedHomeTotal !== details.totalHomeScore) {
    errors.push(`Home total (${details.totalHomeScore}) doesn't match period breakdown (${expectedHomeTotal})`);
  }
  
  if (expectedAwayTotal !== details.totalAwayScore) {
    errors.push(`Away total (${details.totalAwayScore}) doesn't match period breakdown (${expectedAwayTotal})`);
  }
  
  // Check overtime logic
  if (details.decidedBy === 'overtime' && !details.overtimePeriods?.length) {
    errors.push('Game marked as decided by overtime but no overtime periods provided');
  }
  
  if (details.decidedBy === 'regulation' && homeQuarterTotal === awayQuarterTotal) {
    errors.push('Game marked as decided in regulation but regulation ended in tie');
  }
  
  return errors;
}

/**
 * Validates cross country scoring details
 */
export function validateCrossCountryScoring(details: CrossCountryScoring): string[] {
  const errors: string[] = [];
  
  // Validate scoring runners
  const homeRunners = details.runners.filter(r => r.school === 'home' && r.points !== undefined);
  const awayRunners = details.runners.filter(r => r.school === 'away' && r.points !== undefined);
  
  if (homeRunners.length < 5) {
    errors.push(`Home team needs 5 scoring runners, has ${homeRunners.length}`);
  }
  
  if (awayRunners.length < 5) {
    errors.push(`Away team needs 5 scoring runners, has ${awayRunners.length}`);
  }
  
  // Validate team scores
  const homeScore = homeRunners.slice(0, 5).reduce((sum, r) => sum + (r.points || 0), 0);
  const awayScore = awayRunners.slice(0, 5).reduce((sum, r) => sum + (r.points || 0), 0);
  
  if (homeScore !== details.homeTeamScore) {
    errors.push(`Home team score (${details.homeTeamScore}) doesn't match calculated score (${homeScore})`);
  }
  
  if (awayScore !== details.awayTeamScore) {
    errors.push(`Away team score (${details.awayTeamScore}) doesn't match calculated score (${awayScore})`);
  }
  
  return errors;
}

/**
 * Generic scoring validation dispatcher
 */
export function validateScoringDetails(
  details: ScoringDetails,
  scoringType: keyof typeof scoringCalculators
): string[] {
  switch (scoringType) {
    case 'set_match':
      return validateVolleyballScoring(details as VolleyballScoring);
    case 'aggregate_with_periods':
      return validateBasketballScoring(details as BasketballScoring);
    case 'runner_places':
      return validateCrossCountryScoring(details as CrossCountryScoring);
    default:
      return []; // No specific validation for other sports yet
  }
}

// Export all scoring types for convenience
export const SCORING_TYPES = Object.keys(scoringCalculators) as Array<keyof typeof scoringCalculators>;

// Export sport names mapping
export const SPORT_NAMES = {
  set_match: 'Volleyball',
  aggregate_with_periods: 'Basketball',
  aggregate_with_tiebreaker: 'Soccer',
  inning_line: 'Baseball',
  dual_meet: 'Wrestling',
  team_points: 'Track & Field',
  runner_places: 'Cross Country',
  match_play: 'Tennis',
  stroke_play: 'Golf',
} as const;