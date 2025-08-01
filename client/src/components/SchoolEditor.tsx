import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Edit, 
  School as SchoolIcon, 
  MapPin, 
  Phone, 
  Globe, 
  Users,
  Save,
  X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { School } from "@shared/schema";
import { insertSchoolSchema } from "@shared/schema";

// Mock current user data - in production this would come from auth context
const mockCurrentUser = {
  id: 1,
  email: "jon.chappell@gracecrusaders.org",
  name: "Jon Chappell",
  role: "AD",
  schoolId: 5, // Grace Christian Academy
  schoolName: "Grace Christian Academy"
};

const schoolEditSchema = insertSchoolSchema.extend({
  name: z.string().min(1, "School name is required"),
  mascot: z.string().min(1, "Mascot is required"),
  address: z.string().min(1, "Address is required"),
});

type SchoolEditFormData = z.infer<typeof schoolEditSchema>;

export default function SchoolEditor() {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();

  // Get school data for the current user
  const { data: schools, isLoading } = useQuery<School[]>({
    queryKey: ["/api/schools"]
  });
  
  const school = schools?.find(s => s.id === mockCurrentUser.schoolId);

  const form = useForm<SchoolEditFormData>({
    resolver: zodResolver(schoolEditSchema),
    defaultValues: school || {
      name: "",
      mascot: "",
      address: "",
      city: "",
      state: "Illinois",
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
      longitude: "",
    },
  });

  // Reset form when school data loads
  React.useEffect(() => {
    if (school) {
      form.reset(school);
    }
  }, [school, form]);

  const updateSchoolMutation = useMutation({
    mutationFn: async (data: SchoolEditFormData) => {
      return apiRequest("PUT", `/api/admin/schools/${mockCurrentUser.schoolId}`, data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "School information updated successfully" });
      setIsEditDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/schools"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update school information", variant: "destructive" });
    },
  });

  const onSubmitSchoolEdit = (data: SchoolEditFormData) => {
    updateSchoolMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!school) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-gray-500">School information not found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <SchoolIcon className="h-5 w-5 mr-2" />
            {school.name} Information
          </CardTitle>
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-conference-navy hover:bg-blue-800">
                <Edit className="h-4 w-4 mr-2" />
                Edit School Info
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit {school.name} Information</DialogTitle>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmitSchoolEdit)} className="space-y-4">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-conference-navy">Basic Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>School Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="mascot"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mascot</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || "Illinois"} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phoneNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input placeholder="(555) 123-4567" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Staff Information */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-conference-navy">Staff Information</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <FormField
                        control={form.control}
                        name="superintendentName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Superintendent Name</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="principalName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Principal Name</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="athleticDirectorName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Athletic Director Name</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Web & Digital Information */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-conference-navy">Web & Digital Information</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <FormField
                        control={form.control}
                        name="website"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>School Website</FormLabel>
                            <FormControl>
                              <Input placeholder="https://school.edu" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="athleticWebsite"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Athletic Website</FormLabel>
                            <FormControl>
                              <Input placeholder="https://athletics.school.edu" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="ihsaPageLink"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>IHSA Page Link</FormLabel>
                            <FormControl>
                              <Input placeholder="https://ihsa.org/school/..." {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Live Streaming */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-conference-navy">Live Streaming</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="liveStreamingPlatform"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Streaming Platform</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select platform" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="YouTube">YouTube</SelectItem>
                                <SelectItem value="NFHS Network">NFHS Network</SelectItem>
                                <SelectItem value="Facebook Live">Facebook Live</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="liveStreamingUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Streaming URL</FormLabel>
                            <FormControl>
                              <Input placeholder="https://youtube.com/..." {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Mission Statement */}
                  <FormField
                    control={form.control}
                    name="missionStatement"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mission Statement</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter your school's mission statement..." 
                            {...field} 
                            value={field.value || ""} 
                            rows={4}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setIsEditDialogOpen(false)}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      className="bg-conference-navy hover:bg-blue-800"
                      disabled={updateSchoolMutation.isPending}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {updateSchoolMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Quick Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-conference-navy/10 rounded-lg">
                <Users className="h-5 w-5 text-conference-navy" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Mascot</p>
                <p className="font-medium">{school.mascot}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="p-2 bg-conference-navy/10 rounded-lg">
                <MapPin className="h-5 w-5 text-conference-navy" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Location</p>
                <p className="font-medium">{school.city}, {school.state}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="p-2 bg-conference-navy/10 rounded-lg">
                <Phone className="h-5 w-5 text-conference-navy" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-medium">{school.phoneNumber || "Not provided"}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Staff Information */}
          <div>
            <h3 className="font-medium text-conference-navy mb-3">Administrative Staff</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Superintendent</p>
                <p className="font-medium">{school.superintendentName || "Not provided"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Principal</p>
                <p className="font-medium">{school.principalName || "Not provided"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Athletic Director</p>
                <p className="font-medium">{school.athleticDirectorName || "Not provided"}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Digital Presence */}
          <div>
            <h3 className="font-medium text-conference-navy mb-3">Digital Presence</h3>
            <div className="space-y-2">
              {school.website && (
                <div className="flex items-center space-x-2">
                  <Globe className="h-4 w-4 text-gray-500" />
                  <a href={school.website} target="_blank" rel="noopener noreferrer" 
                     className="text-blue-600 hover:underline">
                    School Website
                  </a>
                </div>
              )}
              {school.athleticWebsite && (
                <div className="flex items-center space-x-2">
                  <Globe className="h-4 w-4 text-gray-500" />
                  <a href={school.athleticWebsite} target="_blank" rel="noopener noreferrer" 
                     className="text-blue-600 hover:underline">
                    Athletic Website
                  </a>
                </div>
              )}
              {school.liveStreamingUrl && (
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-conference-navy">
                    {school.liveStreamingPlatform}
                  </Badge>
                  <a href={school.liveStreamingUrl} target="_blank" rel="noopener noreferrer" 
                     className="text-blue-600 hover:underline">
                    Live Stream
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Mission Statement */}
          {school.missionStatement && (
            <>
              <Separator />
              <div>
                <h3 className="font-medium text-conference-navy mb-3">Mission Statement</h3>
                <p className="text-gray-700 leading-relaxed">{school.missionStatement}</p>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}