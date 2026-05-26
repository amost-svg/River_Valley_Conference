import { db } from "./db";
import { schools, sports, games, standings, news } from "@shared/schema";

async function seedDatabase() {
  console.log("Starting database seeding...");

  // Insert schools
  const schoolsData = [
    { name: "Beecher High School", mascot: "Bobcats", address: "Beecher, IL", imageUrl: "https://www.rvc-il.com/uploads/2/2/3/6/22362378/beecher-min.png" },
    { name: "Central High School", mascot: "Comets", address: "Clifton, IL", imageUrl: "https://www.rvc-il.com/uploads/2/2/3/6/22362378/central-min.png" },
    { name: "Donovan High School", mascot: "Wildcats", address: "Donovan, IL", imageUrl: "https://www.rvc-il.com/uploads/2/2/3/6/22362378/donovan-min1.png" },
    { name: "Gardner South Wilmington High School", mascot: "Panthers", address: "Gardner, IL", imageUrl: "https://www.rvc-il.com/uploads/2/2/3/6/22362378/gsw-min.png" },
    { name: "Grace Christian Academy", mascot: "Crusaders", address: "Huntley, IL", imageUrl: "https://www.rvc-il.com/uploads/2/2/3/6/22362378/gca-min.png" },
    { name: "Grant Park High School", mascot: "Dragons", address: "Grant Park, IL", imageUrl: "https://www.rvc-il.com/uploads/2/2/3/6/22362378/gp-min.png" },
    { name: "Illinois Lutheran High School", mascot: "Chargers", address: "Crete, IL", imageUrl: "https://www.rvc-il.com/uploads/2/2/3/6/22362378/ill-luth-min.png" },
    { name: "Momence High School", mascot: "Redskins", address: "Momence, IL", imageUrl: "https://www.rvc-il.com/uploads/2/2/3/6/22362378/momence-min.png" },
    { name: "St. Anne High School", mascot: "Cardinals", address: "St. Anne, IL", imageUrl: "https://www.rvc-il.com/uploads/2/2/3/6/22362378/stanne-min.png" },
    { name: "Tri-Point High School", mascot: "Chargers", address: "Cullom, IL", imageUrl: "https://www.rvc-il.com/uploads/2/2/3/6/22362378/tripoint-min.png" },
  ];

  await db.insert(schools).values(schoolsData);
  console.log("Schools inserted");

  // Insert sports
  const sportsData = [
    { name: "Football", season: "fall" },
    { name: "Basketball", season: "winter" },
    { name: "Soccer", season: "fall" },
    { name: "Baseball", season: "spring" },
    { name: "Track & Field", season: "spring" },
    { name: "Volleyball", season: "fall" },
  ];

  await db.insert(sports).values(sportsData);
  console.log("Sports inserted");

  // Insert games
  const gamesData = [
    { homeTeamId: 1, awayTeamId: 2, sportId: 1, gameDate: new Date("2024-10-15"), gameTime: "7:00 PM", homeScore: 28, awayScore: 14, isCompleted: true },
    { homeTeamId: 3, awayTeamId: 4, sportId: 1, gameDate: new Date("2024-10-22"), gameTime: "7:30 PM", homeScore: 21, awayScore: 17, isCompleted: true },
    { homeTeamId: 5, awayTeamId: 6, sportId: 1, gameDate: new Date("2024-10-29"), gameTime: "7:00 PM", homeScore: null, awayScore: null, isCompleted: false },
    { homeTeamId: 7, awayTeamId: 8, sportId: 1, gameDate: new Date("2024-11-05"), gameTime: "7:30 PM", homeScore: null, awayScore: null, isCompleted: false },
    { homeTeamId: 9, awayTeamId: 10, sportId: 1, gameDate: new Date("2024-11-12"), gameTime: "7:00 PM", homeScore: null, awayScore: null, isCompleted: false },
    { homeTeamId: 1, awayTeamId: 3, sportId: 2, gameDate: new Date("2024-12-03"), gameTime: "7:30 PM", homeScore: 65, awayScore: 58, isCompleted: true },
    { homeTeamId: 2, awayTeamId: 5, sportId: 2, gameDate: new Date("2024-12-10"), gameTime: "7:00 PM", homeScore: 72, awayScore: 64, isCompleted: true },
    { homeTeamId: 4, awayTeamId: 7, sportId: 2, gameDate: new Date("2024-12-17"), gameTime: "7:30 PM", homeScore: null, awayScore: null, isCompleted: false },
  ];

  await db.insert(games).values(gamesData);
  console.log("Games inserted");

  // Insert standings for multiple sports with comprehensive data
  const standingsData = [
    // Soccer (Fall) - includes ties
    { schoolId: 1, sportId: 1, wins: 6, losses: 2, ties: 2, pointsFor: 18, pointsAgainst: 12, season: "2024-2025" },
    { schoolId: 2, sportId: 1, wins: 5, losses: 3, ties: 2, pointsFor: 16, pointsAgainst: 14, season: "2024-2025" },
    { schoolId: 3, sportId: 1, wins: 5, losses: 4, ties: 1, pointsFor: 15, pointsAgainst: 16, season: "2024-2025" },
    { schoolId: 4, sportId: 1, wins: 4, losses: 4, ties: 2, pointsFor: 14, pointsAgainst: 15, season: "2024-2025" },
    { schoolId: 5, sportId: 1, wins: 3, losses: 6, ties: 1, pointsFor: 12, pointsAgainst: 18, season: "2024-2025" },
    { schoolId: 6, sportId: 1, wins: 2, losses: 6, ties: 2, pointsFor: 10, pointsAgainst: 20, season: "2024-2025" },
    
    // Basketball (Winter)
    { schoolId: 2, sportId: 2, wins: 12, losses: 2, ties: 0, pointsFor: 1423, pointsAgainst: 1189, season: "2024-2025" },
    { schoolId: 7, sportId: 2, wins: 10, losses: 4, ties: 0, pointsFor: 1345, pointsAgainst: 1278, season: "2024-2025" },
    { schoolId: 1, sportId: 2, wins: 9, losses: 5, ties: 0, pointsFor: 1301, pointsAgainst: 1298, season: "2024-2025" },
    { schoolId: 4, sportId: 2, wins: 8, losses: 6, ties: 0, pointsFor: 1289, pointsAgainst: 1201, season: "2024-2025" },
    { schoolId: 6, sportId: 2, wins: 7, losses: 7, ties: 0, pointsFor: 1245, pointsAgainst: 1367, season: "2024-2025" },
    { schoolId: 9, sportId: 2, wins: 5, losses: 9, ties: 0, pointsFor: 1198, pointsAgainst: 1389, season: "2024-2025" },
    
    // Volleyball (Fall)
    { schoolId: 1, sportId: 7, wins: 8, losses: 2, ties: 0, pointsFor: 245, pointsAgainst: 178, season: "2024-2025" },
    { schoolId: 2, sportId: 7, wins: 7, losses: 3, ties: 0, pointsFor: 223, pointsAgainst: 189, season: "2024-2025" },
    { schoolId: 3, sportId: 7, wins: 6, losses: 4, ties: 0, pointsFor: 201, pointsAgainst: 198, season: "2024-2025" },
    { schoolId: 4, sportId: 7, wins: 5, losses: 5, ties: 0, pointsFor: 189, pointsAgainst: 201, season: "2024-2025" },
    { schoolId: 5, sportId: 7, wins: 4, losses: 6, ties: 0, pointsFor: 175, pointsAgainst: 215, season: "2024-2025" },
    { schoolId: 6, sportId: 7, wins: 3, losses: 7, ties: 0, pointsFor: 165, pointsAgainst: 225, season: "2024-2025" },
  ];

  await db.insert(standings).values(standingsData);
  console.log("Standings inserted");

  // Insert news
  const newsData = [
    {
      title: "Conference Championship Results",
      excerpt: "Beecher Bobcats capture their third consecutive football championship with a dominant performance against...",
      content: "The Beecher Bobcats secured their third consecutive football championship with a commanding 28-14 victory over Central Comets in front of a packed stadium.",
      category: "Sports",
      publishDate: new Date("2024-10-20"),
      imageUrl: "https://images.unsplash.com/photo-1546519638-68e109498ffc?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400"
    },
    {
      title: "Academic All-Conference Team",
      excerpt: "Congratulations to the 47 student-athletes who achieved Academic All-Conference honors this semester...",
      content: "The River Valley Conference proudly announces the Academic All-Conference team for the fall semester, recognizing student-athletes who excel both on the field and in the classroom.",
      category: "Academic",
      publishDate: new Date("2024-10-18"),
      imageUrl: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400"
    },
    {
      title: "Fall Soccer Playoffs Begin",
      excerpt: "The River Valley Conference soccer playoffs kick off this weekend with quarterfinal matchups across both divisions...",
      content: "Soccer playoffs are here! Eight teams from each division will compete for the conference championship title this weekend.",
      category: "Soccer",
      publishDate: new Date("2024-10-15"),
      imageUrl: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400"
    },
  ];

  await db.insert(news).values(newsData);
  console.log("News inserted");

  console.log("Database seeding completed successfully!");
}

seedDatabase().catch(console.error);