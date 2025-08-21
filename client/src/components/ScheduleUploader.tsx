import { useState, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload, FileText, Info, CheckCircle, AlertCircle, Clock, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface CSVUpload {
  id: number;
  filename: string;
  uploadDate: string;
  status: 'processing' | 'completed' | 'failed';
  gamesImported: number;
  duplicatesSkipped: number;
  errorsEncountered: number;
  seasonsCovered: string;
  sportsIncluded: string;
  processingLog: string;
  uploadedBy: number;
}

export default function ScheduleUploader() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Fetch CSV upload history
  const { data: csvUploads, isLoading: csvUploadsLoading } = useQuery<CSVUpload[]>({
    queryKey: ['/api/admin/csv/uploads'],
  });

  // File upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('csvFile', file);
      
      const response = await fetch('/api/admin/csv/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Upload Successful",
        description: `${data.message}. Imported ${data.gamesImported || 0} games.`,
      });
      setSelectedFile(null);
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
      // Refresh upload history
      queryClient.invalidateQueries({ queryKey: ['/api/admin/csv/uploads'] });
      queryClient.invalidateQueries({ queryKey: ['/api/games'] });
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload CSV file",
        variant: "destructive",
      });
      setIsUploading(false);
      setUploadProgress(0);
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'text/csv' && !file.name.toLowerCase().endsWith('.csv')) {
        toast({
          title: "Invalid File Type",
          description: "Please select a CSV file",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = () => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    // Simulate progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 10;
      });
    }, 500);

    uploadMutation.mutate(selectedFile);
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const supportedFormats = [
    { format: 'RVC Master Schedule', description: 'Matrix format with dates and teams (like "Updated RVC Master Schedule - GBB 25-26.csv")', example: 'GBB, Volleyball, Soccer, etc.' },
    { format: 'Standard CSV', description: 'Canonical format with columns: season, sport, level, date, home_school, away_school', example: 'season,sport,level,date,start_time,home_school,away_school,site' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">CSV Schedule Upload</h3>
        <p className="text-sm text-gray-600">
          Upload your RVC Master Schedule CSV files to automatically import games and maintain your season schedules.
        </p>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Upload className="h-5 w-5 mr-2" />
            Upload Schedule CSV
          </CardTitle>
          <CardDescription>
            Select your RVC Master Schedule CSV file to import games
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!selectedFile ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <div className="space-y-2">
                <Button onClick={() => fileInputRef.current?.click()} className="bg-conference-navy hover:bg-blue-800">
                  <Upload className="h-4 w-4 mr-2" />
                  Select CSV File
                </Button>
                <p className="text-sm text-gray-500">
                  Choose your RVC Master Schedule CSV file
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="h-6 w-6 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900">{selectedFile.name}</p>
                    <p className="text-sm text-gray-600">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {!isUploading && (
                    <Button
                      onClick={clearSelectedFile}
                      variant="outline"
                      size="sm"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Processing CSV...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                </div>
              )}

              <Button 
                onClick={handleUpload}
                disabled={isUploading || uploadMutation.isPending}
                className="w-full bg-conference-navy hover:bg-blue-800"
              >
                {isUploading ? "Processing..." : "Upload & Import Games"}
              </Button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
          />
        </CardContent>
      </Card>

      {/* Supported Formats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Info className="h-5 w-5 mr-2" />
            Supported CSV Formats
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {supportedFormats.map((format, index) => (
            <div key={index} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">{format.format}</h4>
                <Badge variant="outline" className="text-blue-600">Supported</Badge>
              </div>
              <p className="text-sm text-gray-600 mb-2">{format.description}</p>
              <p className="text-xs text-gray-500">
                <strong>Example:</strong> {format.example}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Upload History */}
      {csvUploads && csvUploads.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Uploads</CardTitle>
            <CardDescription>History of CSV schedule uploads</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Filename</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Games Imported</TableHead>
                  <TableHead>Sports</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {csvUploads.map((upload) => (
                  <TableRow key={upload.id}>
                    <TableCell className="font-medium">{upload.filename}</TableCell>
                    <TableCell>{new Date(upload.uploadDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant={
                        upload.status === 'completed' ? 'default' :
                        upload.status === 'processing' ? 'secondary' : 'destructive'
                      }>
                        {upload.status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                        {upload.status === 'processing' && <Clock className="h-3 w-3 mr-1" />}
                        {upload.status === 'failed' && <AlertCircle className="h-3 w-3 mr-1" />}
                        {upload.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{upload.gamesImported}</TableCell>
                    <TableCell>
                      {JSON.parse(upload.sportsIncluded || '[]').join(', ')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>How it works:</strong> Upload your RVC Master Schedule CSV file and the system will automatically detect the format, 
          parse games, and import them into the conference schedule. Duplicate games are automatically detected and skipped.
        </AlertDescription>
      </Alert>
    </div>
  );
}