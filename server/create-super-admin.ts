import { db } from "./db";
import { users, schools } from "@shared/schema";
import { eq } from "drizzle-orm";

async function createSuperAdmin() {
  try {
    // First, find Grace Christian Academy school
    const [graceSchool] = await db.select().from(schools).where(eq(schools.name, "Grace Christian Academy"));
    
    if (!graceSchool) {
      console.error("Grace Christian Academy school not found");
      return;
    }

    // Check if the super admin user already exists
    const [existingUser] = await db.select().from(users).where(eq(users.email, "amost@gracecrusaders.org"));
    
    if (existingUser) {
      // Update existing user to be super admin
      const [updatedUser] = await db
        .update(users)
        .set({
          isSuperAdmin: true,
          role: "SuperAdmin",
          isActive: true,
        })
        .where(eq(users.email, "amost@gracecrusaders.org"))
        .returning();
        
      console.log("Updated existing user to super admin:", updatedUser);
    } else {
      // Create new super admin user
      const [newUser] = await db
        .insert(users)
        .values({
          email: "amost@gracecrusaders.org",
          password: "password", // Should be changed on first login
          name: "Aaron Most",
          role: "SuperAdmin",
          schoolId: graceSchool.id,
          isActive: true,
          isSuperAdmin: true,
        })
        .returning();
        
      console.log("Created new super admin user:", newUser);
    }
    
    console.log("Super admin setup completed successfully!");
    
  } catch (error) {
    console.error("Error setting up super admin:", error);
  }
}

createSuperAdmin();