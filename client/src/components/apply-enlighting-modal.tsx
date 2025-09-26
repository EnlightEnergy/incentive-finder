import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Program, InsertLead } from "@shared/schema";

interface ApplyEnlightingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  program: Program | null;
  searchData?: {
    location?: string;
    businessType?: string;
    utility?: string;
    measures?: string[];
    sqft?: number;
    hours?: number;
  };
}

export default function ApplyEnlightingModal({ 
  open, 
  onOpenChange, 
  program, 
  searchData 
}: ApplyEnlightingModalProps) {
  const [formData, setFormData] = useState({
    company: "",
    contactName: "",
    email: "",
    phone: "",
    address: searchData?.location || "",
    businessType: searchData?.businessType || "",
    utility: searchData?.utility || "",
    squareFootage: searchData?.sqft?.toString() || "",
    operatingHours: searchData?.hours?.toString() || "",
    projectDetails: "",
    contactPreference: "email", // email or phone
    preferredTiming: "", // when they'd like to be contacted
  });

  const [showConfirmation, setShowConfirmation] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Update form data when modal opens or searchData changes
  useEffect(() => {
    if (open && searchData) {
      setFormData(prev => ({
        ...prev,
        address: searchData.location || "",
        businessType: searchData.businessType || "",
        utility: searchData.utility || "",
        squareFootage: searchData.sqft?.toString() || "",
        operatingHours: searchData.hours?.toString() || "",
      }));
    }
  }, [open, searchData]);

  // Auto-close confirmation popup after 3 seconds
  useEffect(() => {
    if (showConfirmation) {
      const timer = setTimeout(() => {
        setShowConfirmation(false);
        onOpenChange(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showConfirmation, onOpenChange]);

  const createLeadMutation = useMutation({
    mutationFn: api.createLead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/leads"] });
      // Reset form
      setFormData({
        company: "",
        contactName: "",
        email: "",
        phone: "",
        address: searchData?.location || "",
        businessType: searchData?.businessType || "",
        utility: searchData?.utility || "",
        squareFootage: searchData?.sqft?.toString() || "",
        operatingHours: searchData?.hours?.toString() || "",
        projectDetails: "",
        contactPreference: "email",
        preferredTiming: "",
      });
      // Show confirmation popup instead of toast
      setShowConfirmation(true);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to submit your application. Please try again.",
        variant: "destructive",
      });
      console.error("Error creating lead:", error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!program) {
      toast({
        title: "Error",
        description: "Program information is missing. Please try again.",
        variant: "destructive",
      });
      return;
    }
    
    const leadData: InsertLead = {
      company: formData.company,
      contactName: formData.contactName,
      email: formData.email,
      phone: formData.phone || undefined,
      address: formData.address || undefined,
      naics: undefined, // Could be derived from businessType later
      utility: formData.utility || undefined,
      measure: searchData?.measures?.join(", ") || program.name,
      sqft: formData.squareFootage ? parseInt(formData.squareFootage) : undefined,
      hours: formData.operatingHours ? parseInt(formData.operatingHours) : undefined,
      baselineDesc: [
        `Interested in program: ${program.name}`,
        `Contact preference: ${formData.contactPreference}`,
        ...(formData.preferredTiming ? [`Preferred timing: ${formData.preferredTiming}`] : []),
        ...(formData.projectDetails ? [`Project details: ${formData.projectDetails}`] : []),
      ].join(" | "),
      utmJson: {
        programId: program.id,
        programName: program.name,
        programOwner: program.owner,
        source: "apply_with_enlighting",
      },
    };

    createLeadMutation.mutate(leadData);
  };

  return (
    <>
      {/* Main Application Form Modal */}
      <Dialog open={open && !showConfirmation} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="apply-enlighting-modal">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Apply with Enlighting
              {program && (
                <div className="text-sm font-normal text-muted-foreground mt-1">
                  For: {program.name}
                </div>
              )}
            </DialogTitle>
          </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="company">Company Name *</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                required
                data-testid="input-company"
              />
            </div>
            <div>
              <Label htmlFor="contactName">Contact Name *</Label>
              <Input
                id="contactName"
                value={formData.contactName}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                required
                data-testid="input-contact-name"
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                data-testid="input-email"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                data-testid="input-phone"
              />
            </div>
          </div>

          {/* Facility Information */}
          <div>
            <Label htmlFor="address">Facility Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Street address, city, state, zip"
              data-testid="input-address"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="businessType">Business Type</Label>
              <Input
                id="businessType"
                value={formData.businessType}
                onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                placeholder="e.g., Office, Retail, Manufacturing"
                data-testid="input-business-type"
              />
            </div>
            <div>
              <Label htmlFor="squareFootage">Square Footage</Label>
              <Input
                id="squareFootage"
                type="number"
                value={formData.squareFootage}
                onChange={(e) => setFormData({ ...formData, squareFootage: e.target.value })}
                placeholder="Total building sq ft"
                data-testid="input-square-footage"
              />
            </div>
            <div>
              <Label htmlFor="operatingHours">Operating Hours/Week</Label>
              <Input
                id="operatingHours"
                type="number"
                value={formData.operatingHours}
                onChange={(e) => setFormData({ ...formData, operatingHours: e.target.value })}
                placeholder="e.g., 40"
                data-testid="input-operating-hours"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="utility">Utility Provider</Label>
            <Input
              id="utility"
              value={formData.utility}
              onChange={(e) => setFormData({ ...formData, utility: e.target.value })}
              placeholder="Primary electricity/gas provider"
              data-testid="input-utility"
            />
          </div>

          {/* Project Details */}
          <div>
            <Label htmlFor="projectDetails">Project Details</Label>
            <Textarea
              id="projectDetails"
              value={formData.projectDetails}
              onChange={(e) => setFormData({ ...formData, projectDetails: e.target.value })}
              placeholder="Tell us about your energy efficiency project goals, timeline, and any specific equipment or measures you're considering..."
              rows={4}
              data-testid="input-project-details"
            />
          </div>

          {/* Contact Preference */}
          <div>
            <Label className="text-sm font-medium">How would you prefer to be contacted?</Label>
            <RadioGroup
              value={formData.contactPreference}
              onValueChange={(value) => setFormData({ ...formData, contactPreference: value })}
              className="flex flex-row space-x-6 mt-2"
              data-testid="radio-contact-preference"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="email" id="email-pref" />
                <Label htmlFor="email-pref">Email</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="phone" id="phone-pref" />
                <Label htmlFor="phone-pref">Phone</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Preferred Timing */}
          <div>
            <Label htmlFor="preferredTiming">Preferred Time to Contact</Label>
            <Input
              id="preferredTiming"
              value={formData.preferredTiming}
              onChange={(e) => setFormData({ ...formData, preferredTiming: e.target.value })}
              placeholder="e.g., Weekday mornings, any time, urgent"
              data-testid="input-preferred-timing"
            />
          </div>

          <Button
            type="submit"
            disabled={createLeadMutation.isPending}
            className="w-full"
            data-testid="button-submit-application"
          >
            {createLeadMutation.isPending ? "Submitting Application..." : "Submit Application"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>

      {/* Confirmation Popup */}
      <Dialog open={showConfirmation} onOpenChange={() => {}}>
        <DialogContent 
          className="sm:max-w-md"
          style={{ backgroundColor: '#C00BF5' }}
          data-testid="apply-enlighting-confirmation"
        >
          <div className="text-center py-6">
            <h2 className="text-xl font-semibold mb-4" style={{ color: 'black' }}>
              Application Submitted Successfully!
            </h2>
            <p className="text-base" style={{ color: 'black' }}>
              Thanks for wanting to learn more about energy efficiency incentives for your facility. We will get back to you lickety split.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}