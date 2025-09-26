import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { insertLeadSchema, type InsertLead } from "@shared/schema";
import { z } from "zod";

interface ContactSalesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Extend insertLeadSchema with contact sales specific fields
const contactSalesFormSchema = insertLeadSchema.extend({
  message: z.string().optional(),
  contactPreference: z.enum(["email", "phone"]).default("email"),
  bestTimeToContact: z.string().optional(),
}).refine(
  (data) => {
    // If contact preference is phone, phone number should be provided
    if (data.contactPreference === "phone" && !data.phone) {
      return false;
    }
    return true;
  },
  {
    message: "Phone number is required when phone contact is preferred",
    path: ["phone"],
  }
);

type ContactSalesFormData = z.infer<typeof contactSalesFormSchema>;

export default function ContactSalesModal({ open, onOpenChange }: ContactSalesModalProps) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ContactSalesFormData>({
    resolver: zodResolver(contactSalesFormSchema),
    defaultValues: {
      company: "",
      contactName: "",
      email: "",
      phone: "",
      address: "",
      naics: undefined,
      utility: "",
      measure: "Sales Inquiry",
      sqft: undefined,
      hours: undefined,
      baselineDesc: "",
      utmJson: {},
      status: "new",
      message: "",
      contactPreference: "email",
      bestTimeToContact: "",
    },
  });

  const createLeadMutation = useMutation({
    mutationFn: api.createLead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/leads"] });
      setShowConfirmation(true);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to submit your contact request. Please try again.",
        variant: "destructive",
      });
      console.error("Error creating lead:", error);
    },
  });

  const handleSubmit = (data: ContactSalesFormData) => {
    const { message, contactPreference, bestTimeToContact, ...leadFields } = data;
    
    const leadData: InsertLead = {
      ...leadFields,
      baselineDesc: [
        `Contact request from ${data.company}`,
        `Contact preference: ${contactPreference}`,
        bestTimeToContact && `Best time to contact: ${bestTimeToContact}`,
        message && `Message: ${message}`,
      ].filter(Boolean).join(" | "),
      utmJson: {
        source: "contact_sales",
        contactPreference,
        bestTime: bestTimeToContact,
      },
    };

    createLeadMutation.mutate(leadData);
  };

  const handleConfirmationClose = () => {
    setShowConfirmation(false);
    form.reset();
    onOpenChange(false);
  };

  // Handle modal close/reset when opened
  const handleModalOpenChange = (newOpen: boolean) => {
    if (!newOpen && !showConfirmation) {
      form.reset();
    }
    onOpenChange(newOpen);
  };

  return (
    <>
      {/* Main Contact Sales Modal */}
      <Dialog open={open && !showConfirmation} onOpenChange={handleModalOpenChange}>
        <DialogContent className="sm:max-w-lg" data-testid="contact-sales-modal">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Contact Our Sales Team
            </DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              {/* Company and Contact Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name *</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-company-sales" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contactName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Name *</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-contact-name-sales" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address *</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} data-testid="input-email-sales" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input type="tel" {...field} value={field.value || ""} data-testid="input-phone-sales" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Message */}
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>How can we help you?</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Tell us about your energy efficiency goals, facility details, or any specific questions you have..."
                        rows={3}
                        data-testid="input-message-sales"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Contact Preference */}
              <FormField
                control={form.control}
                name="contactPreference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>How would you prefer to be contacted? *</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="flex flex-row space-x-6 mt-2"
                        data-testid="radio-contact-preference-sales"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="email" id="email-pref-sales" />
                          <Label htmlFor="email-pref-sales">Email</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="phone" id="phone-pref-sales" />
                          <Label htmlFor="phone-pref-sales">Phone</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Best Time to Contact */}
              <FormField
                control={form.control}
                name="bestTimeToContact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Best Time to Contact</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., Weekday afternoons, any time, mornings only"
                        data-testid="input-best-time-sales"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={createLeadMutation.isPending}
                className="w-full"
                data-testid="button-submit-contact-sales"
              >
                {createLeadMutation.isPending ? "Sending Request..." : "Contact Sales Team"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Confirmation Popup */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="sm:max-w-md" data-testid="contact-sales-confirmation">
          <DialogHeader>
            <DialogTitle>Thank You!</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Thanks for wanting to learn more about energy efficiency incentives for your facility. We will get back to you lickety split.</p>
            <Button onClick={handleConfirmationClose} className="w-full">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}