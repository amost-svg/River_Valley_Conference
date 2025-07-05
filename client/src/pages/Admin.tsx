import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, ExternalLink, MapPin, Phone, Mail, User, Building, Trophy, Calendar, Save, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { School, InsertSchool } from "@shared/schema";

const emptySchool: InsertSchool = {
  name: "",
  mascot: "",
  address: "",
  city: "",
  state: "",
  phoneNumber: "",
  superintendentName: "",
  principalName: "",
  athleticDirectorName: "",
  website: "",
  athleticWebsite: "",
  ihsaPageLink: "",
  missionStatement: "",
  imageUrl: "",
  liveStreamingUrl: "",
  liveStreamingPlatform: "",
  latitude: "",
  longitude: ""
};

export default function Admin() {
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [newSchool, setNewSchool] = useState<InsertSchool>(emptySchool);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: schools, isLoading } = useQuery({
    queryKey: ['/api/schools'],
    queryFn: () => apiRequest({ url: '/api/schools' })
  });

  const createMutation = useMutation({
    mutationFn: (school: InsertSchool) => apiRequest({
      url: '/api/admin/schools',
      method: 'POST',
      data: school
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/schools'] });
      setNewSchool(emptySchool);
      setIsAddDialogOpen(false);
      toast({
        title: "Success",
        description: "School created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create school",
        variant: "destructive",
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, school }: { id: number; school: InsertSchool }) => apiRequest({
      url: `/api/admin/schools/${id}`,
      method: 'PUT',
      data: school
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/schools'] });
      setEditingSchool(null);
      setIsEditDialogOpen(false);
      toast({
        title: "Success",
        description: "School updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update school",
        variant: "destructive",
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest({
      url: `/api/admin/schools/${id}`,
      method: 'DELETE'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/schools'] });
      toast({
        title: "Success",
        description: "School deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete school",
        variant: "destructive",
      });
    }
  });

  const handleCreateSchool = () => {
    createMutation.mutate(newSchool);
  };

  const handleUpdateSchool = () => {
    if (editingSchool) {
      updateMutation.mutate({ 
        id: editingSchool.id, 
        school: {
          name: editingSchool.name,
          mascot: editingSchool.mascot,
          address: editingSchool.address,
          city: editingSchool.city,
          state: editingSchool.state,
          phoneNumber: editingSchool.phoneNumber,
          superintendentName: editingSchool.superintendentName,
          principalName: editingSchool.principalName,
          athleticDirectorName: editingSchool.athleticDirectorName,
          website: editingSchool.website,
          athleticWebsite: editingSchool.athleticWebsite,
          ihsaPageLink: editingSchool.ihsaPageLink,
          missionStatement: editingSchool.missionStatement,
          imageUrl: editingSchool.imageUrl,
          liveStreamingUrl: editingSchool.liveStreamingUrl,
          liveStreamingPlatform: editingSchool.liveStreamingPlatform,
          latitude: editingSchool.latitude,
          longitude: editingSchool.longitude
        }
      });
    }
  };

  const handleDeleteSchool = (id: number) => {
    if (confirm('Are you sure you want to delete this school?')) {
      deleteMutation.mutate(id);
    }
  };

  const renderSchoolForm = (school: InsertSchool | School, onChange: (field: string, value: string) => void) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="name">School Name</Label>
        <Input
          id="name"
          value={school.name}
          onChange={(e) => onChange('name', e.target.value)}
          placeholder="Enter school name"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="mascot">Mascot</Label>
        <Input
          id="mascot"
          value={school.mascot}
          onChange={(e) => onChange('mascot', e.target.value)}
          placeholder="Enter mascot name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          value={school.address}
          onChange={(e) => onChange('address', e.target.value)}
          placeholder="Enter school address"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="city">City</Label>
        <Input
          id="city"
          value={school.city || ''}
          onChange={(e) => onChange('city', e.target.value)}
          placeholder="Enter city"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="state">State</Label>
        <Input
          id="state"
          value={school.state || ''}
          onChange={(e) => onChange('state', e.target.value)}
          placeholder="Enter state"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phoneNumber">Phone Number</Label>
        <Input
          id="phoneNumber"
          value={school.phoneNumber || ''}
          onChange={(e) => onChange('phoneNumber', e.target.value)}
          placeholder="Enter phone number"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="superintendentName">Superintendent</Label>
        <Input
          id="superintendentName"
          value={school.superintendentName || ''}
          onChange={(e) => onChange('superintendentName', e.target.value)}
          placeholder="Enter superintendent name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="principalName">Principal</Label>
        <Input
          id="principalName"
          value={school.principalName || ''}
          onChange={(e) => onChange('principalName', e.target.value)}
          placeholder="Enter principal name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="athleticDirectorName">Athletic Director</Label>
        <Input
          id="athleticDirectorName"
          value={school.athleticDirectorName || ''}
          onChange={(e) => onChange('athleticDirectorName', e.target.value)}
          placeholder="Enter athletic director name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="website">Website</Label>
        <Input
          id="website"
          value={school.website || ''}
          onChange={(e) => onChange('website', e.target.value)}
          placeholder="Enter website URL"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="athleticWebsite">Athletic Website</Label>
        <Input
          id="athleticWebsite"
          value={school.athleticWebsite || ''}
          onChange={(e) => onChange('athleticWebsite', e.target.value)}
          placeholder="Enter athletic website URL"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ihsaPageLink">IHSA Page Link</Label>
        <Input
          id="ihsaPageLink"
          value={school.ihsaPageLink || ''}
          onChange={(e) => onChange('ihsaPageLink', e.target.value)}
          placeholder="Enter IHSA page URL"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="imageUrl">Image URL</Label>
        <Input
          id="imageUrl"
          value={school.imageUrl || ''}
          onChange={(e) => onChange('imageUrl', e.target.value)}
          placeholder="Enter image URL"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="liveStreamingUrl">Live Streaming URL</Label>
        <Input
          id="liveStreamingUrl"
          value={school.liveStreamingUrl || ''}
          onChange={(e) => onChange('liveStreamingUrl', e.target.value)}
          placeholder="Enter live streaming URL"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="liveStreamingPlatform">Live Streaming Platform</Label>
        <Input
          id="liveStreamingPlatform"
          value={school.liveStreamingPlatform || ''}
          onChange={(e) => onChange('liveStreamingPlatform', e.target.value)}
          placeholder="Enter streaming platform"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="latitude">Latitude</Label>
        <Input
          id="latitude"
          value={school.latitude || ''}
          onChange={(e) => onChange('latitude', e.target.value)}
          placeholder="Enter latitude"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="longitude">Longitude</Label>
        <Input
          id="longitude"
          value={school.longitude || ''}
          onChange={(e) => onChange('longitude', e.target.value)}
          placeholder="Enter longitude"
        />
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="missionStatement">Mission Statement</Label>
        <Textarea
          id="missionStatement"
          value={school.missionStatement || ''}
          onChange={(e) => onChange('missionStatement', e.target.value)}
          placeholder="Enter mission statement"
          rows={3}
        />
      </div>
    </div>
  );

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading schools...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">School Administration</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add New School
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New School</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {renderSchoolForm(newSchool, (field, value) => 
                setNewSchool({ ...newSchool, [field]: value })
              )}
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button onClick={handleCreateSchool} disabled={createMutation.isPending}>
                  <Save className="mr-2 h-4 w-4" />
                  {createMutation.isPending ? 'Creating...' : 'Create School'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {schools?.map((school) => (
          <Card key={school.id} className="w-full">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">{school.name}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <Trophy className="h-4 w-4" />
                    {school.mascot}
                    {school.city && school.state && (
                      <>
                        <MapPin className="h-4 w-4 ml-2" />
                        {school.city}, {school.state}
                      </>
                    )}
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setEditingSchool(school)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Edit School</DialogTitle>
                      </DialogHeader>
                      {editingSchool && (
                        <div className="space-y-4">
                          {renderSchoolForm(editingSchool, (field, value) => 
                            setEditingSchool({ ...editingSchool, [field]: value })
                          )}
                          <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                              <X className="mr-2 h-4 w-4" />
                              Cancel
                            </Button>
                            <Button onClick={handleUpdateSchool} disabled={updateMutation.isPending}>
                              <Save className="mr-2 h-4 w-4" />
                              {updateMutation.isPending ? 'Updating...' : 'Update School'}
                            </Button>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleDeleteSchool(school.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {school.phoneNumber && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{school.phoneNumber}</span>
                  </div>
                )}
                {school.superintendentName && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">Superintendent: {school.superintendentName}</span>
                  </div>
                )}
                {school.principalName && (
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">Principal: {school.principalName}</span>
                  </div>
                )}
                {school.athleticDirectorName && (
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">Athletic Director: {school.athleticDirectorName}</span>
                  </div>
                )}
                {school.website && (
                  <div className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4 text-gray-500" />
                    <a href={school.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                      Website
                    </a>
                  </div>
                )}
                {school.athleticWebsite && (
                  <div className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4 text-gray-500" />
                    <a href={school.athleticWebsite} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                      Athletic Website
                    </a>
                  </div>
                )}
                {school.liveStreamingUrl && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">
                      Live Streaming: {school.liveStreamingPlatform}
                    </span>
                  </div>
                )}
              </div>
              {school.missionStatement && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-sm mb-2">Mission Statement:</h4>
                  <p className="text-sm text-gray-700">{school.missionStatement}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}