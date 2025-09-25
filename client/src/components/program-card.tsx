import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, CheckCircle, AlertTriangle } from "lucide-react";
import type { Program } from "@shared/schema";

interface ProgramCardProps {
  program: Program;
  onViewDetails?: (program: Program) => void;
}

export default function ProgramCard({ program, onViewDetails }: ProgramCardProps) {
  const getBadgeVariant = (type: string) => {
    switch (type.toLowerCase()) {
      case 'custom':
        return 'default';
      case 'prescriptive':
        return 'secondary';
      case 'tax credit':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getStatusBadge = () => {
    switch (program.status) {
      case 'open':
        return <Badge variant="default" className="bg-accent text-accent-foreground">Open</Badge>;
      case 'paused':
        return <Badge variant="outline">Paused</Badge>;
      case 'expired':
        return <Badge variant="destructive">Expired</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow" data-testid={`card-program-${program.id}`}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="text-lg font-semibold text-foreground" data-testid={`text-program-name-${program.id}`}>
                {program.name}
              </h3>
              {getStatusBadge()}
              <Badge variant={getBadgeVariant(program.incentiveType)}>
                {program.incentiveType}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground" data-testid={`text-program-owner-${program.id}`}>
              {program.owner}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4 text-sm mb-4">
          <span className="flex items-center space-x-1">
            <CheckCircle className="w-4 h-4 text-muted-foreground" />
            <span>{program.incentiveType}</span>
          </span>
          {program.endDate && (
            <span className="flex items-center space-x-1">
              <AlertTriangle className="w-4 h-4 text-muted-foreground" />
              <span>Ends {new Date(program.endDate).toLocaleDateString()}</span>
            </span>
          )}
        </div>

        {/* Enhanced Program Description */}
        {program.description && (
          <div className="mb-4">
            <p className="text-sm text-foreground leading-relaxed" data-testid={`text-description-${program.id}`}>
              {program.description}
            </p>
          </div>
        )}

        {/* Detailed Incentive Information */}
        {program.incentiveDescription && (
          <div className="mb-4 p-3 bg-accent/10 rounded-lg border border-accent/20">
            <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center">
              <span className="w-2 h-2 bg-accent rounded-full mr-2"></span>
              Available Incentives & Values
            </h4>
            <div className="text-sm text-foreground whitespace-pre-line" data-testid={`text-incentives-${program.id}`}>
              {program.incentiveDescription}
            </div>
          </div>
        )}

        {program.techTags && program.techTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {program.techTags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex justify-between items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewDetails?.(program)}
            data-testid={`button-view-details-${program.id}`}
          >
            View Details →
          </Button>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" data-testid={`button-save-${program.id}`}>
              Save
            </Button>
            {program.url && (
              <Button size="sm" asChild data-testid={`button-apply-${program.id}`}>
                <a href={program.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Apply Now
                </a>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
