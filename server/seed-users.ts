import { db } from "./db";
import { users, schools } from "@shared/schema";
import { eq } from "drizzle-orm";

interface UserData {
  name: string;
  email: string;
  role: "Principal" | "AD";
  schoolName: string;
  phone?: string;
}

const usersToCreate: UserData[] = [
  // Beecher High School
  { name: "Mike Meyer", email: "mikemeyer@beecher200u.org", role: "Principal", schoolName: "Beecher", phone: "815-931-2526" },
  { name: "Brandon DuBois", email: "brandondubois@beecher200u.org", role: "AD", schoolName: "Beecher" },
  
  // Illinois Lutheran High School
  { name: "Matt Moeller", email: "mmoeller@ilhs.org", role: "Principal", schoolName: "Illinois Lutheran", phone: "262-239-6502" },
  { name: "Nate Hinz", email: "nhinz@ilhs.org", role: "AD", schoolName: "Illinois Lutheran" },
  
  // Donovan High School
  { name: "Justin Benda", email: "bendaj@donovanschools.org", role: "Principal", schoolName: "Donovan", phone: "708-310-1837" },
  { name: "Kim Onnen", email: "onnenk@donovanschools.org", role: "AD", schoolName: "Donovan" },
  
  // St. Anne Community High School
  { name: "Ben O'Brien", email: "obrienb@gapps.sachs302.org", role: "Principal", schoolName: "St. Anne", phone: "630-408-0410" },
  { name: "Zach Kirkland", email: "kirklandz@gapps.sachs302.org", role: "AD", schoolName: "St. Anne" },
  
  // Gardner-South Wilmington (GSW)
  { name: "Andrew Johnson", email: "ajohnson@gswhs73.org", role: "Principal", schoolName: "Gardner South Wilmington", phone: "815-228-6582" },
  { name: "Crystal Aukland", email: "caukland@gswhs73.org", role: "AD", schoolName: "Gardner South Wilmington" },
  
  // Tri-Point High School
  { name: "Alison Buckley", email: "buckleya@tripointschools.org", role: "Principal", schoolName: "Tri Point", phone: "815-953-6779" },
  // Note: Alison Buckley serves as both Principal and AD for Tri-Point
  
  // Grant Park High School
  { name: "Kyle Nevills", email: "kyle.nevills@grantparkdragons.org", role: "Principal", schoolName: "Grant Park", phone: "815-386-3440" },
  { name: "Jared Thompson", email: "jared.thompson@grantparkdragons.org", role: "AD", schoolName: "Grant Park" },
  
  // Grace Christian Academy
  { name: "Aaron Most", email: "amost@gracecrusaders.org", role: "Principal", schoolName: "Grace Christian Academy", phone: "719-465-7564" },
  { name: "Jon Chappell", email: "jchappell@gracecrusaders.org", role: "AD", schoolName: "Grace Christian Academy" },
  
  // Momence High School
  { name: "Jack Richards", email: "jrichards@mcusd1.net", role: "Principal", schoolName: "Momence", phone: "708-955-2090" },
  { name: "Ted Rounds", email: "trounds@mcusd1.net", role: "AD", schoolName: "Momence" },
  
  // Central High School
  { name: "Marc Shaner", email: "mshaner@cusd4.org", role: "Principal", schoolName: "Central", phone: "779-301-5192" },
  { name: "D.J. Harris", email: "dharris@cusd4.org", role: "AD", schoolName: "Central" },
];

async function seedUsers() {
  try {
    console.log("Starting user seeding process...");
    
    // Get all schools to map names to IDs
    const allSchools = await db.select().from(schools);
    const schoolMap = new Map(allSchools.map(school => [school.name, school.id]));
    
    console.log("Available schools:", Array.from(schoolMap.keys()));
    
    let created = 0;
    let updated = 0;
    let skipped = 0;
    
    for (const userData of usersToCreate) {
      try {
        // Find school ID
        const schoolId = schoolMap.get(userData.schoolName);
        if (!schoolId) {
          console.log(`Warning: School '${userData.schoolName}' not found, skipping user ${userData.name}`);
          skipped++;
          continue;
        }
        
        // Check if user already exists
        const [existingUser] = await db.select().from(users).where(eq(users.email, userData.email));
        
        if (existingUser) {
          // Update existing user
          const [updatedUser] = await db
            .update(users)
            .set({
              name: userData.name,
              role: userData.role,
              schoolId: schoolId,
              isActive: true,
              // Keep existing password and other settings
            })
            .where(eq(users.email, userData.email))
            .returning();
            
          console.log(`Updated existing user: ${updatedUser.name} (${updatedUser.email})`);
          updated++;
        } else {
          // Create new user
          const [newUser] = await db
            .insert(users)
            .values({
              name: userData.name,
              email: userData.email,
              password: "password", // Default password - users will need to change this
              role: userData.role,
              schoolId: schoolId,
              isActive: true,
              isSuperAdmin: false,
              createdBy: 1, // Created by super admin
            })
            .returning();
            
          console.log(`Created new user: ${newUser.name} (${newUser.email}) - ${newUser.role} at ${userData.schoolName}`);
          created++;
        }
        
      } catch (userError) {
        console.error(`Error processing user ${userData.name}:`, userError);
        skipped++;
      }
    }
    
    console.log("\n=== User Seeding Complete ===");
    console.log(`Created: ${created} new users`);
    console.log(`Updated: ${updated} existing users`);
    console.log(`Skipped: ${skipped} users`);
    console.log(`Total processed: ${created + updated + skipped}`);
    
    // Display final user count by school
    console.log("\n=== Users by School ===");
    for (const [schoolName, schoolId] of Array.from(schoolMap.entries())) {
      const schoolUsers = await db.select().from(users).where(eq(users.schoolId, schoolId));
      console.log(`${schoolName}: ${schoolUsers.length} users`);
      schoolUsers.forEach(user => {
        console.log(`  - ${user.name} (${user.role}) - ${user.email}`);
      });
    }
    
  } catch (error) {
    console.error("Error during user seeding:", error);
  }
}

seedUsers();