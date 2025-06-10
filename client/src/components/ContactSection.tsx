import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertContactSchema } from "@shared/schema";

const contactFormSchema = insertContactSchema.extend({
  subject: z.string().min(1, "Please select a subject"),
});

type ContactFormData = z.infer<typeof contactFormSchema>;

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

  const contactMutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      return apiRequest("POST", "/api/contact", data);
    },
    onSuccess: () => {
      toast({
        title: "Message Sent",
        description: "Thank you for your message! We will get back to you soon.",
      });
      form.reset();
    },
    onError: (error) => {
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
      icon: MapPin,
      title: "Address",
      content: "123 Conference Drive\nRiver Valley, IL 62025",
      bgColor: "bg-conference-navy"
    },
    {
      icon: Phone,
      title: "Phone",
      content: "(618) 555-0123",
      bgColor: "bg-conference-gold"
    },
    {
      icon: Mail,
      title: "Email",
      content: "info@rivervalleyconference.org",
      bgColor: "bg-conference-green"
    },
    {
      icon: Clock,
      title: "Office Hours",
      content: "Monday - Friday: 8:00 AM - 5:00 PM\nSaturday: 9:00 AM - 1:00 PM",
      bgColor: "bg-blue-500"
    }
  ];

  const personnel = [
    { title: "Commissioner", name: "Sarah Johnson" },
    { title: "Assistant Commissioner", name: "Mike Davis" },
    { title: "Athletic Director Liaison", name: "Jennifer Martinez" },
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

            {/* Key Personnel */}
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4 text-gray-900">Key Personnel</h3>
              <div className="space-y-3">
                {personnel.map((person, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="font-medium">{person.title}</span>
                    <span className="text-gray-600">{person.name}</span>
                  </div>
                ))}
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
                          <Input placeholder="Your school or organization" {...field} />
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
