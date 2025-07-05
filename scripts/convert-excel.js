import fs from 'fs';
import XLSX from 'xlsx';

// Read the Excel file
const workbook = XLSX.readFile('attached_assets/RVC Member+Schools_1751753742852.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Convert to CSV
const csvData = XLSX.utils.sheet_to_csv(worksheet);

// Write to file
fs.writeFileSync('attached_assets/updated_schools.csv', csvData);

console.log('Excel file converted to CSV successfully!');
console.log('First few lines of the CSV:');
console.log(csvData.split('\n').slice(0, 5).join('\n'));