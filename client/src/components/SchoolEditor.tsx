import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Building2,
  ExternalLink,
  Globe,
  ImageIcon,
  MapPin,
  Pencil,
  Phone,
  Play,
  Save,
  ShieldCheck,
  Trophy,
  Upload,
  Users,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  formatSchoolAddress,
  getSchoolLogoUrl,
  listPublicSchools,
  type SchoolProfile,
  type SchoolProfileUpdate,
  updateSchoolProfile,
  uploadSchoolLogoFile,
} from "@/lib/schoolDirectory";

const optionalUrl = z
  .string()
  .trim()
  .refine((value) => !value || /^https?:\/\//i.test(value), "Use a complete http:// or https:// address.");

const schoolEditSchema = z.object({
  name: z.string().trim().min(1, "School name is required."),
  short_name: z.string().trim().optional(),
  mascot: z.string().trim().optional(),
  address_line1: z.string().trim().optional(),
  address_line2: z.string().trim().optional(),
  city: z.string().trim().optional(),
  state: z.string().trim().max(2, "Use the two-letter state abbreviation.").optional(),
  postal_code: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  superintendent_name: z.string().trim().optional(),
  principal_name: z.string().trim().optional(),
  athletic_director_name: z.string().trim().optional(),
  website_url: optionalUrl,
  athletics_url: optionalUrl,
  ihsa_url: optionalUrl,
  livestream_url: optionalUrl,
  livestream_platform: z.string().trim().optional(),
  mission_statement: z.string().trim().max(2000, "Keep the mission statement under 2,000 characters.").optional(),
});

type SchoolEditFormData = z.infer<typeof schoolEditSchema>;

function formDefaults(school?: SchoolProfile): SchoolEditFormData {
  return {
    name: school?.name ?? "",
    short_name: school?.short_name ?? "",
    mascot: school?.mascot ?? "",
    address_line1: school?.address_line1 ?? "",
    address_line2: school?.address_line2 ?? "",
    city: school?.city ?? "",
    state: school?.state ?? "IL",
    postal_code: school?.postal_code ?? "",
    phone: school?.phone ?? "",
    superintendent_name: school?.superintendent_name ?? "",
    principal_name: school?.principal_name ?? "",
    athletic_director_name: school?.athletic_director_name ?? "",
    website_url: school?.website_url ?? "",
    athletics_url: school?.athletics_url ?? "",
    ihsa_url: school?.ihsa_url ?? "",
    livestream_url: school?.livestream_url ?? "",
    livestream_platform: school?.livestream_platform ?? "",
    mission_statement: school?.mission_statement ?? "",
  };
}

function emptyToNull(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function linkButton(url: string | null, label: string, icon: React.ReactNode) {
  if (!url) return null;
  return (
    <Button variant="outline" size="sm" asChild>
      <a href={url} target="_blank" rel="noopener noreferrer">
        {icon}
        {label}
        <ExternalLink className="ml-1 h-3.5 w-3.5" />
      </a>
    </Button>
  );
}

export default function SchoolEditor() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const schoolsQuery = useQuery({
    queryKey: ["supabase", "schools"],
    queryFn: listPublicSchools,
  });

  useEffect(() => {
    if (user?.schoolId && !selectedSchoolId) setSelectedSchoolId(String(user.schoolId));
  }, [selectedSchoolId, user?.schoolId]);

  useEffect(() => {
    if (!selectedSchoolId && user?.isSuperAdmin && schoolsQuery.data?.[0]) {
      setSelectedSchoolId(schoolsQuery.data[0].id);
    }
  }, [schoolsQuery.data, selectedSchoolId, user?.isSuperAdmin]);

  const school = useMemo(
    () => schoolsQuery.data?.find((item) => item.id === selectedSchoolId),
    [schoolsQuery.data, selectedSchoolId],
  );

  const form = useForm<SchoolEditFormData>({
    resolver: zodResolver(schoolEditSchema),
    defaultValues: formDefaults(),
  });

  useEffect(() => {
    form.reset(formDefaults(school));
    setLogoFile(null);
  }, [form, school]);

  const updateMutation = useMutation({
    mutationFn: async (data: SchoolEditFormData) => {
      if (!school) throw new Error("Select a school before saving.");

      let logoPath = school.logo_path;
      if (logoFile) logoPath = await uploadSchoolLogoFile(school, logoFile);

      const changes: SchoolProfileUpdate = {
        name: data.name.trim(),
        short_name: emptyToNull(data.short_name),
        mascot: emptyToNull(data.mascot),
        address_line1: emptyToNull(data.address_line1),
        address_line2: emptyToNull(data.address_line2),
        city: emptyToNull(data.city),
        state: emptyToNull(data.state)?.toUpperCase() ?? "IL",
        postal_code: emptyToNull(data.postal_code),
        phone: emptyToNull(data.phone),
        superintendent_name: emptyToNull(data.superintendent_name),
        principal_name: emptyToNull(data.principal_name),
        athletic_director_name: emptyToNull(data.athletic_director_name),
        website_url: emptyToNull(data.website_url),
        athletics_url: emptyToNull(data.athletics_url),
        ihsa_url: emptyToNull(data.ihsa_url),
        livestream_url: emptyToNull(data.livestream_url),
        livestream_platform: emptyToNull(data.livestream_platform),
        mission_statement: emptyToNull(data.mission_statement),
        logo_path: logoPath,
      };

      return updateSchoolProfile(school.id, changes);
    },
    onSuccess: async (updatedSchool) => {
      queryClient.setQueryData<SchoolProfile[]>(["supabase", "schools"], (current) =>
        current?.map((item) => (item.id === updatedSchool.id ? updatedSchool : item)),
      );
      await queryClient.invalidateQueries({ queryKey: ["supabase", "school", updatedSchool.slug] });
      setIsEditDialogOpen(false);
      setLogoFile(null);
      toast({
        title: "School profile updated",
        description: "The public school page now reflects these changes.",
      });
    },
    onError: (error: unknown) => {
      toast({
        title: "Unable to update the school profile",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  if (authLoading || schoolsQuery.isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="h-32 animate-pulse rounded-lg bg-muted" />
        </CardContent>
      </Card>
    );
  }

  if (schoolsQuery.error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {schoolsQuery.error instanceof Error ? schoolsQuery.error.message : "Unable to load school information."}
        </AlertDescription>
      </Alert>
    );
  }

  if (!user?.schoolId && !user?.isSuperAdmin) {
    return (
      <Alert>
        <ShieldCheck className="h-4 w-4" />
        <AlertDescription>
          Your account is signed in, but it has not yet been assigned to an RVC school. A conference administrator must add a school membership before you can edit a profile.
        </AlertDescription>
      </Alert>
    );
  }

  if (!school) {
    return (
      <Alert>
        <AlertDescription>Select a school to view and update its profile.</AlertDescription>
      </Alert>
    );
  }

  const logoUrl = getSchoolLogoUrl(school.logo_path, school.slug);
  const fullAddress = formatSchoolAddress(school);

  return (
    <div className="space-y-4">
      {user.isSuperAdmin && schoolsQuery.data && (
        <Card>
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <p className="font-medium">Conference administrator view</p>
              <p className="text-sm text-muted-foreground">Choose any member school to review or update its public profile.</p>
            </div>
            <Select value={selectedSchoolId ?? undefined} onValueChange={setSelectedSchoolId}>
              <SelectTrigger className="w-full sm:w-72">
                <SelectValue placeholder="Select a school" />
              </SelectTrigger>
              <SelectContent>
                {schoolsQuery.data.map((item) => (
                  <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted">
                {logoUrl ? (
                  <img src={logoUrl} alt={`${school.name} logo`} className="h-full w-full object-contain p-2" />
                ) : (
                  <Building2 className="h-9 w-9 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0">
                <CardTitle className="text-2xl">{school.name}</CardTitle>
                <CardDescription className="mt-1">
                  {[school.mascot, school.city && school.state ? `${school.city}, ${school.state}` : null]
                    .filter(Boolean)
                    .join(" • ")}
                </CardDescription>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="secondary">Public profile</Badge>
                  <Badge variant="outline">Schools control their own information</Badge>
                </div>
              </div>
            </div>

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-conference-navy hover:bg-blue-800">
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit school profile
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit {school.name}</DialogTitle>
                </DialogHeader>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit((data) => updateMutation.mutate(data))} className="space-y-6">
                    <section className="space-y-4">
                      <div>
                        <h3 className="font-semibold text-conference-navy">School identity</h3>
                        <p className="text-sm text-muted-foreground">The school name, mascot, and logo used throughout the public RVC site.</p>
                      </div>
                      <div className="grid gap-4 md:grid-cols-3">
                        <FormField control={form.control} name="name" render={({ field }) => (
                          <FormItem className="md:col-span-2"><FormLabel>School name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="short_name" render={({ field }) => (
                          <FormItem><FormLabel>Short name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="mascot" render={({ field }) => (
                          <FormItem><FormLabel>Mascot / team name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="school-logo">School logo</Label>
                          <Input
                            id="school-logo"
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/svg+xml"
                            onChange={(event) => setLogoFile(event.target.files?.[0] ?? null)}
                          />
                          <p className="text-xs text-muted-foreground">PNG, JPG, WEBP, or SVG; maximum 5 MB.</p>
                        </div>
                      </div>
                    </section>

                    <Separator />

                    <section className="space-y-4">
                      <div>
                        <h3 className="font-semibold text-conference-navy">Contact information</h3>
                        <p className="text-sm text-muted-foreground">The address and main phone number shown on the public school page.</p>
                      </div>
                      <div className="grid gap-4 md:grid-cols-6">
                        <FormField control={form.control} name="address_line1" render={({ field }) => (
                          <FormItem className="md:col-span-4"><FormLabel>Street address</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="address_line2" render={({ field }) => (
                          <FormItem className="md:col-span-2"><FormLabel>Address line 2</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="city" render={({ field }) => (
                          <FormItem className="md:col-span-2"><FormLabel>City</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="state" render={({ field }) => (
                          <FormItem><FormLabel>State</FormLabel><FormControl><Input maxLength={2} {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="postal_code" render={({ field }) => (
                          <FormItem><FormLabel>ZIP code</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="phone" render={({ field }) => (
                          <FormItem className="md:col-span-2"><FormLabel>Main phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                      </div>
                    </section>

                    <Separator />

                    <section className="space-y-4">
                      <div>
                        <h3 className="font-semibold text-conference-navy">Leadership</h3>
                        <p className="text-sm text-muted-foreground">Keep these names current when school leadership changes.</p>
                      </div>
                      <div className="grid gap-4 md:grid-cols-3">
                        <FormField control={form.control} name="superintendent_name" render={({ field }) => (
                          <FormItem><FormLabel>Superintendent</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="principal_name" render={({ field }) => (
                          <FormItem><FormLabel>Principal</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="athletic_director_name" render={({ field }) => (
                          <FormItem><FormLabel>Athletic director</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                      </div>
                    </section>

                    <Separator />

                    <section className="space-y-4">
                      <div>
                        <h3 className="font-semibold text-conference-navy">Websites and streaming</h3>
                        <p className="text-sm text-muted-foreground">These become public buttons on the school profile.</p>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField control={form.control} name="website_url" render={({ field }) => (
                          <FormItem><FormLabel>School website</FormLabel><FormControl><Input placeholder="https://..." {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="athletics_url" render={({ field }) => (
                          <FormItem><FormLabel>Athletics / schedule website</FormLabel><FormControl><Input placeholder="https://..." {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="ihsa_url" render={({ field }) => (
                          <FormItem><FormLabel>IHSA school page</FormLabel><FormControl><Input placeholder="https://www.ihsa.org/..." {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="livestream_platform" render={({ field }) => (
                          <FormItem><FormLabel>Streaming platform</FormLabel><FormControl><Input placeholder="YouTube, NFHS Network, Facebook..." {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="livestream_url" render={({ field }) => (
                          <FormItem className="md:col-span-2"><FormLabel>Livestream page</FormLabel><FormControl><Input placeholder="https://..." {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                      </div>
                    </section>

                    <Separator />

                    <FormField control={form.control} name="mission_statement" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mission statement or school description</FormLabel>
                        <FormControl><Textarea rows={5} {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                      <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                      <Button type="submit" disabled={updateMutation.isPending}>
                        {logoFile ? <Upload className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                        {updateMutation.isPending ? "Publishing changes…" : "Save and publish"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex gap-3 rounded-lg border p-4"><Trophy className="mt-0.5 h-5 w-5 text-conference-gold" /><div><p className="text-sm text-muted-foreground">Mascot</p><p className="font-medium">{school.mascot || "Not provided"}</p></div></div>
            <div className="flex gap-3 rounded-lg border p-4"><MapPin className="mt-0.5 h-5 w-5 text-conference-navy" /><div><p className="text-sm text-muted-foreground">Address</p><p className="font-medium">{fullAddress || "Not provided"}</p></div></div>
            <div className="flex gap-3 rounded-lg border p-4"><Phone className="mt-0.5 h-5 w-5 text-conference-navy" /><div><p className="text-sm text-muted-foreground">Main phone</p><p className="font-medium">{school.phone || "Not provided"}</p></div></div>
          </div>

          <div>
            <h3 className="mb-3 flex items-center gap-2 font-semibold text-conference-navy"><Users className="h-4 w-4" />Leadership</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div><p className="text-sm text-muted-foreground">Superintendent</p><p className="font-medium">{school.superintendent_name || "Not provided"}</p></div>
              <div><p className="text-sm text-muted-foreground">Principal</p><p className="font-medium">{school.principal_name || "Not provided"}</p></div>
              <div><p className="text-sm text-muted-foreground">Athletic director</p><p className="font-medium">{school.athletic_director_name || "Not provided"}</p></div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="mb-3 flex items-center gap-2 font-semibold text-conference-navy"><Globe className="h-4 w-4" />Public links</h3>
            <div className="flex flex-wrap gap-2">
              {linkButton(school.website_url, "School website", <Globe className="mr-2 h-4 w-4" />)}
              {linkButton(school.athletics_url, "Athletics", <Trophy className="mr-2 h-4 w-4" />)}
              {linkButton(school.ihsa_url, "IHSA profile", <ShieldCheck className="mr-2 h-4 w-4" />)}
              {linkButton(school.livestream_url, school.livestream_platform || "Livestream", <Play className="mr-2 h-4 w-4" />)}
            </div>
          </div>

          {school.mission_statement && (
            <>
              <Separator />
              <div>
                <h3 className="mb-2 font-semibold text-conference-navy">Mission statement</h3>
                <p className="leading-relaxed text-muted-foreground">{school.mission_statement}</p>
              </div>
            </>
          )}

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ImageIcon className="h-3.5 w-3.5" />
            Last updated {new Date(school.updated_at).toLocaleDateString()}. Changes are recorded in the RVC audit log.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
