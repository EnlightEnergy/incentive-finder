import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Calendar } from "lucide-react";
import { api } from "@/lib/api";
import type { InsertLead } from "@shared/schema";

interface LeadCaptureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function LeadCaptureModal({ open, onOpenChange }: LeadCaptureModalProps) {
  const [formData, setFormData] = useState({
    company: "",
    contactName: "",
    email: "",
    phone: "",
    industryType: "",
    sqft: "",
    measure: "",
    utility: "",
  });
  const [showSuccess, setShowSuccess] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createLeadMutation = useMutation({
    mutationFn: api.createLead,
    onSuccess: () => {
      setShowSuccess(true);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/leads"] });
      // Reset form after a delay
      setTimeout(() => {
        setFormData({
          company: "",
          contactName: "",
          email: "",
          phone: "",
          industryType: "",
          sqft: "",
          measure: "",
          utility: "",
        });
        setShowSuccess(false);
        onOpenChange(false);
      }, 3000);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to submit your information. Please try again.",
        variant: "destructive",
      });
      console.error("Error creating lead:", error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.contactName || !formData.email || !formData.company || !formData.industryType || !formData.sqft || !formData.utility || !formData.measure) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in all required fields except Phone.",
        variant: "destructive",
      });
      return;
    }
    
    const leadData: InsertLead = {
      company: formData.company,
      contactName: formData.contactName,
      email: formData.email,
      phone: formData.phone || undefined,
      address: undefined,
      naics: undefined,
      industryType: formData.industryType || undefined,
      utility: formData.utility || undefined,
      measure: formData.measure || undefined,
      sqft: formData.sqft ? parseInt(formData.sqft, 10) : undefined,
      hours: undefined,
      baselineDesc: "Interested in incentive report and potential energy audit",
      utmJson: {},
    };

    createLeadMutation.mutate(leadData);
  };

  if (showSuccess) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent 
          className="sm:max-w-md" 
          data-testid="lead-capture-success"
          aria-labelledby="success-title"
          aria-describedby="success-description"
        >
          <div className="text-center py-6">
            <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-4" aria-hidden="true">
              <CheckCircle className="w-6 h-6 text-[#0c558c]" />
            </div>
            <h3 id="success-title" className="text-lg font-semibold text-gray-900 mb-2">Incentive Enquiry Received</h3>
            <p id="success-description" className="text-gray-600 mb-4">
              We are working on your customized incentive report. We'll be in touch within 48 hours.
            </p>
            <Button 
              asChild
              className="bg-[#00a5cb] hover:bg-[#0094b3] text-white"
              data-testid="button-schedule-audit"
              aria-label="Schedule a free energy audit via email"
            >
              <a href="mailto:hello@enlightingenergy.com?subject=Schedule Energy Audit&body=I'd like to schedule a free energy audit for my facility.">
                <Calendar className="w-4 h-4 mr-2" aria-hidden="true" />
                Schedule Free Audit
              </a>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-md" 
        data-testid="lead-capture-modal"
        aria-labelledby="modal-title"
      >
        <DialogHeader>
          <DialogTitle id="modal-title">Get Your Incentive Report</DialogTitle>
        </DialogHeader>
        <form 
          onSubmit={handleSubmit} 
          className="space-y-4"
          noValidate
        >
          <div>
            <Label htmlFor="contactName">Name</Label>
            <Input
              id="contactName"
              name="contactName"
              value={formData.contactName}
              onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
              required
              aria-required="true"
              data-testid="input-lead-contact-name"
              autoComplete="name"
            />
          </div>
          <div>
            <Label htmlFor="email">Work Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              aria-required="true"
              data-testid="input-lead-email"
              autoComplete="email"
            />
          </div>
          <div>
            <Label htmlFor="company">Company</Label>
            <Input
              id="company"
              name="company"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              required
              aria-required="true"
              data-testid="input-lead-company"
              autoComplete="organization"
            />
          </div>
          <div>
            <Label htmlFor="industryType">Industry Type</Label>
            <Input
              id="industryType"
              name="industryType"
              value={formData.industryType}
              onChange={(e) => setFormData({ ...formData, industryType: e.target.value })}
              placeholder="e.g., Manufacturing, Warehousing, Commercial"
              data-testid="input-lead-industry-type"
            />
          </div>
          <div>
            <Label htmlFor="sqft">Building Square Footage</Label>
            <Input
              id="sqft"
              name="sqft"
              type="number"
              value={formData.sqft}
              onChange={(e) => setFormData({ ...formData, sqft: e.target.value })}
              placeholder="e.g., 50000"
              data-testid="input-lead-sqft"
            />
          </div>
          <div>
            <Label htmlFor="utility">Utility Provider</Label>
            <Select value={formData.utility} onValueChange={(value) => setFormData({ ...formData, utility: value })}>
              <SelectTrigger data-testid="select-utility">
                <SelectValue placeholder="Select your utility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Southern California Edison">Southern California Edison (SCE)</SelectItem>
                <SelectItem value="Pacific Gas & Electric">Pacific Gas & Electric (PG&E)</SelectItem>
                <SelectItem value="San Diego Gas & Electric">San Diego Gas & Electric (SDG&E)</SelectItem>
                <SelectItem value="Los Angeles Department of Water & Power">Los Angeles Department of Water & Power (LADWP)</SelectItem>
                <SelectItem value="Sacramento Municipal Utility District">Sacramento Municipal Utility District (SMUD)</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="measure">Energy Efficiency Measure</Label>
            <Select value={formData.measure} onValueChange={(value) => setFormData({ ...formData, measure: value })}>
              <SelectTrigger data-testid="select-energy-measure">
                <SelectValue placeholder="Select all that apply" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Lighting">Lighting</SelectItem>
                <SelectItem value="HVAC Systems">HVAC Systems</SelectItem>
                <SelectItem value="Heat Pump Water Heaters">Heat Pump Water Heaters</SelectItem>
                <SelectItem value="Motors & VFDs">Motors & VFDs</SelectItem>
                <SelectItem value="Refrigeration">Refrigeration</SelectItem>
                <SelectItem value="Compressed Air Systems">Compressed Air Systems</SelectItem>
                <SelectItem value="Building Envelope">Building Envelope</SelectItem>
                <SelectItem value="Solar Panels">Solar Panels</SelectItem>
                <SelectItem value="Energy Storage">Energy Storage</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="phone">Phone <span className="text-slate-500">(optional)</span></Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              data-testid="input-lead-phone"
              autoComplete="tel"
            />
          </div>
          <Button 
            type="submit" 
            className="w-full bg-[#00a5cb] hover:bg-[#0094b3] text-white" 
            disabled={createLeadMutation.isPending}
            data-testid="button-submit-lead"
          >
            {createLeadMutation.isPending ? "Sending..." : "Get My Incentive Report"}
          </Button>
          <p className="text-xs text-slate-500 text-center" role="note">
            We'll send your customized incentive summary. No spam.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
