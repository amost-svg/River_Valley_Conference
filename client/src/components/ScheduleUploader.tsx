import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  Calendar,
  Clock,
  MapPin,
  Users
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface ParsedEvent {
  title: string;
  start: Date;
  end: Date;
  location?: string;
  sport?: string;
  level?: string;
  homeTeam?: string;
  awayTeam?: string;
  isConferenceGame?: boolean;
}

interface UploadResult {
  success: boolean;
  message: string;
  events?: ParsedEvent[];
  imported?: number;
  skipped?: number;
}

// Mock current user - in production this would come from auth context
const mockCurrentUser = {
  id: 1,
  schoolId: 5, // Grace Christian Academy
  schoolName: "Grace Christian Academy"
};

export default function ScheduleUploader() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('icalFile', file);
      formData.append('schoolId', mockCurrentUser.schoolId.toString());
      formData.append('userId', mockCurrentUser.id.toString());
      
      const response = await fetch('/api/admin/upload-schedule', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      return response.json();
    },
    onSuccess: (result: UploadResult) => {
      setUploadResult(result);
      if (result.success) {
        toast({ 
          title: "Success", 
          description: `Imported ${result.imported} events, skipped ${result.skipped}` 
        });
        queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      } else {
        toast({ 
          title: "Upload Error", 
          description: result.message, 
          variant: "destructive" 
        });
      }
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to upload schedule file", 
        variant: "destructive" 
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadResult(null);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragActive(false);
    
    const file = event.dataTransfer.files[0];
    if (file && (file.name.endsWith('.ics') || file.name.endsWith('.ical'))) {
      setSelectedFile(file);
      setUploadResult(null);
    } else {
      toast({ 
        title: "Invalid File", 
        description: "Please select an .ics or .ical file", 
        variant: "destructive" 
      });
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getSportColor = (sport?: string) => {
    const colors: { [key: string]: string } = {
      'football': 'bg-red-100 text-red-800',
      'basketball': 'bg-orange-100 text-orange-800',
      'volleyball': 'bg-purple-100 text-purple-800',
      'soccer': 'bg-green-100 text-green-800',
      'baseball': 'bg-blue-100 text-blue-800',
      'softball': 'bg-pink-100 text-pink-800',
      'track': 'bg-yellow-100 text-yellow-800',
      'scholastic bowl': 'bg-indigo-100 text-indigo-800',
    };
    return sport ? colors[sport.toLowerCase()] || 'bg-gray-100 text-gray-800' : 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Upload className="h-5 w-5 mr-2" />
            Upload Athletic Schedule
          </CardTitle>
          <p className="text-sm text-gray-600">
            Import your complete athletic schedule from SNAP! Mobile or other scheduling software (.ics/.ical format)
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* File Upload Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive 
                  ? 'border-conference-navy bg-blue-50' 
                  : 'border-gray-300 hover:border-conference-navy'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <div className="space-y-2">
                <p className="text-lg font-medium">
                  Drop your .ics file here, or click to browse
                </p>
                <p className="text-sm text-gray-500">
                  Supports .ics and .ical files from SNAP! Mobile, Google Calendar, Outlook, and other scheduling platforms
                </p>
              </div>
              
              <div className="mt-4">
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".ics,.ical"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button variant="outline" className="mt-2">
                    Browse Files
                  </Button>
                </Label>
              </div>
            </div>

            {/* Selected File */}
            {selectedFile && (
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-conference-navy" />
                  <div>
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={handleUpload}
                  disabled={uploadMutation.isPending}
                  className="bg-conference-navy hover:bg-blue-800"
                >
                  {uploadMutation.isPending ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Schedule
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Upload Progress */}
            {uploadMutation.isPending && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Processing calendar file...</span>
                  <span>Please wait</span>
                </div>
                <Progress value={undefined} className="w-full" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upload Results */}
      {uploadResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              {uploadResult.success ? (
                <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
              )}
              Upload Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Summary */}
              <Alert>
                <AlertDescription>
                  {uploadResult.success ? (
                    <div className="flex items-center justify-between">
                      <span>
                        Successfully imported <strong>{uploadResult.imported}</strong> events, 
                        skipped <strong>{uploadResult.skipped}</strong> duplicates or invalid events
                      </span>
                      <Badge variant="outline" className="text-green-600">
                        Completed
                      </Badge>
                    </div>
                  ) : (
                    <span className="text-red-600">{uploadResult.message}</span>
                  )}
                </AlertDescription>
              </Alert>

              {/* Imported Events Preview */}
              {uploadResult.events && uploadResult.events.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Imported Events Preview</h3>
                    <Badge variant="outline">
                      {uploadResult.events.length} events processed
                    </Badge>
                  </div>
                  
                  <div className="grid gap-3 max-h-96 overflow-y-auto">
                    {uploadResult.events.slice(0, 10).map((event, index) => (
                      <div key={index} className="p-3 border rounded-lg bg-white">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium">{event.title}</h4>
                          <div className="flex items-center space-x-2">
                            {event.sport && (
                              <Badge className={getSportColor(event.sport)}>
                                {event.sport}
                              </Badge>
                            )}
                            {event.level && (
                              <Badge variant="outline">{event.level}</Badge>
                            )}
                            <Badge variant={event.isConferenceGame ? "default" : "secondary"}>
                              {event.isConferenceGame ? "Conference" : "Non-Conference"}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(event.start)}
                          </div>
                          
                          {event.location && (
                            <div className="flex items-center">
                              <MapPin className="h-3 w-3 mr-1" />
                              {event.location}
                            </div>
                          )}
                          
                          {event.homeTeam && event.awayTeam && (
                            <div className="flex items-center">
                              <Users className="h-3 w-3 mr-1" />
                              {event.homeTeam} vs {event.awayTeam}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {uploadResult.events.length > 10 && (
                      <div className="text-center py-2 text-gray-500">
                        ... and {uploadResult.events.length - 10} more events
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle>How to Export from Common Scheduling Software</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-conference-navy">SNAP! Mobile</h4>
              <p className="text-sm text-gray-600">
                Go to Calendar → Export → Select "iCal Format" → Choose date range → Download .ics file
              </p>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="font-medium text-conference-navy">Google Calendar</h4>
              <p className="text-sm text-gray-600">
                Settings → Import & Export → Export → Select your athletic calendar → Download .ics file
              </p>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="font-medium text-conference-navy">Microsoft Outlook</h4>
              <p className="text-sm text-gray-600">
                File → Save Calendar → Choose "iCalendar Format (.ics)" → Save
              </p>
            </div>
            
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Note:</strong> The system will automatically detect conference vs non-conference games. 
                Make sure your event titles include team names (e.g., "Grace vs Momence JV Basketball").
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}