import fs from 'fs';
import path from 'path';
import { db } from './db';
import { schools, sports, games, type InsertGame } from '@shared/schema';
import { eq } from 'drizzle-orm';

interface GameData {
  date: string;
  dayOfWeek: string;
  homeTeam: string;
  awayTeam: string;
}

// School name mappings for the CSV (using database names)
const SCHOOL_MAPPINGS: Record<string, string> = {
  "Beecher": "Beecher",
  "Clifton Central": "Central",
  "Central": "Central", 
  "Donovan": "Donovan",
  "GSW": "Gardner South Wilmington",
  "Grace": "Grace Christian Academy",
  "Grant Park": "Grant Park",
  "IL Lutheran": "Illinois Lutheran",
  "Illinois Lutheran": "Illinois Lutheran",
  "Momence": "Momence",
  "St. Anne": "St. Anne",
  "St Anne": "St. Anne",
  "Tri-Point": "Tri Point",
  "Tri Point": "Tri Point",
};

export class GBBScheduleProcessor {
  
  static async processScheduleFromCSV(): Promise<void> {
    console.log('🏀 Processing Boys Basketball Schedule from CSV...');
    
    // Parse the CSV content
    const csvContent = `6,,,,,,,,,,,
,HOME,AWAY,,,HOME,AWAY,,,,,
Tuesday,Clifton Central,Beecher,,Friday,Donovan,GSW,,,,,
,Tri-Point,GSW,,,Clifton Central,Grant Park,,,,,
"November 18, 2025",Grace,Grant Park,,"November 21, 2025",Tri-Point,IL Lutheran,,,,,
,Momence,IL Lutheran,,,Grace,Momence,,,,,
,BYE,Donovan,,,BYE,Beecher,,,,,
,,,,,,,,,,,
,HOME,AWAY,,,HOME,AWAY,,,,,
Monday,IL Lutheran,Grace,,Thursday,Beecher,Grant Park,,,,,
,Grant Park,Tri-Point,,,Donovan,IL Lutheran,,,,,
"December 1, 2025",GSW,Clifton Central,,"December 4, 2025",Clifton Central,Momence,,,,,
,Beecher,Donovan,,,Tri-Point,Grace,,,,,
,BYE,Momence,,,BYE,GSW,,,,,
,,,,,,,,,,,
,HOME,AWAY,,,HOME,AWAY,,,,,
Monday,Momence,Tri-Point,,Thursday,Grant Park,Momence,,,,,
,IL Lutheran,Clifton Central,,,GSW,Grace,,,,,
"December 8, 2025",Grant Park,Donovan,,"December 11, 2025",Beecher,Tri-Point,,,,,
,GSW,Beecher,,,Donovan,Clifton Central,,,,,
,BYE,Grace,,,BYE,IL Lutheran,,,,,
,,,,,,,,,,,
,HOME,AWAY,,,HOME,AWAY,,,,,
Monday,GSW,IL Lutheran,,Thursday,Grace,Clifton Central,,,,,
,Beecher,Momence,,,Momence,Donovan,,,,,
"December 15, 2025",Donovan,Grace,,"December 18, 2025",IL Lutheran,Beecher,,,,,
,Clifton Central,Tri-Point,,,Grant Park,GSW,,,,,
,BYE,Grant Park,,,BYE,Tri-Point,,,,,
,,,,,,,,,,,
,HOME,AWAY,,,HOME,AWAY,,,,,
Monday,Donovan,Tri-Point,,Thursday,Beecher,Clifton Central,,,,,
,Beecher,Grace,,,GSW,Tri-Point,,,,,
"January 5, 2026",GSW,Momence,,"January 8, 2026",Grant Park,Grace,,,,,
,Grant Park,IL Lutheran,,,IL Lutheran,Momence,,,,,
,BYE,Clifton Central,,,BYE,Donovan,,,,,
,,,,,,,,,,,
,HOME,AWAY,,,HOME,AWAY,,,,,
Monday,Tri-Point,Donovan,,Thursday,Momence,Grant Park,,,,,
,Grace,Beecher,,,Grace,GSW,,,,,
"January 12, 2026",Momence,GSW,,"January 15, 2026",Tri-Point,Beecher,,,,,
,IL Lutheran,Grant Park,,,Clifton Central,Donovan,,,,,
,BYE,Clifton Central,,,BYE,IL Lutheran,,,,,
,,,,,,,,,,,
,HOME,AWAY,,,HOME,AWAY,,,,,
Tuesday,GSW,Donovan,,Thursday,Grace,IL Lutheran,,,,,
,Grant Park,Clifton Central,,,Tri-Point,Grant Park,,,,,
"January 20, 2026",IL Lutheran,Tri-Point,,"January 22, 2026",Clifton Central,GSW,,,,,
,Momence,Grace,,,Donovan,Beecher,,,,,
,BYE,Beecher,,,BYE,Momence,,,,,
,,,,,,,,,,,
,HOME,AWAY,,,HOME,AWAY,,,,,
Monday,Grant Park,Beecher,,Thursday,Tri-Point,Momence,,,,,
,IL Lutheran,Donovan,,,Clifton Central,IL Lutheran,,,,,
"January 26, 2026",Momence,Clifton Central,,"January 29, 2026",Donovan,Grant Park,,,,,
,Grace,Tri-Point,,,Beecher,GSW,,,,,
,BYE,GSW,,,BYE,Grace,,,,,
,,,,,,,,,,,
,HOME,AWAY,,,HOME,AWAY,,,,,
Monday,IL Lutheran,GSW,,Thursday,Clifton Central,Grace,,,,,
,Momence,Beecher,,,Donovan,Momence,,,,,
"February 2, 2026",Grace,Donovan,,"February 5, 2026",Beecher,IL Lutheran,,,,,
,Tri-Point,Clifton Central,,,GSW,Grant Park,,,,,
,BYE,Grant Park,,,BYE,Tri-Point,,,,,`;

    const parsedGames = this.parseMatrixCSV(csvContent);
    console.log(`📊 Parsed ${parsedGames.length} games from CSV`);

    // Get database mappings
    const [schoolMap, sportId] = await Promise.all([
      this.getSchoolMappings(),
      this.getBasketballSportId()
    ]);

    if (!sportId) {
      throw new Error('Boys Basketball sport not found in database');
    }

    // Convert to database format and insert
    const gameInserts = await this.convertToGameInserts(parsedGames, schoolMap, sportId);
    
    if (gameInserts.length > 0) {
      // Clear existing games for Boys Basketball 2025-26 season
      console.log('🗑️ Clearing existing Boys Basketball games...');
      await db.delete(games).where(eq(games.sportId, sportId));
      
      // Insert new games
      console.log(`➕ Inserting ${gameInserts.length} new games...`);
      await db.insert(games).values(gameInserts);
      
      console.log('✅ Boys Basketball schedule successfully processed!');
    } else {
      console.log('❌ No valid games to insert');
    }
  }

  private static parseMatrixCSV(csvContent: string): GameData[] {
    const lines = csvContent.split('\n');
    const games: GameData[] = [];
    let currentDate = '';
    let dayOfWeek = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines and headers
      if (!line || line.startsWith(',,,') || line.includes('HOME,AWAY')) {
        continue;
      }

      // Check for date line
      const dateMatch = line.match(/"?([A-Za-z]+ \d{1,2}, \d{4})"?/);
      if (dateMatch) {
        currentDate = dateMatch[1];
        continue;
      }

      // Check for day of week with games
      const dayMatch = line.match(/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/);
      if (dayMatch) {
        dayOfWeek = dayMatch[1];
        const parts = line.split(',');
        if (parts.length >= 3 && currentDate) {
          this.extractGamesFromLine(parts, currentDate, dayOfWeek, games);
        }
        continue;
      }

      // Check for continuation lines
      const parts = line.split(',');
      if (parts.length >= 3 && currentDate && parts[0].trim() === '') {
        this.extractGamesFromLine(parts, currentDate, dayOfWeek, games);
      }
    }

    return games;
  }

  private static extractGamesFromLine(
    parts: string[], 
    date: string, 
    dayOfWeek: string, 
    games: GameData[]
  ): void {
    // Process pairs of HOME,AWAY columns
    for (let i = 1; i < parts.length - 1; i += 2) {
      const homeTeam = parts[i]?.trim();
      const awayTeam = parts[i + 1]?.trim();

      if (homeTeam && awayTeam && homeTeam !== 'HOME' && awayTeam !== 'AWAY') {
        // Skip BYE games and tournaments
        if (homeTeam === 'BYE' || awayTeam === 'BYE' || 
            homeTeam.startsWith('#') || awayTeam.startsWith('#') ||
            homeTeam.includes('seed') || awayTeam.includes('seed')) {
          continue;
        }

        games.push({
          date,
          dayOfWeek,
          homeTeam,
          awayTeam
        });
      }
    }
  }

  private static async getSchoolMappings(): Promise<Map<string, { id: number; address: string; city: string; state: string }>> {
    const schoolRecords = await db.select().from(schools);
    const schoolMap = new Map();

    schoolRecords.forEach(school => {
      schoolMap.set(school.name, {
        id: school.id,
        address: school.address || '',
        city: school.city || '',
        state: school.state || 'IL'
      });
    });

    return schoolMap;
  }

  private static async getBasketballSportId(): Promise<number | null> {
    const sport = await db.select().from(sports).where(eq(sports.name, 'Boys Basketball')).limit(1);
    return sport[0]?.id || null;
  }

  private static async convertToGameInserts(
    games: GameData[],
    schoolMap: Map<string, { id: number; address: string; city: string; state: string }>,
    sportId: number
  ): Promise<InsertGame[]> {
    const gameInserts: InsertGame[] = [];

    for (const game of games) {
      // Normalize school names
      const normalizedHome = this.normalizeSchoolName(game.homeTeam);
      const normalizedAway = this.normalizeSchoolName(game.awayTeam);

      if (!normalizedHome || !normalizedAway) {
        console.warn(`⚠️ Skipping game with unknown teams: ${game.homeTeam} vs ${game.awayTeam}`);
        continue;
      }

      const homeSchool = schoolMap.get(normalizedHome);
      const awaySchool = schoolMap.get(normalizedAway);

      if (!homeSchool || !awaySchool) {
        console.warn(`⚠️ Skipping game with unmapped schools: ${normalizedHome} vs ${normalizedAway}`);
        continue;
      }

      // Format game location using home school's information
      const location = this.formatGameLocation(homeSchool);

      const gameInsert: InsertGame = {
        homeTeamId: homeSchool.id,
        awayTeamId: awaySchool.id,
        sportId: sportId,
        gameDate: new Date(game.date),
        gameTime: this.getGameTime(game.dayOfWeek),
        level: 'Varsity',
        location: location,
        notes: `${game.dayOfWeek} game`,
        isConferenceGame: true,
        isCompleted: false,
      };

      gameInserts.push(gameInsert);
    }

    return gameInserts;
  }

  private static normalizeSchoolName(name: string): string | null {
    const trimmed = name.trim();
    return SCHOOL_MAPPINGS[trimmed] || null;
  }

  private static formatGameLocation(homeSchool: { address: string; city: string; state: string }): string {
    const parts = [];
    if (homeSchool.address) parts.push(homeSchool.address);
    if (homeSchool.city) parts.push(homeSchool.city);
    if (homeSchool.state) parts.push(homeSchool.state);
    
    return parts.join(', ') || 'Home School Gymnasium';
  }

  private static getGameTime(dayOfWeek: string): string {
    // Standard conference game times
    const gameTimes: Record<string, string> = {
      'Monday': '19:00',
      'Tuesday': '19:00', 
      'Wednesday': '19:00',
      'Thursday': '19:00',
      'Friday': '19:30',
      'Saturday': '15:00',
      'Sunday': '14:00'
    };
    
    return gameTimes[dayOfWeek] || '19:00';
  }
}

// Export for use in other modules
export default GBBScheduleProcessor;

// Auto-run when executed
GBBScheduleProcessor.processScheduleFromCSV()
  .then(() => {
    console.log('Schedule processing completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error processing schedule:', error);
    process.exit(1);
  });