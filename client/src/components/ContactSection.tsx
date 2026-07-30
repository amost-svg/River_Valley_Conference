import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Phone, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { publicInsertRows, publicSelect } from "@/lib/rvcData";

const contactFormSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name").max(120),
  email: z.string().trim().email("Please enter a valid email address").max(254),
  school: z.string().trim().max(160).optional(),
  subject: z.string()
    .min(1, "Please select a subject")
    .refine((value) => ["schedules", "membership", "rules", "general", "other"].includes(value), "Please select a valid subject"),
  message: z.string().trim().min(10, "Please provide a little more detail").max(4_000),
});

type ContactFormData = z.infer<typeof contactFormSchema>;
interface ConferenceOfficial {
  id: string;
  full_name: string;
  position: string;
  school: { name: string } | null;
}

export default function ContactSection() {
  const { toast } = useToast();
  
  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      school: "",
      subject: "",
      message: "",
    },
  });

  // Fetch conference officials from database
  const { data: conferenceOfficials, isLoading: officialsLoading } = useQuery({
    queryKey: ["public-conference-officials"],
    queryFn: () => publicSelect<ConferenceOfficial[]>(
      "conference_officials?is_active=eq.true&select=id,full_name,position,school:schools(name)&order=display_order.asc",
    ),
    staleTime: 5 * 60_000,
  });

  const contactMutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      return publicInsertRows("contact_submissions", {
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        school: data.school?.trim() || null,
        subject: data.subject,
        message: data.message.trim(),
        status: "new",
      });
    },
    onSuccess: () => {
      toast({
        title: "Message Sent",
        description: "Thank you for your message! We will get back to you soon.",
      });
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ContactFormData) => {
    contactMutation.mutate(data);
  };

  const contactInfo = [
    {
      icon: Phone,
      title: "General Conference Information",
      content: "Contact your school's Athletic Director or Principal for conference-related inquiries",
      bgColor: "bg-conference-navy"
    },
    {
      icon: MapPin,
      title: "River Valley Conference",
      content: "Serving schools throughout central Illinois with excellence in high school athletics",
      bgColor: "bg-conference-green"
    }
  ];

  return (
    <section id="contact" className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Contact Us</h2>
          <p className="text-lg text-gray-600">Get in touch with conference administration</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div>
            <h3 className="text-2xl font-semibold mb-6 text-gray-900">Conference Information</h3>
            
            <div className="space-y-4">
              {contactInfo.map((info, index) => {
                const Icon = info.icon;
                return (
                  <div key={index} className="flex items-start">
                    <div className={`${info.bgColor} text-white p-3 rounded-lg mr-4 flex-shrink-0`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{info.title}</h4>
                      <p className="text-gray-600 whitespace-pre-line">{info.content}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Conference Officials */}
            <div className="mt-8">
              <h4 className="text-lg font-semibold mb-4 text-gray-900">Conference Officials</h4>
              <div className="space-y-3">
                {officialsLoading
                  ? Array.from({ length: 4 }).map((_, index) => (
                      <div key={index} className="flex items-center">
                        <Skeleton className="h-8 w-8 rounded-lg mr-3" />
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-32" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                    ))
                  : conferenceOfficials?.map((official) => (
                      <div key={official.id} className="flex items-center">
                        <div className="bg-conference-green text-white p-2 rounded-lg mr-3 flex-shrink-0">
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{official.position}</p>
                          <p className="text-gray-600">{official.full_name}</p>
                          {official.school?.name && <p className="text-sm text-gray-500">{official.school.name}</p>}
                        </div>
                      </div>
                    ))
                }
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <Card className="shadow-md">
            <CardContent className="p-8">
              <h3 className="text-2xl font-semibold mb-6 text-gray-900">Send a Message</h3>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="your.email@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="school"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>School/Organization</FormLabel>
                        <FormControl>
                          <Input placeholder="Your school or organization" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a subject" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="schedules">Schedules & Results</SelectItem>
                            <SelectItem value="membership">Membership Inquiry</SelectItem>
                            <SelectItem value="rules">Rules & Regulations</SelectItem>
                            <SelectItem value="general">General Question</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Please provide details about your inquiry..."
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full bg-conference-navy text-white hover:bg-blue-800 py-3 text-lg font-semibold"
                    disabled={contactMutation.isPending}
                  >
                    {contactMutation.isPending ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
