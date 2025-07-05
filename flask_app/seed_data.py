#!/usr/bin/env python3

import sqlite3
from datetime import datetime

def seed_sample_data():
    """Add sample press releases and games to the database"""
    
    conn = sqlite3.connect('rvc_schedule.db')
    conn.row_factory = sqlite3.Row
    
    # Sample press releases
    sample_releases = [
        {
            'title': 'Female Scholar Athlete Award 2025',
            'content': '''The River Valley Conference is proud to announce the 2025 Female Scholar Athlete Award recipients. This prestigious award recognizes female student-athletes who demonstrate excellence both in academics and athletics.

This year's recipients have maintained outstanding GPAs while competing at the highest levels in their respective sports. They serve as role models for their peers and exemplify the values of the River Valley Conference.

The award ceremony will take place at the annual RVC banquet in May 2025. We congratulate all recipients and their families on this well-deserved recognition.

For more information about the Scholar Athlete Award program, please contact your school's athletic director.''',
            'author_id': 1,  # Brandon DuBois - Beecher AD
            'author_name': 'Brandon DuBois',
            'school_name': 'Beecher'
        },
        {
            'title': 'Winter Sports Championships Complete',
            'content': '''The River Valley Conference winter sports season has concluded with exciting championship competitions across all sports.

Basketball tournaments were held at neutral sites with packed crowds supporting their teams. Both boys and girls divisions saw competitive games throughout the tournament brackets.

Wrestling championships showcased individual excellence with several conference records being broken. Track and field athletes prepared for upcoming state competitions with strong conference showings.

Congratulations to all student-athletes, coaches, and schools for an outstanding winter season. Spring sports schedules will be available soon.''',
            'author_id': 5,  # Jon Chappell - Grace Christian AD
            'author_name': 'Jon Chappell',
            'school_name': 'Grace Christian Academy'
        },
        {
            'title': 'Academic Excellence Recognition',
            'content': '''Central High School is pleased to announce that three of our students have been selected for the Illinois State Scholar recognition program.

These students have demonstrated exceptional academic achievement throughout their high school careers while maintaining active involvement in extracurricular activities.

The Illinois State Scholar program recognizes the top 10% of graduating seniors based on ACT scores and class rank. This achievement reflects not only individual excellence but also the quality of education provided by our dedicated faculty.

We are proud of these students and their families for this outstanding accomplishment.''',
            'author_id': 12,  # Marc Shaner - Central Principal  
            'author_name': 'Marc Shaner',
            'school_name': 'Central'
        }
    ]
    
    # Sample games for testing
    sample_games = [
        {
            'school_id': 1,  # Beecher
            'sport': 'Boys Basketball',
            'season': 'Winter',
            'date': '2025-01-15',
            'time': '7:00 PM',
            'opponent': 'Central',
            'location': 'Beecher High School',
            'home_away': 'Home'
        },
        {
            'school_id': 2,  # Central
            'sport': 'Girls Basketball',
            'season': 'Winter',
            'date': '2025-01-18',
            'time': '6:30 PM',
            'opponent': 'Grant Park',
            'location': 'Central High School',
            'home_away': 'Home'
        },
        {
            'school_id': 3,  # Donovan
            'sport': 'Wrestling',
            'season': 'Winter',
            'date': '2025-01-22',
            'time': '6:00 PM',
            'opponent': 'Illinois Lutheran',
            'location': 'Donovan High School',
            'home_away': 'Home'
        }
    ]
    
    try:
        # Insert sample press releases
        for release in sample_releases:
            conn.execute('''
                INSERT OR IGNORE INTO press_releases 
                (title, content, author_id, author_name, school_name, published, created_at)
                VALUES (?, ?, ?, ?, ?, 1, datetime('now'))
            ''', (release['title'], release['content'], release['author_id'], 
                  release['author_name'], release['school_name']))
        
        # Insert sample games
        for game in sample_games:
            conn.execute('''
                INSERT OR IGNORE INTO games 
                (school_id, sport, season, date, time, opponent, location, home_away)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (game['school_id'], game['sport'], game['season'], game['date'],
                  game['time'], game['opponent'], game['location'], game['home_away']))
        
        conn.commit()
        print("Sample data added successfully!")
        
        # Show what we added
        releases = conn.execute('SELECT COUNT(*) as count FROM press_releases').fetchone()
        games = conn.execute('SELECT COUNT(*) as count FROM games').fetchone()
        users = conn.execute('SELECT COUNT(*) as count FROM users').fetchone()
        
        print(f"Database now contains:")
        print(f"- {users['count']} users")
        print(f"- {releases['count']} press releases")
        print(f"- {games['count']} games")
        
    except Exception as e:
        print(f"Error adding sample data: {e}")
    finally:
        conn.close()

if __name__ == '__main__':
    seed_sample_data()