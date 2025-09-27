import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
            <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-4" aria-hidden="true">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <h3 id="success-title" className="text-lg font-semibold text-gray-900 mb-2">Report Sent!</h3>
            <p id="success-description" className="text-gray-600 mb-4">
              Your customized incentive summary is on the way. We'll be in touch within 1 business day.
            </p>
            <Button 
              asChild
              className="bg-blue-600 hover:bg-blue-700 text-white"
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
            className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
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
