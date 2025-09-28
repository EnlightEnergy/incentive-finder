import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import type { Program } from "@shared/schema";

interface ProgramDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  program: Program | null;
}

export default function ProgramDetailsModal({ open, onOpenChange, program }: ProgramDetailsModalProps) {
  if (!program) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Extract rebate values from incentive description for highlighting
  const extractRebateHighlights = (text: string) => {
    if (!text) return [];
    
    const highlights = [];
    
    // Look for dollar amounts per kWh
    const kwhMatches = text.match(/\$[0-9.,]+\s*\/\s*kWh/gi);
    if (kwhMatches) {
      highlights.push(...kwhMatches.map(match => ({ type: 'rate', value: match })));
    }
    
    // Look for percentage tax credits
    const percentMatches = text.match(/\d+%[^a-z]*(?:tax credit|credit|coverage)/gi);
    if (percentMatches) {
      highlights.push(...percentMatches.map(match => ({ type: 'percent', value: match })));
    }
    
    // Look for financing terms
    const financingMatches = text.match(/(?:0%|zero[- ]interest|no[- ]interest)[^.]*(?:financing|loan)/gi);
    if (financingMatches) {
      highlights.push(...financingMatches.map(match => ({ type: 'financing', value: match })));
    }
    
    // Look for up to dollar amounts
    const upToMatches = text.match(/up to \$[0-9,]+(?:\s*million)?/gi);
    if (upToMatches) {
      highlights.push(...upToMatches.map(match => ({ type: 'amount', value: match })));
    }

    return highlights.slice(0, 4); // Limit to top 4 highlights
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto" data-testid="program-details-modal">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">{program.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Program Owner */}
          <div>
            <h3 className="font-medium text-sm text-muted-foreground mb-1">PROGRAM OWNER</h3>
            <p className="text-base">{program.owner}</p>
          </div>

          {/* Program Description */}
          {program.description && (
            <div>
              <h3 className="font-medium text-sm text-muted-foreground mb-2">PROGRAM OVERVIEW</h3>
              <p className="text-base leading-relaxed">{program.description}</p>
            </div>
          )}

          {/* Key Rebate Values - Highlighted */}
          {program.incentiveDescription && extractRebateHighlights(program.incentiveDescription).length > 0 && (
            <div>
              <h3 className="font-medium text-sm text-muted-foreground mb-3">KEY REBATE VALUES</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {extractRebateHighlights(program.incentiveDescription).map((highlight, index) => (
                  <div key={index} className="p-3 bg-[#00a5cb] border border-[#00a5cb] rounded-lg">
                    <div className="text-lg font-semibold text-white">
                      {highlight.value}
                    </div>
                    <div className="text-xs text-white/90 mt-1">
                      {highlight.type === 'rate' && 'Rebate Rate'}
                      {highlight.type === 'percent' && 'Tax Credit/Coverage'}
                      {highlight.type === 'financing' && 'Financing Option'}
                      {highlight.type === 'amount' && 'Maximum Amount'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Incentive Details */}
          {program.incentiveDescription && (
            <div>
              <h3 className="font-medium text-sm text-muted-foreground mb-2">COMPLETE INCENTIVE DETAILS</h3>
              <div className="text-base leading-relaxed whitespace-pre-line bg-gray-50 p-4 rounded-lg border">
                {program.incentiveDescription}
              </div>
            </div>
          )}

          {/* Technologies */}
          {program.techTags && program.techTags.length > 0 && (
            <div>
              <h3 className="font-medium text-sm text-muted-foreground mb-2">ELIGIBLE TECHNOLOGIES</h3>
              <div className="flex flex-wrap gap-2">
                {program.techTags.map((tag, index) => (
                  <span 
                    key={index} 
                    className="px-3 py-1 bg-muted rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Program Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {program.startDate && (
              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-1">START DATE</h3>
                <p className="text-base">{formatDate(program.startDate)}</p>
              </div>
            )}
            {program.endDate && (
              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-1">END DATE</h3>
                <p className="text-base">{formatDate(program.endDate)}</p>
              </div>
            )}
          </div>

          {/* Status and Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-sm text-muted-foreground mb-1">STATUS</h3>
              <p className="text-base capitalize">{program.status}</p>
            </div>
            <div>
              <h3 className="font-medium text-sm text-muted-foreground mb-1">INCENTIVE TYPE</h3>
              <p className="text-base">{program.incentiveType}</p>
            </div>
          </div>

          {/* Learn More Link */}
          {program.url && (
            <div className="pt-4 border-t">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => program.url && window.open(program.url, '_blank')}
                data-testid="learn-more-link"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Learn more about this program
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}