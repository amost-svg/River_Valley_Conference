import { storage } from "./storage";
import type { Game } from "@shared/schema";

interface DuplicateMatch {
  existingGame: any;
  confidence: number; // 0-100 score
  reasons: string[];
}

interface MergeResult {
  mergedGame: any;
  removedGame: any;
  conflicts: string[];
}

export default class DuplicateGameManager {
  
  /**
   * Detect potential duplicate games for a new game being created
   */
  static async detectDuplicates(newGame: any): Promise<DuplicateMatch[]> {
    const allGames = await storage.getGames();
    const duplicates: DuplicateMatch[] = [];
    
    for (const existingGame of allGames) {
      const match = this.calculateDuplicateScore(newGame, existingGame);
      if (match.confidence >= 70) { // 70% confidence threshold
        duplicates.push({
          existingGame,
          confidence: match.confidence,
          reasons: match.reasons
        });
      }
    }
    
    return duplicates.sort((a, b) => b.confidence - a.confidence);
  }
  
  /**
   * Calculate duplicate score between two games
   */
  private static calculateDuplicateScore(game1: any, game2: any): { confidence: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];
    
    // Same date (exact match = +40 points)
    if (game1.gameDate && game2.gameDate) {
      const date1 = new Date(game1.gameDate).toDateString();
      const date2 = new Date(game2.gameDate).toDateString();
      if (date1 === date2) {
        score += 40;
        reasons.push("Same game date");
      }
    }
    
    // Same sport (+30 points)
    if (game1.sportId === game2.sportId) {
      score += 30;
      reasons.push("Same sport");
    }
    
    // Same teams playing each other (+25 points)
    const teams1 = this.getTeamIdentifiers(game1);
    const teams2 = this.getTeamIdentifiers(game2);
    
    if (this.areTeamsMatching(teams1, teams2)) {
      score += 25;
      reasons.push("Same teams playing");
    }
    
    // Similar game time (+10 points if within 2 hours)
    if (game1.gameTime && game2.gameTime) {
      const timeDiff = this.getTimeDifferenceInMinutes(game1.gameTime, game2.gameTime);
      if (timeDiff <= 120) { // Within 2 hours
        score += 10;
        reasons.push("Similar game time");
      }
    }
    
    // Same location (+5 points)
    if (game1.location && game2.location && 
        game1.location.toLowerCase() === game2.location.toLowerCase()) {
      score += 5;
      reasons.push("Same location");
    }
    
    // External event ID match (+50 points - highest confidence)
    if (game1.externalEventId && game2.externalEventId && 
        game1.externalEventId === game2.externalEventId) {
      score += 50;
      reasons.push("Same external event ID");
    }
    
    return { confidence: Math.min(score, 100), reasons };
  }
  
  /**
   * Get team identifiers for comparison
   */
  private static getTeamIdentifiers(game: any): { home: string; away: string } {
    return {
      home: game.homeTeamId?.toString() || game.homeTeamName?.toLowerCase() || '',
      away: game.awayTeamId?.toString() || game.awayTeamName?.toLowerCase() || ''
    };
  }
  
  /**
   * Check if two games have matching teams (considering home/away swaps)
   */
  private static areTeamsMatching(teams1: { home: string; away: string }, teams2: { home: string; away: string }): boolean {
    // Exact match
    if (teams1.home === teams2.home && teams1.away === teams2.away) {
      return true;
    }
    
    // Swapped home/away (common when different schools enter the same game)
    if (teams1.home === teams2.away && teams1.away === teams2.home) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Get time difference between two time strings in minutes
   */
  private static getTimeDifferenceInMinutes(time1: string, time2: string): number {
    try {
      const today = new Date().toDateString();
      const date1 = new Date(`${today} ${time1}`);
      const date2 = new Date(`${today} ${time2}`);
      return Math.abs((date1.getTime() - date2.getTime()) / (1000 * 60));
    } catch {
      return Infinity;
    }
  }
  
  /**
   * Automatically merge duplicate games based on priority rules
   */
  static async autoMergeDuplicates(newGame: any, existingGame: any): Promise<MergeResult> {
    const conflicts: string[] = [];
    
    // Priority rules for merging:
    // 1. Home team input takes precedence
    // 2. More complete data wins
    // 3. Earlier creation time wins if data quality is equal
    
    let primaryGame = this.selectPrimaryGame(newGame, existingGame);
    let secondaryGame = primaryGame === newGame ? existingGame : newGame;
    
    // Merge data with conflict detection
    const mergedGame = {
      ...primaryGame,
      id: existingGame.id, // Keep existing ID
    };
    
    // Check for conflicting scores
    if (primaryGame.homeScore !== null && secondaryGame.homeScore !== null && 
        primaryGame.homeScore !== secondaryGame.homeScore) {
      conflicts.push(`Home score conflict: ${primaryGame.homeScore} vs ${secondaryGame.homeScore}`);
    }
    
    if (primaryGame.awayScore !== null && secondaryGame.awayScore !== null && 
        primaryGame.awayScore !== secondaryGame.awayScore) {
      conflicts.push(`Away score conflict: ${primaryGame.awayScore} vs ${secondaryGame.awayScore}`);
    }
    
    // Merge non-conflicting data from secondary game
    if (!mergedGame.gameSummary && secondaryGame.gameSummary) {
      mergedGame.gameSummary = secondaryGame.gameSummary;
    }
    
    if (!mergedGame.location && secondaryGame.location) {
      mergedGame.location = secondaryGame.location;
    }
    
    // Set ownership to home team
    mergedGame.gameOwnerSchoolId = mergedGame.homeTeamId;
    mergedGame.isDuplicateResolved = true;
    
    return {
      mergedGame,
      removedGame: secondaryGame,
      conflicts
    };
  }
  
  /**
   * Select primary game based on priority rules
   */
  private static selectPrimaryGame(game1: any, game2: any): any {
    // Home team data takes precedence
    if (game1.homeTeamId && game1.uploadedBy) {
      // Check if uploader is from home team's school
      // This would require user lookup - simplified for now
    }
    
    // More complete data wins
    const game1Completeness = this.calculateDataCompleteness(game1);
    const game2Completeness = this.calculateDataCompleteness(game2);
    
    if (game1Completeness > game2Completeness) {
      return game1;
    } else if (game2Completeness > game1Completeness) {
      return game2;
    }
    
    // Earlier creation wins
    if (game1.createdAt && game2.createdAt) {
      return new Date(game1.createdAt) < new Date(game2.createdAt) ? game1 : game2;
    }
    
    return game1; // Default
  }
  
  /**
   * Calculate how complete a game's data is (0-100)
   */
  private static calculateDataCompleteness(game: any): number {
    let score = 0;
    const fields = [
      'homeTeamId', 'awayTeamId', 'gameDate', 'gameTime', 'location',
      'homeScore', 'awayScore', 'gameSummary', 'level', 'notes'
    ];
    
    for (const field of fields) {
      if (game[field] !== null && game[field] !== undefined && game[field] !== '') {
        score += 10;
      }
    }
    
    return score;
  }
  
  /**
   * Process a new game and handle duplicates automatically
   */
  static async processNewGame(gameData: any): Promise<{
    game: any;
    duplicatesFound: number;
    merged: boolean;
    conflicts: string[];
    message: string;
  }> {
    const duplicates = await this.detectDuplicates(gameData);
    
    if (duplicates.length === 0) {
      // No duplicates, create game normally
      const game = await storage.createGame(gameData);
      return {
        game,
        duplicatesFound: 0,
        merged: false,
        conflicts: [],
        message: "Game created successfully"
      };
    }
    
    // Handle the best duplicate match
    const bestMatch = duplicates[0];
    if (bestMatch.confidence >= 90) {
      // High confidence - auto merge
      const mergeResult = await this.autoMergeDuplicates(gameData, bestMatch.existingGame);
      const updatedGame = await storage.updateGame(bestMatch.existingGame.id, mergeResult.mergedGame);
      
      return {
        game: updatedGame,
        duplicatesFound: duplicates.length,
        merged: true,
        conflicts: mergeResult.conflicts,
        message: `Game merged with existing entry (${bestMatch.confidence}% confidence)`
      };
    } else {
      // Medium confidence - flag for admin review
      const game = await storage.createGame({
        ...gameData,
        duplicateOfGameId: bestMatch.existingGame.id,
        isDuplicateResolved: false
      });
      
      return {
        game,
        duplicatesFound: duplicates.length,
        merged: false,
        conflicts: [`Potential duplicate detected: ${bestMatch.reasons.join(', ')}`],
        message: `Game created but flagged as potential duplicate (${bestMatch.confidence}% confidence)`
      };
    }
  }
}