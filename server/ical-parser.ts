import * as ICAL from 'node-ical';

export interface ParsedCalendarEvent {
  title: string;
  start: Date;
  end: Date;
  location?: string;
  description?: string;
  uid?: string;
  sport?: string;
  level?: string;
  homeTeam?: string;
  awayTeam?: string;
  isConferenceGame?: boolean;
}

export class ICalParser {
  
  /**
   * Parse iCal file content and extract athletic events
   */
  static async parseICalContent(icalContent: string): Promise<ParsedCalendarEvent[]> {
    try {
      const data = ICAL.parseICS(icalContent);
      const events: ParsedCalendarEvent[] = [];
      
      for (const key in data) {
        const event = data[key];
        
        // Only process VEVENT types
        if (event.type !== 'VEVENT') continue;
        
        // Skip all-day events or events without proper dates
        if (!event.start || !event.end || event.start.getTime() === event.end.getTime()) continue;
        
        const parsedEvent = this.parseEventDetails(event);
        if (parsedEvent) {
          events.push(parsedEvent);
        }
      }
      
      return events.sort((a, b) => a.start.getTime() - b.start.getTime());
      
    } catch (error) {
      console.error('Error parsing iCal content:', error);
      throw new Error('Failed to parse calendar file');
    }
  }
  
  /**
   * Parse individual event and extract athletic information
   */
  private static parseEventDetails(event: any): ParsedCalendarEvent | null {
    try {
      const title = event.summary || '';
      const description = event.description || '';
      const location = event.location || '';
      
      // Skip non-athletic events (basic filtering)
      if (!this.isAthleticEvent(title, description, location)) {
        return null;
      }
      
      const parsedEvent: ParsedCalendarEvent = {
        title: title.trim(),
        start: new Date(event.start),
        end: new Date(event.end),
        location: location.trim() || undefined,
        description: description.trim() || undefined,
        uid: event.uid || undefined,
      };
      
      // Extract sport information
      parsedEvent.sport = this.extractSport(title, description);
      
      // Extract level (JV/Varsity)
      parsedEvent.level = this.extractLevel(title, description);
      
      // Extract team information
      const teamInfo = this.extractTeams(title, description);
      parsedEvent.homeTeam = teamInfo.homeTeam;
      parsedEvent.awayTeam = teamInfo.awayTeam;
      
      // Determine if it's a conference game
      parsedEvent.isConferenceGame = this.isConferenceGame(
        parsedEvent.homeTeam, 
        parsedEvent.awayTeam, 
        description
      );
      
      return parsedEvent;
      
    } catch (error) {
      console.error('Error parsing event details:', error);
      return null;
    }
  }
  
  /**
   * Determine if an event is athletic-related
   */
  private static isAthleticEvent(title: string, description: string, location: string): boolean {
    const athleticKeywords = [
      'vs', 'versus', 'against', '@', 'game', 'match', 'meet', 'tournament',
      'football', 'basketball', 'baseball', 'softball', 'volleyball', 'soccer',
      'track', 'golf', 'tennis', 'wrestling', 'cross country', 'scholastic bowl',
      'jv', 'varsity', 'freshman', 'sophomore'
    ];
    
    const combinedText = `${title} ${description} ${location}`.toLowerCase();
    
    return athleticKeywords.some(keyword => combinedText.includes(keyword));
  }
  
  /**
   * Extract sport from event details
   */
  private static extractSport(title: string, description: string): string | undefined {
    const sportMap = {
      'football': ['football', 'fb'],
      'basketball': ['basketball', 'bball', 'bb'],
      'baseball': ['baseball'],
      'softball': ['softball'],
      'volleyball': ['volleyball', 'vball', 'vb'],
      'soccer': ['soccer', 'futbol'],
      'track': ['track', 'track & field', 'track and field'],
      'golf': ['golf'],
      'tennis': ['tennis'],
      'wrestling': ['wrestling', 'wrestle'],
      'cross country': ['cross country', 'xc', 'cc'],
      'scholastic bowl': ['scholastic bowl', 'scholars bowl', 'quiz bowl']
    };
    
    const combinedText = `${title} ${description}`.toLowerCase();
    
    for (const [sport, keywords] of Object.entries(sportMap)) {
      if (keywords.some(keyword => combinedText.includes(keyword))) {
        return sport;
      }
    }
    
    return undefined;
  }
  
  /**
   * Extract level (JV/Varsity) from event details
   */
  private static extractLevel(title: string, description: string): string | undefined {
    const combinedText = `${title} ${description}`.toLowerCase();
    
    if (combinedText.includes('jv') || combinedText.includes('junior varsity')) {
      return 'JV';
    }
    
    if (combinedText.includes('varsity') && !combinedText.includes('junior varsity')) {
      return 'Varsity';
    }
    
    if (combinedText.includes('freshman') || combinedText.includes('frosh')) {
      return 'Freshman';
    }
    
    if (combinedText.includes('sophomore') || combinedText.includes('soph')) {
      return 'Sophomore';
    }
    
    return undefined;
  }
  
  /**
   * Extract team information from event title/description
   */
  private static extractTeams(title: string, description: string): { homeTeam?: string; awayTeam?: string } {
    const rvcSchools = [
      'beecher', 'central', 'donovan', 'gardner south wilmington', 'grace christian',
      'grace', 'grant park', 'illinois lutheran', 'momence', 'st anne', 'st. anne',
      'tri point', 'tripoint'
    ];
    
    // Common patterns for game titles
    const patterns = [
      /(.+?)\s+vs\.?\s+(.+)/i,           // "Team A vs Team B"
      /(.+?)\s+@\s+(.+)/i,              // "Team A @ Team B" (away @ home)
      /(.+?)\s+at\s+(.+)/i,             // "Team A at Team B"
      /home:\s*(.+?)\s+away:\s*(.+)/i,  // "Home: Team A Away: Team B"
      /(.+?)\s+versus\s+(.+)/i,         // "Team A versus Team B"
    ];
    
    const combinedText = title;
    
    for (const pattern of patterns) {
      const match = combinedText.match(pattern);
      if (match) {
        let team1 = match[1].trim();
        let team2 = match[2].trim();
        
        // Clean up team names
        team1 = this.cleanTeamName(team1);
        team2 = this.cleanTeamName(team2);
        
        // For "@ " pattern, team1 is away, team2 is home
        if (pattern.source.includes('@') || pattern.source.includes('at')) {
          return { homeTeam: team2, awayTeam: team1 };
        }
        
        // For other patterns, determine home/away or default to team1 = home
        return { homeTeam: team1, awayTeam: team2 };
      }
    }
    
    return {};
  }
  
  /**
   * Clean team name by removing level indicators and extra text
   */
  private static cleanTeamName(teamName: string): string {
    return teamName
      .replace(/\s+(jv|varsity|freshman|sophomore)\s*$/i, '')
      .replace(/\s+(football|basketball|baseball|softball|volleyball|soccer|track|golf|tennis|wrestling)\s*$/i, '')
      .trim();
  }
  
  /**
   * Determine if a game is a conference game
   */
  private static isConferenceGame(homeTeam?: string, awayTeam?: string, description?: string): boolean {
    const rvcSchools = [
      'beecher', 'central', 'donovan', 'gardner south wilmington', 'grace christian',
      'grace', 'grant park', 'illinois lutheran', 'momence', 'st anne', 'st. anne',
      'tri point', 'tripoint'
    ];
    
    if (!homeTeam || !awayTeam) return false;
    
    const homeIsRVC = rvcSchools.some(school => 
      homeTeam.toLowerCase().includes(school.toLowerCase())
    );
    
    const awayIsRVC = rvcSchools.some(school => 
      awayTeam.toLowerCase().includes(school.toLowerCase())
    );
    
    // Conference game if both teams are RVC schools
    return homeIsRVC && awayIsRVC;
  }
  
  /**
   * Map sport name to sport ID
   */
  static mapSportNameToId(sportName?: string): number | undefined {
    if (!sportName) return undefined;
    
    const sportMapping: { [key: string]: number } = {
      'football': 1,
      'basketball': 2,
      'volleyball': 3,
      'soccer': 4,
      'baseball': 5,
      'softball': 6,
      'track': 7,
      'scholastic bowl': 8,
      'golf': 9,
      'tennis': 10,
      'wrestling': 11,
      'cross country': 12
    };
    
    return sportMapping[sportName.toLowerCase()];
  }
  
  /**
   * Map school name to school ID for RVC schools
   */
  static mapSchoolNameToId(schoolName?: string): number | undefined {
    if (!schoolName) return undefined;
    
    const schoolMapping: { [key: string]: number } = {
      'beecher': 1,
      'central': 2,
      'donovan': 3,
      'gardner south wilmington': 4,
      'grace christian': 5,
      'grace': 5,
      'grant park': 6,
      'illinois lutheran': 7,
      'momence': 8,
      'st anne': 9,
      'st. anne': 9,
      'tri point': 10,
      'tripoint': 10
    };
    
    const cleanName = schoolName.toLowerCase().trim();
    
    // Try exact match first
    if (schoolMapping[cleanName]) {
      return schoolMapping[cleanName];
    }
    
    // Try partial matches
    for (const [school, id] of Object.entries(schoolMapping)) {
      if (cleanName.includes(school) || school.includes(cleanName)) {
        return id;
      }
    }
    
    return undefined;
  }
}