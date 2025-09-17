import { SCORING_TYPES, SPORT_NAMES } from './scoring';

// Sport configuration profile interface
export interface SportProfile {
  sport: string;
  scoringType: keyof typeof SPORT_NAMES;
  displayName: string;
  scoreDisplayType: 'standard' | 'sets' | 'sets_games' | 'strokes' | 'time_place' | 'points';
  allowsTies: boolean;
  hasOvertimeVariants: boolean;
  minScore: number;
  maxScore?: number;
  scoreUnits?: string;
  periods?: {
    name: string;
    count: number;
    required: boolean;
  }[];
  tiebreakers?: {
    name: string;
    type: 'periods' | 'special_scoring' | 'individual_performance';
  }[];
  validationRules: {
    minWinCondition?: string;
    scoringConstraints?: string[];
    specialRules?: string[];
  };
  uiConfiguration: {
    inputType: 'period_by_period' | 'set_by_set' | 'match_by_match' | 'event_by_event' | 'total_only';
    quickEntryAvailable: boolean;
    defaultView: 'simple' | 'detailed' | 'advanced';
    requiredFields: string[];
    optionalFields: string[];
  };
}

// Sport-specific profiles
export const SPORT_PROFILES: Record<string, SportProfile> = {
  volleyball: {
    sport: 'volleyball',
    scoringType: 'set_match',
    displayName: 'Volleyball',
    scoreDisplayType: 'sets',
    allowsTies: false,
    hasOvertimeVariants: false,
    minScore: 0,
    maxScore: 5, // Max sets in a match
    scoreUnits: 'sets',
    periods: [
      { name: 'Set', count: 5, required: false }
    ],
    validationRules: {
      minWinCondition: 'Must win majority of sets (2 of 3, or 3 of 5)',
      scoringConstraints: [
        'Each set must be won by 2 points with minimum of 25 (15 for set 5)',
        'Match ends when one team wins majority of sets'
      ],
      specialRules: [
        'Rally scoring - point awarded on every rally',
        'Sets played to 25 points (15 for deciding set)',
        'Must win by 2 points'
      ]
    },
    uiConfiguration: {
      inputType: 'set_by_set',
      quickEntryAvailable: true,
      defaultView: 'simple',
      requiredFields: ['bestOf', 'sets', 'setsWonHome', 'setsWonAway', 'matchWinner'],
      optionalFields: []
    }
  },

  basketball: {
    sport: 'basketball',
    scoringType: 'aggregate_with_periods',
    displayName: 'Basketball',
    scoreDisplayType: 'standard',
    allowsTies: false,
    hasOvertimeVariants: true,
    minScore: 0,
    scoreUnits: 'points',
    periods: [
      { name: 'Quarter', count: 4, required: true },
      { name: 'Overtime', count: 10, required: false }
    ],
    tiebreakers: [
      { name: 'Overtime', type: 'periods' }
    ],
    validationRules: {
      minWinCondition: 'Must outscore opponent at end of regulation or overtime',
      scoringConstraints: [
        '4 quarters of regulation play',
        'Overtime periods as needed until winner determined'
      ],
      specialRules: [
        'Game cannot end in a tie',
        'Multiple overtime periods allowed'
      ]
    },
    uiConfiguration: {
      inputType: 'period_by_period',
      quickEntryAvailable: true,
      defaultView: 'simple',
      requiredFields: ['quarters', 'totalHomeScore', 'totalAwayScore', 'winner', 'decidedBy'],
      optionalFields: ['overtimePeriods']
    }
  },

  soccer: {
    sport: 'soccer',
    scoringType: 'aggregate_with_tiebreaker',
    displayName: 'Soccer',
    scoreDisplayType: 'standard',
    allowsTies: true,
    hasOvertimeVariants: true,
    minScore: 0,
    scoreUnits: 'goals',
    periods: [
      { name: 'Half', count: 2, required: true },
      { name: 'Extra Time', count: 2, required: false }
    ],
    tiebreakers: [
      { name: 'Extra Time', type: 'periods' },
      { name: 'Penalty Kicks', type: 'special_scoring' }
    ],
    validationRules: {
      minWinCondition: 'Regulation allows ties, tournament play may require tiebreakers',
      scoringConstraints: [
        '90 minutes regulation (2 x 45 minute halves)',
        '30 minutes extra time if needed (2 x 15 minute periods)',
        'Penalty kicks if still tied'
      ],
      specialRules: [
        'Regular season games can end in ties',
        'Tournament/playoff games use extra time and penalty kicks'
      ]
    },
    uiConfiguration: {
      inputType: 'period_by_period',
      quickEntryAvailable: true,
      defaultView: 'simple',
      requiredFields: ['regulation', 'totalHomeScore', 'totalAwayScore', 'winner', 'decidedBy'],
      optionalFields: ['extraTime', 'penaltyKicks']
    }
  },

  football: {
    sport: 'football',
    scoringType: 'aggregate_with_tiebreaker',
    displayName: 'American Football',
    scoreDisplayType: 'standard',
    allowsTies: true,
    hasOvertimeVariants: true,
    minScore: 0,
    scoreUnits: 'points',
    periods: [
      { name: 'Quarter', count: 4, required: true },
      { name: 'Overtime', count: 10, required: false }
    ],
    tiebreakers: [
      { name: 'Overtime', type: 'periods' }
    ],
    validationRules: {
      minWinCondition: 'Regular season allows ties after one overtime, playoffs continue until winner',
      scoringConstraints: [
        '4 quarters of 12 minutes each (varsity) or 8 minutes (JV)',
        'One overtime period in regular season',
        'Multiple overtimes in playoffs'
      ],
      specialRules: [
        'High school regular season can end in ties',
        'Playoff games continue until winner determined'
      ]
    },
    uiConfiguration: {
      inputType: 'period_by_period',
      quickEntryAvailable: true,
      defaultView: 'simple',
      requiredFields: ['regulation', 'totalHomeScore', 'totalAwayScore', 'winner', 'decidedBy'],
      optionalFields: ['extraTime']
    }
  },

  baseball: {
    sport: 'baseball',
    scoringType: 'inning_line',
    displayName: 'Baseball',
    scoreDisplayType: 'standard',
    allowsTies: false,
    hasOvertimeVariants: true,
    minScore: 0,
    scoreUnits: 'runs',
    periods: [
      { name: 'Inning', count: 9, required: false },
      { name: 'Extra Inning', count: 20, required: false }
    ],
    tiebreakers: [
      { name: 'Extra Innings', type: 'periods' }
    ],
    validationRules: {
      minWinCondition: 'Must complete at least 7 innings, games continue until winner determined',
      scoringConstraints: [
        'Minimum 7 innings (4.5 if home team ahead)',
        'Extra innings until winner determined',
        'Home team bats last unless ahead after top of inning'
      ],
      specialRules: [
        'Game cannot end in a tie',
        'Home team may not bat in bottom of final inning if ahead',
        'Weather/darkness can suspend games'
      ]
    },
    uiConfiguration: {
      inputType: 'period_by_period',
      quickEntryAvailable: false,
      defaultView: 'detailed',
      requiredFields: ['innings', 'totalHomeScore', 'totalAwayScore', 'winner', 'decidedBy'],
      optionalFields: ['extraInnings', 'homeHits', 'awayHits', 'homeErrors', 'awayErrors']
    }
  },

  softball: {
    sport: 'softball',
    scoringType: 'inning_line',
    displayName: 'Softball',
    scoreDisplayType: 'standard',
    allowsTies: false,
    hasOvertimeVariants: true,
    minScore: 0,
    scoreUnits: 'runs',
    periods: [
      { name: 'Inning', count: 7, required: false },
      { name: 'Extra Inning', count: 15, required: false }
    ],
    tiebreakers: [
      { name: 'Extra Innings', type: 'periods' }
    ],
    validationRules: {
      minWinCondition: 'Must complete at least 5 innings, games continue until winner determined',
      scoringConstraints: [
        'Regulation 7 innings (4.5 if home team ahead)',
        'Extra innings until winner determined',
        'Mercy rules may apply (run differential)'
      ],
      specialRules: [
        'Game cannot end in a tie',
        'International tiebreaker rule may apply in extra innings',
        'Mercy rules common in high school softball'
      ]
    },
    uiConfiguration: {
      inputType: 'period_by_period',
      quickEntryAvailable: false,
      defaultView: 'detailed',
      requiredFields: ['innings', 'totalHomeScore', 'totalAwayScore', 'winner', 'decidedBy'],
      optionalFields: ['extraInnings', 'homeHits', 'awayHits', 'homeErrors', 'awayErrors']
    }
  },

  wrestling: {
    sport: 'wrestling',
    scoringType: 'dual_meet',
    displayName: 'Wrestling',
    scoreDisplayType: 'standard',
    allowsTies: true,
    hasOvertimeVariants: false,
    minScore: 0,
    scoreUnits: 'team points',
    validationRules: {
      minWinCondition: 'Team with most points wins dual meet',
      scoringConstraints: [
        'Individual matches award team points (6 for pin, 3 for decision, etc.)',
        'Forfeits award 6 team points',
        'Weight classes determined by governing body'
      ],
      specialRules: [
        'Individual matches have their own scoring/timing',
        'Team score is sum of individual match points',
        'Ties possible if equal team points earned'
      ]
    },
    uiConfiguration: {
      inputType: 'match_by_match',
      quickEntryAvailable: false,
      defaultView: 'detailed',
      requiredFields: ['matches', 'totalHomeTeamPoints', 'totalAwayTeamPoints', 'winner'],
      optionalFields: []
    }
  },

  track: {
    sport: 'track',
    scoringType: 'team_points',
    displayName: 'Track & Field',
    scoreDisplayType: 'points',
    allowsTies: true,
    hasOvertimeVariants: false,
    minScore: 0,
    scoreUnits: 'points',
    validationRules: {
      minWinCondition: 'Team with most points wins meet',
      scoringConstraints: [
        'Points awarded by place finish in each event',
        'Common scoring: 10-8-6-4-2-1 for places 1-6',
        'Relay events may have different point values'
      ],
      specialRules: [
        'Individual events and relays contribute to team score',
        'Field events and running events scored together',
        'Ties broken by number of first place finishes'
      ]
    },
    uiConfiguration: {
      inputType: 'event_by_event',
      quickEntryAvailable: false,
      defaultView: 'detailed',
      requiredFields: ['eventResults', 'totalHomePoints', 'totalAwayPoints', 'winner'],
      optionalFields: []
    }
  },

  cross_country: {
    sport: 'cross_country',
    scoringType: 'runner_places',
    displayName: 'Cross Country',
    scoreDisplayType: 'time_place',
    allowsTies: false,
    hasOvertimeVariants: false,
    minScore: 15, // Minimum possible team score (1+2+3+4+5)
    maxScore: 200, // Practical maximum for dual meets
    scoreUnits: 'place points',
    validationRules: {
      minWinCondition: 'Lower team score wins (sum of top 5 runner places)',
      scoringConstraints: [
        'Each team must have at least 5 finishers to score',
        'Team score = sum of places of top 5 finishers',
        '6th and 7th runners used for tiebreaking'
      ],
      specialRules: [
        'Lower score wins (opposite of other sports)',
        'Perfect score is 15 (places 1,2,3,4,5)',
        'Ties broken by 6th runner placement'
      ]
    },
    uiConfiguration: {
      inputType: 'event_by_event',
      quickEntryAvailable: false,
      defaultView: 'detailed',
      requiredFields: ['runners', 'homeTeamScore', 'awayTeamScore', 'winner', 'scoringRunners'],
      optionalFields: []
    }
  },

  tennis: {
    sport: 'tennis',
    scoringType: 'match_play',
    displayName: 'Tennis',
    scoreDisplayType: 'standard',
    allowsTies: true,
    hasOvertimeVariants: false,
    minScore: 0,
    maxScore: 9, // Typical high school format: 6 singles + 3 doubles
    scoreUnits: 'matches won',
    validationRules: {
      minWinCondition: 'Team with most individual matches won wins dual meet',
      scoringConstraints: [
        'Individual matches use standard tennis scoring',
        'Team score = number of individual matches won',
        'Common format: 6 singles + 3 doubles = 9 total matches'
      ],
      specialRules: [
        'Individual matches may use pro sets or full sets',
        'Weather may affect completion of all matches',
        'Some dual meets decided when majority reached'
      ]
    },
    uiConfiguration: {
      inputType: 'match_by_match',
      quickEntryAvailable: true,
      defaultView: 'simple',
      requiredFields: ['matches', 'homeMatchesWon', 'awayMatchesWon', 'winner'],
      optionalFields: []
    }
  },

  golf: {
    sport: 'golf',
    scoringType: 'stroke_play',
    displayName: 'Golf',
    scoreDisplayType: 'strokes',
    allowsTies: false,
    hasOvertimeVariants: false,
    minScore: 18, // Theoretical minimum for 18 holes
    scoreUnits: 'strokes',
    validationRules: {
      minWinCondition: 'Lower team total score wins (sum of individual scores)',
      scoringConstraints: [
        'Individual stroke play scores combined for team total',
        'Lower total wins (opposite of other sports)',
        'Typically use top 4 or 5 individual scores'
      ],
      specialRules: [
        'Lower score wins (like cross country)',
        'Weather and course conditions affect scoring',
        'Individual scores combined for team competition'
      ]
    },
    uiConfiguration: {
      inputType: 'event_by_event',
      quickEntryAvailable: false,
      defaultView: 'detailed',
      requiredFields: ['players', 'homeTeamTotal', 'awayTeamTotal', 'winner'],
      optionalFields: ['scoringPlayers']
    }
  }
};

// Helper functions for sport profiles

/**
 * Get sport profile by name
 */
export function getSportProfile(sport: string): SportProfile | null {
  return SPORT_PROFILES[sport.toLowerCase()] || null;
}

/**
 * Get all sports that allow ties
 */
export function getSportsThatAllowTies(): string[] {
  return Object.values(SPORT_PROFILES)
    .filter(profile => profile.allowsTies)
    .map(profile => profile.sport);
}

/**
 * Get all sports with overtime variants
 */
export function getSportsWithOvertime(): string[] {
  return Object.values(SPORT_PROFILES)
    .filter(profile => profile.hasOvertimeVariants)
    .map(profile => profile.sport);
}

/**
 * Get scoring type for a sport
 */
export function getScoringTypeForSport(sport: string): keyof typeof SPORT_NAMES | null {
  const profile = getSportProfile(sport);
  return profile?.scoringType || null;
}

/**
 * Get sports by scoring type
 */
export function getSportsByScoringType(scoringType: keyof typeof SPORT_NAMES): string[] {
  return Object.values(SPORT_PROFILES)
    .filter(profile => profile.scoringType === scoringType)
    .map(profile => profile.sport);
}

/**
 * Validate score against sport constraints
 */
export function validateScoreForSport(sport: string, score: number): boolean {
  const profile = getSportProfile(sport);
  if (!profile) return false;
  
  if (score < profile.minScore) return false;
  if (profile.maxScore && score > profile.maxScore) return false;
  
  return true;
}

/**
 * Get display configuration for a sport
 */
export function getDisplayConfigForSport(sport: string) {
  const profile = getSportProfile(sport);
  if (!profile) return null;
  
  return {
    scoreDisplayType: profile.scoreDisplayType,
    scoreUnits: profile.scoreUnits,
    allowsTies: profile.allowsTies,
    hasOvertimeVariants: profile.hasOvertimeVariants,
    uiConfiguration: profile.uiConfiguration
  };
}

// Export commonly used sport lists
export const ALL_SPORTS = Object.keys(SPORT_PROFILES);
export const TIE_ALLOWING_SPORTS = getSportsThatAllowTies();
export const OVERTIME_SPORTS = getSportsWithOvertime();

// Export scoring type mappings
export const SPORT_TO_SCORING_TYPE = Object.fromEntries(
  Object.values(SPORT_PROFILES).map(profile => [profile.sport, profile.scoringType])
);

export const SCORING_TYPE_TO_SPORTS = Object.fromEntries(
  SCORING_TYPES.map(scoringType => [
    scoringType, 
    getSportsByScoringType(scoringType)
  ])
);