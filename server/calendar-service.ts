import { google } from 'googleapis';
import { promises as fs } from 'fs';
import { join } from 'path';

export interface CalendarConfig {
  name: string;
  publicUrl: string;
  icalUrl: string;
  sportId?: number;
  level?: 'JV' | 'Varsity' | 'Both';
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  location?: string;
  description?: string;
  sportId?: number;
  level?: string;
  homeTeam?: string;
  awayTeam?: string;
}

export class CalendarService {
  private calendars: CalendarConfig[] = [];
  private calendar: any;

  constructor() {
    // Initialize Google Calendar API
    const auth = new google.auth.GoogleAuth({
      // In production, use service account key or OAuth2
      scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
    });
    
    this.calendar = google.calendar({ version: 'v3', auth });
    this.loadCalendarConfigs();
  }

  private async loadCalendarConfigs() {
    // Load calendar configurations from the CSV data
    this.calendars = [
      {
        name: 'RVC Volleyball',
        publicUrl: 'https://calendar.google.com/calendar/embed?src=c_40f66f13378e3ec527a356f7c55fdc48a5d4b13d72bd54f04061018229c241b8%40group.calendar.google.com&ctz=America%2FChicago',
        icalUrl: 'https://calendar.google.com/calendar/ical/c_40f66f13378e3ec527a356f7c55fdc48a5d4b13d72bd54f04061018229c241b8%40group.calendar.google.com/public/basic.ics',
        sportId: 3, // Volleyball
        level: 'Both'
      },
      {
        name: 'RVC Soccer',
        publicUrl: 'https://calendar.google.com/calendar/embed?src=c_a45049bcece6ca8d0da01a1bd306a475c4815c7a4551be1e3533c2f808449f3b%40group.calendar.google.com&ctz=America%2FChicago',
        icalUrl: 'https://calendar.google.com/calendar/ical/c_a45049bcece6ca8d0da01a1bd306a475c4815c7a4551be1e3533c2f808449f3b%40group.calendar.google.com/public/basic.ics',
        sportId: 4, // Soccer
        level: 'Both'
      },
      {
        name: 'RVC Girls Basketball',
        publicUrl: 'https://calendar.google.com/calendar/embed?src=c_7a93f9537a04e44d4dd106a4b22f08c1f0ec015b2240838e216a8903d7a0b78a%40group.calendar.google.com&ctz=America%2FChicago',
        icalUrl: 'https://calendar.google.com/calendar/ical/c_7a93f9537a04e44d4dd106a4b22f08c1f0ec015b2240838e216a8903d7a0b78a%40group.calendar.google.com/public/basic.ics',
        sportId: 2, // Basketball
        level: 'Both'
      },
      {
        name: 'RVC Boys Basketball',
        publicUrl: 'https://calendar.google.com/calendar/embed?src=c_0b58def8fa91acf30a18eabd124f3c27cab0be766f4756be4a0f9ed41a07d549%40group.calendar.google.com&ctz=America%2FChicago',
        icalUrl: 'https://calendar.google.com/calendar/ical/c_0b58def8fa91acf30a18eabd124f3c27cab0be766f4756be4a0f9ed41a07d549%40group.calendar.google.com/public/basic.ics',
        sportId: 2, // Basketball
        level: 'Both'
      },
      {
        name: 'RVC Baseball',
        publicUrl: 'https://calendar.google.com/calendar/embed?src=c_57e8bcfd3bd723041a6fcc3c0c9c1128d9b67863ab117e6e394db3836463049e%40group.calendar.google.com&ctz=America%2FChicago',
        icalUrl: 'https://calendar.google.com/calendar/ical/c_57e8bcfd3bd723041a6fcc3c0c9c1128d9b67863ab117e6e394db3836463049e%40group.calendar.google.com/public/basic.ics',
        sportId: 5, // Baseball
        level: 'Both'
      },
      {
        name: 'RVC Softball',
        publicUrl: 'https://calendar.google.com/calendar/embed?src=c_64f1cbcb110b41fe992098cc74107b0921f02e3ac96e2d0fe182cb815250550d%40group.calendar.google.com&ctz=America%2FChicago',
        icalUrl: 'https://calendar.google.com/calendar/ical/c_64f1cbcb110b41fe992098cc74107b0921f02e3ac96e2d0fe182cb815250550d%40group.calendar.google.com/public/basic.ics',
        sportId: 6, // Softball
        level: 'Both'
      },
      {
        name: 'RVC Track',
        publicUrl: 'https://calendar.google.com/calendar/embed?src=c_4e8ce2a59d0cd301e1c420d771f8ca1d35bc7da4e527f1e161dc7de926b49953%40group.calendar.google.com&ctz=America%2FChicago',
        icalUrl: 'https://calendar.google.com/calendar/ical/c_4e8ce2a59d0cd301e1c420d771f8ca1d35bc7da4e527f1e161dc7de926b49953%40group.calendar.google.com/public/basic.ics',
        sportId: 7, // Track
        level: 'Both'
      },
      {
        name: 'RVC Scholastic Bowl',
        publicUrl: 'https://calendar.google.com/calendar/embed?src=c_2b35311d4677f518b5dd232ac05afd1126d4beef5cda7333ffa52f3929ca73cd%40group.calendar.google.com&ctz=America%2FChicago',
        icalUrl: 'https://calendar.google.com/calendar/ical/c_2b35311d4677f518b5dd232ac05afd1126d4beef5cda7333ffa52f3929ca73cd%40group.calendar.google.com/public/basic.ics',
        sportId: 8, // Scholastic Bowl
        level: 'Both'
      }
    ];
  }

  private extractCalendarId(url: string): string {
    // Extract calendar ID from the embed URL
    const match = url.match(/src=([^&]+)/);
    if (match) {
      return decodeURIComponent(match[1]);
    }
    throw new Error('Could not extract calendar ID from URL');
  }

  private parseGameTitle(title: string): { homeTeam?: string; awayTeam?: string; level?: string } {
    // Parse game titles like "Grace vs Momence JV" or "Home: Grace vs Away: Momence"
    const result: { homeTeam?: string; awayTeam?: string; level?: string } = {};
    
    // Check for level designation
    if (title.includes('JV')) result.level = 'JV';
    if (title.includes('Varsity')) result.level = 'Varsity';
    
    // Parse teams (simplified parsing - can be enhanced)
    const vsMatch = title.match(/(.+?)\s+vs\s+(.+?)(?:\s+(JV|Varsity))?$/i);
    if (vsMatch) {
      result.homeTeam = vsMatch[1].trim();
      result.awayTeam = vsMatch[2].trim();
    }
    
    return result;
  }

  async getEventsForSport(sportId: number, days: number = 14): Promise<CalendarEvent[]> {
    const sportCalendars = this.calendars.filter(cal => cal.sportId === sportId);
    const allEvents: CalendarEvent[] = [];
    
    const timeMin = new Date();
    const timeMax = new Date();
    timeMax.setDate(timeMax.getDate() + days);
    
    for (const calendarConfig of sportCalendars) {
      try {
        // For now, we'll use a placeholder implementation
        // In production, you would make actual Google Calendar API calls here
        // or fetch and parse the iCal data
        
        // Placeholder events for demonstration
        const placeholderEvents = this.generatePlaceholderEvents(sportId, calendarConfig);
        allEvents.push(...placeholderEvents);
        
      } catch (error) {
        console.error(`Error fetching events for ${calendarConfig.name}:`, error);
      }
    }
    
    return allEvents.sort((a, b) => a.start.getTime() - b.start.getTime());
  }

  private generatePlaceholderEvents(sportId: number, config: CalendarConfig): CalendarEvent[] {
    // Generate some sample events for demonstration
    const events: CalendarEvent[] = [];
    const today = new Date();
    
    for (let i = 0; i < 5; i++) {
      const eventDate = new Date(today);
      eventDate.setDate(today.getDate() + (i * 3));
      
      const endDate = new Date(eventDate);
      endDate.setHours(eventDate.getHours() + 2);
      
      events.push({
        id: `${config.name}-${i}`,
        title: `Sample Game ${i + 1}`,
        start: eventDate,
        end: endDate,
        sportId,
        level: i % 2 === 0 ? 'Varsity' : 'JV',
        location: 'TBD',
        description: `${config.name} game`,
        homeTeam: 'Home Team',
        awayTeam: 'Away Team'
      });
    }
    
    return events;
  }

  async getAllUpcomingEvents(days: number = 14): Promise<CalendarEvent[]> {
    const allEvents: CalendarEvent[] = [];
    
    for (const config of this.calendars) {
      if (config.sportId) {
        const events = await this.getEventsForSport(config.sportId, days);
        allEvents.push(...events);
      }
    }
    
    return allEvents.sort((a, b) => a.start.getTime() - b.start.getTime());
  }

  getCalendarConfigs(): CalendarConfig[] {
    return this.calendars;
  }

  getCalendarForSport(sportId: number): CalendarConfig[] {
    return this.calendars.filter(cal => cal.sportId === sportId);
  }
}

export const calendarService = new CalendarService();