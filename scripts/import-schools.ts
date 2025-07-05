import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import { db } from '../server/db';
import { schools } from '../shared/schema';

// Live streaming data mapping
const liveStreamingData: Record<string, { url: string; platform: string }> = {
  'Beecher': {
    url: 'https://www.youtube.com/channel/UChH3LB95_qp_IKetKqvquIg/featured',
    platform: 'YouTube Channel (via HUDL)'
  },
  'Central': {
    url: 'www.nfhsnetwork.com',
    platform: 'NFHS Network'
  },
  'Donovan': {
    url: 'https://www.youtube.com/channel/UCdtEse-Q4-dYtvMiYfzw2lA',
    platform: 'YouTube Channel'
  },
  'Grace Christian Academy': {
    url: 'https://www.youtube.com/user/GCACrusaders',
    platform: 'YouTube Channel'
  },
  'Grant Park': {
    url: 'https://www.nfhsnetwork.com/schools/5096f92fd9',
    platform: 'NFHS Network'
  },
  'Gardner South Wilmington': {
    url: 'https://www.youtube.com/channel/UC4hu8ohafnRBBYOtOJe-ssQ',
    platform: 'YouTube Channel (via HUDL)'
  },
  'Illinois Lutheran': {
    url: 'https://www.youtube.com/channel/UCeKYt3RDjqlEktNFseoDezg',
    platform: 'YouTube Channel (ILS TV)'
  },
  'Momence': {
    url: 'www.nfhsnetwork.com',
    platform: 'NFHS Network'
  },
  'St. Anne': {
    url: 'http://bit.ly/SACHSAthletics',
    platform: 'YouTube Channel'
  },
  'Tri Point': {
    url: 'www.nfhsnetwork.com',
    platform: 'NFHS Network'
  }
};

function parseAddress(addressJson: string) {
  try {
    const parsed = JSON.parse(addressJson);
    const city = parsed.city || '';
    const state = parsed.subdivisions?.find((s: any) => s.type === 'ADMINISTRATIVE_AREA_LEVEL_1')?.name || '';
    const latitude = parsed.location?.latitude?.toString() || '';
    const longitude = parsed.location?.longitude?.toString() || '';
    
    return { city, state, latitude, longitude };
  } catch (error) {
    console.error('Error parsing address:', error);
    return { city: '', state: '', latitude: '', longitude: '' };
  }
}

async function importSchools() {
  try {
    // Read and parse CSV file
    let csvContent = readFileSync('../attached_assets/Member+Schools_1751751266526.csv', 'utf-8');
    
    // Remove BOM if present
    if (csvContent.charCodeAt(0) === 0xFEFF) {
      csvContent = csvContent.slice(1);
    }
    
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      quote: '"',
      escape: '"'
    });

    console.log(`Found ${records.length} schools to import`);

    // Clear existing schools
    await db.delete(schools);

    // Import each school
    for (const record of records) {
      const schoolName = record['School Name'];
      const addressData = parseAddress(record['School Address']);
      const liveStreaming = liveStreamingData[schoolName] || { url: '', platform: '' };

      const schoolData = {
        name: schoolName,
        mascot: record["School's Mascot"] || '',
        address: record['School Address'] || '',
        city: addressData.city,
        state: addressData.state,
        phoneNumber: record['School Phone Number'] || '',
        superintendentName: record["Superintendent's Name:"] || '',
        principalName: record["Principal's Name"] || '',
        athleticDirectorName: record["Athletic Director's Name"] || '',
        website: record["School's Website"] || '',
        athleticWebsite: record["School's Athletic Website (If applicable)"] || '',
        ihsaPageLink: record["School's IHSA Page Link"] || '',
        missionStatement: record["School's Mission Statement"] || '',
        imageUrl: record['Photo'] || '',
        liveStreamingUrl: liveStreaming.url,
        liveStreamingPlatform: liveStreaming.platform,
        latitude: addressData.latitude,
        longitude: addressData.longitude
      };

      await db.insert(schools).values(schoolData);
      console.log(`Imported: ${schoolName}`);
    }

    console.log('School import completed successfully!');
  } catch (error) {
    console.error('Error importing schools:', error);
  }
}

importSchools();