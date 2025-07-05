import { parse } from 'csv-parse/sync';
import { readFileSync } from 'fs';
import { db } from '../server/db';
import { schools } from '../shared/schema';
import { eq } from 'drizzle-orm';

// Mapping of school names to logo files
const logoMapping: Record<string, string> = {
  'Beecher': '/logos/Beecher High School Logo.png',
  'Central': '/logos/Clifton Central Logo.png',
  'Donovan': '/logos/Donovan Logo.png',
  'Gardner South Wilmington': '/logos/Gardener South Wilmington Logo.png',
  'Grace Christian Academy': '/logos/Grace Christian Academy Logo.png',
  'Grant Park': '/logos/Grant Park Logo.png',
  'Illinois Lutheran': '/logos/Illinois Lutheran Logo.png',
  'Momence': '/logos/Momence Logo.png',
  'St. Anne': '/logos/St Anne Logo.png',
  'Tri Point': '/logos/Tri Point Logo.png'
};

async function updateSchools() {
  console.log('Reading updated CSV file...');
  const csvContent = readFileSync('attached_assets/updated_schools.csv', 'utf-8');
  const records = parse(csvContent, { 
    columns: true, 
    skip_empty_lines: true,
    trim: true 
  });

  console.log(`Found ${records.length} schools to update`);

  for (const record of records) {
    const schoolName = record['School Name'];
    
    // Skip empty rows
    if (!schoolName || schoolName.trim() === '') continue;

    console.log(`Updating ${schoolName}...`);

    // Parse address to get city and state
    const addressParts = record['School Address'].split(', ');
    const city = addressParts[addressParts.length - 2] || null;
    const state = addressParts[addressParts.length - 1]?.split(' ')[0] || null;

    const updateData = {
      name: schoolName,
      mascot: record["School's Mascot"] || null,
      address: record['School Address'] || null,
      city: city,
      state: state,
      phoneNumber: record['School Phone Number'] || null,
      superintendentName: record["Superintendent's Name:"] || null,
      principalName: record["Principal's Name"] || null,
      athleticDirectorName: record["Athletic Director's Name"] || null,
      website: record["School's Website"] || null,
      athleticWebsite: record["School's Athletic Website (If applicable)"] || null,
      ihsaPageLink: record["School's IHSA Page Link"] || null,
      missionStatement: record["School's Mission Statement"] || null,
      imageUrl: logoMapping[schoolName] || null
    };

    try {
      // Find existing school by name
      const existingSchool = await db.select().from(schools).where(eq(schools.name, schoolName));
      
      if (existingSchool.length > 0) {
        // Update existing school
        await db.update(schools)
          .set(updateData)
          .where(eq(schools.id, existingSchool[0].id));
        console.log(`✓ Updated ${schoolName}`);
      } else {
        // Create new school
        await db.insert(schools).values(updateData);
        console.log(`✓ Created ${schoolName}`);
      }
    } catch (error) {
      console.error(`✗ Error updating ${schoolName}:`, error);
    }
  }

  console.log('School update completed!');
}

updateSchools().catch(console.error);