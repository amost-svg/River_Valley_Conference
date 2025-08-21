import { parse } from "csv-parse";
import { z } from "zod";
import type { InsertGame, InsertSeason } from "@shared/schema";

// Schema for individual game records from CSV
const gameRecordSchema = z.object({
  season: z.string().regex(/^\d{4}$/, "Season must be 4 digits like 2425"),
  sport: z.enum(["volleyball", "soccer", "boys_basketball", "girls_basketball", "softball", "baseball"]),
  level: z.string().default("Varsity"), // JH, JV, Varsity
  conference: z.string().optional(),
  date: z.string(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  home_school: z.string(),
  away_school: z.string(),
  site: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  notes: z.string().optional(),
  rvc_game_id: z.string().optional(),
});

export type GameRecord = z.infer<typeof gameRecordSchema>;

// School name mappings to handle variations in CSV
const SCHOOL_NAME_MAPPINGS: Record<string, string> = {
  "Beecher": "Beecher High School",
  "Central": "Central High School", 
  "Clifton Central": "Central High School",
  "Donovan": "Donovan High School",
  "GSW": "Gardner South Wilmington High School",
  "Grace": "Grace Christian Academy",
  "Grant Park": "Grant Park High School",
  "IL Lutheran": "Illinois Lutheran High School",
  "Illinois Lutheran": "Illinois Lutheran High School",
  "Momence": "Momence High School",
  "St. Anne": "St. Anne High School",
  "Tri-Point": "Tri Point High School",
  "BYE": null, // Indicates a bye week
};

export interface ParsedCSVData {
  games: GameRecord[];
  seasons: Set<string>;
  sports: Set<string>;
  errors: string[];
}

export class CSVParser {
  
  /**
   * Parse a single CSV file or multi-CSV content
   */
  static async parseCSV(csvContent: string, filename?: string): Promise<ParsedCSVData> {
    const result: ParsedCSVData = {
      games: [],
      seasons: new Set(),
      sports: new Set(),
      errors: []
    };

    try {
      // Check if this is a matrix-style CSV (like the GBB 25-26 example)
      if (this.isMatrixFormat(csvContent)) {
        return await this.parseMatrixCSV(csvContent, filename);
      } else {
        return await this.parseStandardCSV(csvContent);
      }
    } catch (error) {
      result.errors.push(`Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return result;
    }
  }

  /**
   * Detect if CSV is in matrix format (dates as rows, teams as columns)
   */
  private static isMatrixFormat(csvContent: string): boolean {
    const lines = csvContent.split('\n');
    // Look for date patterns and HOME/AWAY headers typical of matrix format
    return lines.some(line => 
      line.includes('HOME') && line.includes('AWAY') ||
      /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}\b/.test(line)
    );
  }

  /**
   * Parse matrix-style CSV (like the uploaded GBB schedule)
   */
  private static async parseMatrixCSV(csvContent: string, filename?: string): Promise<ParsedCSVData> {
    const result: ParsedCSVData = {
      games: [],
      seasons: new Set(),
      sports: new Set(),
      errors: []
    };

    const lines = csvContent.split('\n');
    let currentDate = '';
    let currentSport = 'boys_basketball'; // Default from filename, can be enhanced
    let currentSeason = '2526'; // Extract from filename if possible

    // Extract sport and season from filename if provided
    if (filename) {
      if (filename.includes('GBB')) currentSport = 'boys_basketball';
      else if (filename.includes('Volleyball')) currentSport = 'volleyball';
      else if (filename.includes('Soccer')) currentSport = 'soccer';
      else if (filename.includes('Softball')) currentSport = 'softball';
      else if (filename.includes('Baseball')) currentSport = 'baseball';
      
      const seasonMatch = filename.match(/(\d{2})-(\d{2})/);
      if (seasonMatch) {
        currentSeason = seasonMatch[1] + seasonMatch[2];
      }
    }

    result.seasons.add(currentSeason);
    result.sports.add(currentSport);

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
      if (line.match(/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/)) {
        const parts = line.split(',');
        if (parts.length >= 3 && currentDate) {
          // Extract games from this line
          this.extractGamesFromMatrixLine(parts, currentDate, currentSport, currentSeason, result);
        }
        continue;
      }

      // Check for continuation lines with more games
      const parts = line.split(',');
      if (parts.length >= 3 && currentDate && parts[0].trim() === '') {
        this.extractGamesFromMatrixLine(parts, currentDate, currentSport, currentSeason, result);
      }
    }

    return result;
  }

  /**
   * Extract individual games from a matrix format line
   */
  private static extractGamesFromMatrixLine(
    parts: string[], 
    date: string, 
    sport: string, 
    season: string, 
    result: ParsedCSVData
  ) {
    // Process pairs of HOME,AWAY columns
    for (let i = 1; i < parts.length - 1; i += 2) {
      const homeTeam = parts[i]?.trim();
      const awayTeam = parts[i + 1]?.trim();

      if (homeTeam && awayTeam && homeTeam !== 'HOME' && awayTeam !== 'AWAY') {
        // Skip BYE games
        if (homeTeam === 'BYE' || awayTeam === 'BYE') {
          continue;
        }

        // Normalize school names
        const normalizedHome = this.normalizeSchoolName(homeTeam);
        const normalizedAway = this.normalizeSchoolName(awayTeam);

        if (normalizedHome && normalizedAway) {
          try {
            const gameRecord: GameRecord = {
              season,
              sport: sport as any,
              level: "Varsity",
              date: this.formatDate(date),
              home_school: normalizedHome,
              away_school: normalizedAway,
              start_time: "19:00", // Default 7:00 PM
              notes: "Generated from matrix CSV",
            };

            const validatedGame = gameRecordSchema.parse(gameRecord);
            result.games.push(validatedGame);
          } catch (error) {
            result.errors.push(`Invalid game record: ${homeTeam} vs ${awayTeam} on ${date}`);
          }
        }
      }
    }
  }

  /**
   * Parse standard CSV format (canonical columns)
   */
  private static async parseStandardCSV(csvContent: string): Promise<ParsedCSVData> {
    const result: ParsedCSVData = {
      games: [],
      seasons: new Set(),
      sports: new Set(),
      errors: []
    };

    return new Promise((resolve) => {
      const parser = parse({
        columns: true,
        skip_empty_lines: true,
        delimiter: ',',
      });

      parser.on('readable', function() {
        let record;
        while ((record = parser.read()) !== null) {
          try {
            const validatedGame = gameRecordSchema.parse(record);
            result.games.push(validatedGame);
            result.seasons.add(validatedGame.season);
            result.sports.add(validatedGame.sport);
          } catch (error) {
            result.errors.push(`Invalid record: ${JSON.stringify(record)}`);
          }
        }
      });

      parser.on('error', function(err) {
        result.errors.push(`CSV parsing error: ${err.message}`);
      });

      parser.on('end', function() {
        resolve(result);
      });

      parser.write(csvContent);
      parser.end();
    });
  }

  /**
   * Normalize school names using mapping table
   */
  private static normalizeSchoolName(name: string): string | null {
    const trimmed = name.trim();
    return SCHOOL_NAME_MAPPINGS[trimmed] ?? trimmed;
  }

  /**
   * Format date string to ISO format
   */
  private static formatDate(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      return date.toISOString().split('T')[0];
    } catch {
      return dateStr; // Return original if parsing fails
    }
  }

  /**
   * Convert parsed CSV data to database insertable format
   */
  static async convertToGameInserts(
    games: GameRecord[], 
    schoolMap: Map<string, number>,
    sportMap: Map<string, number>
  ): Promise<InsertGame[]> {
    const gameInserts: InsertGame[] = [];

    for (const game of games) {
      const homeSchoolId = schoolMap.get(game.home_school);
      const awaySchoolId = schoolMap.get(game.away_school);
      const sportId = sportMap.get(game.sport);

      if (!homeSchoolId || !awaySchoolId || !sportId) {
        continue; // Skip games where we can't find matching schools/sports
      }

      const gameInsert: InsertGame = {
        homeTeamId: homeSchoolId,
        awayTeamId: awaySchoolId,
        sportId: sportId,
        gameDate: new Date(game.date),
        gameTime: game.start_time || "19:00",
        level: game.level,
        location: game.site || "",
        notes: game.notes || "",
        isConferenceGame: true,
        isCompleted: false,
        externalEventId: game.rvc_game_id,
      };

      gameInserts.push(gameInsert);
    }

    return gameInserts;
  }
}