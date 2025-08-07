import { db } from "../server/db";
import { games, schools, sports, users } from "../shared/schema";
import { eq } from "drizzle-orm";

async function createDuplicateTestData() {
  try {
    console.log("Creating test duplicate games for demonstration...");
    
    // Get some existing data for reference
    const allSchools = await db.select().from(schools);
    const allSports = await db.select().from(sports);
    const allUsers = await db.select().from(users);
    
    if (allSchools.length < 2 || allSports.length < 1 || allUsers.length < 2) {
      console.log("Not enough base data (schools, sports, users) to create duplicates");
      return;
    }
    
    const school1 = allSchools[0];
    const school2 = allSchools[1];
    const sport = allSports[0]; // Volleyball
    const user1 = allUsers[0];
    const user2 = allUsers.length > 1 ? allUsers[1] : allUsers[0];
    
    const gameDate = new Date('2024-12-15T19:00:00Z');
    
    // Create the original game
    const [originalGame] = await db.insert(games).values({
      homeTeamId: school1.id,
      awayTeamId: school2.id,
      homeTeamName: school1.name,
      awayTeamName: school2.name,
      sportId: sport.id,
      gameDate: gameDate,
      gameTime: "7:00 PM",
      location: `${school1.name} Gymnasium`,
      uploadedBy: user1.id,
      isComplete: false,
      homeScore: null,
      awayScore: null,
      isDuplicateResolved: false,
      duplicateOfGameId: null,
      gameOwnership: 'home',
      duplicateStatus: 'original',
      mergedFromIds: null
    }).returning();
    
    // Create duplicate games with slight variations
    const duplicates = [
      {
        // Exact duplicate (different uploader)
        homeTeamId: school1.id,
        awayTeamId: school2.id,
        homeTeamName: school1.name,
        awayTeamName: school2.name,
        sportId: sport.id,
        gameDate: gameDate,
        gameTime: "7:00 PM",
        location: `${school1.name} Gymnasium`,
        uploadedBy: user2.id,
        duplicateOfGameId: originalGame.id,
        confidence: 100
      },
      {
        // Same game, different time format
        homeTeamId: school1.id,
        awayTeamId: school2.id,
        homeTeamName: school1.name,
        awayTeamName: school2.name,
        sportId: sport.id,
        gameDate: gameDate,
        gameTime: "19:00",
        location: `${school1.name} Gymnasium`,
        uploadedBy: user2.id,
        duplicateOfGameId: originalGame.id,
        confidence: 95
      },
      {
        // Same teams, same date, different location
        homeTeamId: school2.id, // Teams swapped
        awayTeamId: school1.id,
        homeTeamName: school2.name,
        awayTeamName: school1.name,
        sportId: sport.id,
        gameDate: gameDate,
        gameTime: "7:30 PM",
        location: `${school2.name} Gymnasium`,
        uploadedBy: user1.id,
        duplicateOfGameId: originalGame.id,
        confidence: 85
      }
    ];
    
    for (const [index, duplicateData] of duplicates.entries()) {
      await db.insert(games).values({
        ...duplicateData,
        isComplete: false,
        homeScore: null,
        awayScore: null,
        isDuplicateResolved: false,
        gameOwnership: 'away',
        duplicateStatus: 'potential_duplicate',
        mergedFromIds: null
      });
      
      console.log(`Created duplicate game ${index + 1} with ${duplicateData.confidence}% confidence`);
    }
    
    console.log("✓ Test duplicate games created successfully!");
    console.log(`✓ Original game: ${school1.name} vs ${school2.name} on ${gameDate.toLocaleDateString()}`);
    console.log(`✓ Created ${duplicates.length} potential duplicates for testing`);
    
  } catch (error) {
    console.error("Error creating duplicate test data:", error);
  }
}

// Run the function
createDuplicateTestData().then(() => process.exit(0)).catch(console.error);