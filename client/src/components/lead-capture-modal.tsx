import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
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
    interestedInAudit: false,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createLeadMutation = useMutation({
    mutationFn: api.createLead,
    onSuccess: () => {
      toast({
        title: "Thank you!",
        description: "Your report has been sent and we'll be in touch soon.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/leads"] });
      setFormData({
        company: "",
        contactName: "",
        email: "",
        phone: "",
        interestedInAudit: false,
      });
      onOpenChange(false);
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
    
    const leadData: InsertLead = {
      company: formData.company,
      contactName: formData.contactName,
      email: formData.email,
      phone: formData.phone || undefined,
      address: undefined,
      naics: undefined,
      utility: undefined,
      measure: undefined,
      sqft: undefined,
      hours: undefined,
      baselineDesc: formData.interestedInAudit ? "Interested in energy audit" : undefined,
      utmJson: {},
    };

    createLeadMutation.mutate(leadData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="lead-capture-modal">
        <DialogHeader>
          <DialogTitle>Get Your Incentive Report</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="company">Company Name</Label>
            <Input
              id="company"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              required
              data-testid="input-lead-company"
            />
          </div>
          <div>
            <Label htmlFor="contactName">Contact Name</Label>
            <Input
              id="contactName"
              value={formData.contactName}
              onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
              required
              data-testid="input-lead-contact-name"
            />
          </div>
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              data-testid="input-lead-email"
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone (Optional)</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              data-testid="input-lead-phone"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="interestedInAudit"
              checked={formData.interestedInAudit}
              onCheckedChange={(checked) => setFormData({ ...formData, interestedInAudit: checked as boolean })}
              data-testid="checkbox-interested-audit"
            />
            <Label htmlFor="interestedInAudit" className="text-sm">
              I'm interested in scheduling a free energy audit
            </Label>
          </div>
          <Button 
            type="submit" 
            className="w-full" 
            disabled={createLeadMutation.isPending}
            data-testid="button-submit-lead"
          >
            {createLeadMutation.isPending ? "Sending..." : "Send Report & Schedule Audit"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
