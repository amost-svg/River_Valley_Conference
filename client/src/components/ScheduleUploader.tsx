import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Download, Upload, ExternalLink, Info, CheckCircle } from 'lucide-react';

export default function ScheduleUploader() {
  const googleCalendars = [
    { name: 'RVC Volleyball', sport: 'Volleyball', season: 'Fall' },
    { name: 'RVC Soccer', sport: 'Soccer', season: 'Fall' },
    { name: 'RVC Girls Basketball', sport: 'Girls Basketball', season: 'Winter' },
    { name: 'RVC Boys Basketball', sport: 'Boys Basketball', season: 'Winter' },
    { name: 'RVC Baseball', sport: 'Baseball', season: 'Spring' },
    { name: 'RVC Softball', sport: 'Softball', season: 'Spring' },
    { name: 'RVC Track', sport: 'Track', season: 'Spring' },
    { name: 'RVC Scholastic Bowl', sport: 'Scholastic Bowl', season: 'Winter/Spring' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Google Calendar Integration</h3>
        <p className="text-sm text-gray-600">
          Follow these instructions to export your schedules from SNAP! Mobile or other scheduling software and upload them directly to RVC Google Calendars.
        </p>
      </div>

      {/* Step-by-Step Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Download className="h-5 w-5 mr-2" />
            Step 1: Export from SNAP! Mobile
          </CardTitle>
          <CardDescription>
            Export your team schedules as iCal (.ics) files
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              These instructions work for SNAP! Mobile and most other scheduling platforms that support iCal exports.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-3 text-sm">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-conference-navy text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
              <div>
                <p className="font-medium">Login to SNAP! Mobile</p>
                <p className="text-gray-600">Access your athletic director account</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-conference-navy text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
              <div>
                <p className="font-medium">Navigate to Schedule Export</p>
                <p className="text-gray-600">Look for "Export" or "Calendar" options in your schedule section</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-conference-navy text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
              <div>
                <p className="font-medium">Select iCal Format</p>
                <p className="text-gray-600">Choose "iCal" or ".ics" as your export format</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-conference-navy text-white rounded-full flex items-center justify-center text-xs font-bold">4</div>
              <div>
                <p className="font-medium">Download the File</p>
                <p className="text-gray-600">Save the .ics file to your computer</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Google Calendar Upload Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Upload className="h-5 w-5 mr-2" />
            Step 2: Upload to Google Calendar
          </CardTitle>
          <CardDescription>
            Import your .ics file directly into the appropriate RVC Google Calendar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 text-sm">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-conference-gold text-conference-navy rounded-full flex items-center justify-center text-xs font-bold">1</div>
              <div>
                <p className="font-medium">Open Google Calendar</p>
                <p className="text-gray-600">Go to calendar.google.com and sign in with your RVC account</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-conference-gold text-conference-navy rounded-full flex items-center justify-center text-xs font-bold">2</div>
              <div>
                <p className="font-medium">Click Settings Gear</p>
                <p className="text-gray-600">In the top right corner, click the settings (gear) icon</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-conference-gold text-conference-navy rounded-full flex items-center justify-center text-xs font-bold">3</div>
              <div>
                <p className="font-medium">Select "Import & Export"</p>
                <p className="text-gray-600">Choose this option from the settings menu</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-conference-gold text-conference-navy rounded-full flex items-center justify-center text-xs font-bold">4</div>
              <div>
                <p className="font-medium">Upload Your .ics File</p>
                <p className="text-gray-600">Click "Select file from your computer" and choose your exported .ics file</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-conference-gold text-conference-navy rounded-full flex items-center justify-center text-xs font-bold">5</div>
              <div>
                <p className="font-medium">Choose the Right Calendar</p>
                <p className="text-gray-600">Select the appropriate RVC sport calendar from the dropdown (see list below)</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-conference-gold text-conference-navy rounded-full flex items-center justify-center text-xs font-bold">6</div>
              <div>
                <p className="font-medium">Click Import</p>
                <p className="text-gray-600">Your events will be added to the calendar and visible to all conference members</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Calendars */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            RVC Google Calendars
          </CardTitle>
          <CardDescription>
            Choose the appropriate calendar for your sport when importing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {googleCalendars.map((calendar, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-sm">{calendar.name}</div>
                  <div className="text-xs text-gray-600">{calendar.season} Sport</div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-xs"
                  onClick={() => window.open('https://calendar.google.com', '_blank')}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Open
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Important Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            Important Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Access Required:</strong> You need edit access to the RVC Google Calendars. Contact the conference administrator if you don't have access.
              </AlertDescription>
            </Alert>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Best Practices</h4>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Import schedules at the beginning of each season</li>
                <li>Update calendars when schedule changes occur</li>
                <li>Include both JV and Varsity games in your exports</li>
                <li>Double-check that events appear in the correct calendar</li>
              </ul>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Troubleshooting</h4>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>If import fails, check that your .ics file is valid</li>
                <li>Ensure you have the correct permissions for the calendar</li>
                <li>Contact IT support if you experience persistent issues</li>
                <li>Verify that dates and times imported correctly</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}