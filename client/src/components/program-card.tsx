import { ExternalLink, Mail, Eye } from "lucide-react";
import type { Program } from "@shared/schema";

interface ProgramCardProps {
  program: Program;
  onViewDetails?: (program: Program) => void;
  onApplyEnlighting?: (program: Program) => void;
}

export default function ProgramCard({ program, onViewDetails, onApplyEnlighting }: ProgramCardProps) {
  const getUtilityShortName = (owner: string) => {
    const shortNames: { [key: string]: string } = {
      'Southern California Edison': 'SCE',
      'Pacific Gas & Electric': 'PG&E',
      'San Diego Gas & Electric': 'SDG&E',
      'Los Angeles Department of Water & Power': 'LADWP',
      'California Public Utilities Commission': 'CPUC',
      'Internal Revenue Service': 'Federal'
    };
    return shortNames[owner] || owner;
  };

  const getRebateBadge = () => {
    // Extract rebate information from incentiveDescription
    const description = program.incentiveDescription || '';
    
    // Look for common rebate patterns
    if (description.includes('$0.') && description.includes('/kWh')) {
      const matches = description.match(/\$0\.\d{2}[^/]*\/kWh/g);
      if (matches && matches.length > 0) {
        return `Rebates: ${matches[0]}`;
      }
    }
    
    if (description.includes('0%') && description.includes('financing')) {
      return '0% Financing';
    }
    
    if (description.includes('up to') && description.includes('$')) {
      const matches = description.match(/up to \$[\d,]+/g);
      if (matches && matches.length > 0) {
        return matches[0];
      }
    }
    
    return program.incentiveType;
  };

  const getSummary = () => {
    const desc = program.description || '';
    if (desc.length > 120) {
      return desc.substring(0, 120) + '...';
    }
    return desc;
  };

  return (
    <article 
      className="group bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-lg hover:border-[#00a5cb]/30 transition-all duration-300 ease-out" 
      data-testid={`card-program-${program.id}`}
      aria-labelledby={`program-title-${program.id}`}
      aria-describedby={`program-summary-${program.id} program-incentive-${program.id}`}
    >
      {/* Header Section */}
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <span 
              className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 mr-2"
              aria-label={`Utility: ${program.owner}`}
            >
              {getUtilityShortName(program.owner)}
            </span>
            <span 
              className="text-xs font-medium text-slate-500 uppercase tracking-wide"
              aria-label={`Program type: ${program.incentiveType}`}
            >
              {program.incentiveType}
            </span>
          </div>
          {program.status === 'open' && (
            <span 
              className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-[#00a5cb] text-white"
              aria-label="Application status: Open for submissions"
            >
              Open
            </span>
          )}
        </div>

        {/* Program Name - More prominent */}
        <h3 
          id={`program-title-${program.id}`}
          className="text-xl font-bold text-slate-900 mb-3 leading-tight group-hover:text-[#0c558c] transition-colors" 
          data-testid={`text-program-name-${program.id}`}
        >
          {program.name}
        </h3>

        {/* Key Incentive - Make this very prominent */}
        <div className="mb-4">
          <span 
            id={`program-incentive-${program.id}`}
            className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-bold bg-[#0c558c] text-white shadow-sm"
            aria-label={`Key incentive: ${getRebateBadge()}`}
          >
            {getRebateBadge()}
          </span>
        </div>

        {/* Summary */}
        <p 
          id={`program-summary-${program.id}`}
          className="text-slate-600 text-sm leading-relaxed mb-4"
        >
          {getSummary()}
        </p>

        {/* Tech Tags */}
        {program.techTags && program.techTags.length > 0 && (
          <div 
            className="flex flex-wrap gap-2 mb-4"
            role="list"
            aria-label="Technology categories"
          >
            {program.techTags.slice(0, 3).map((tag, index) => (
              <span 
                key={index} 
                className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200"
                role="listitem"
              >
                {tag}
              </span>
            ))}
            {program.techTags.length > 3 && (
              <span 
                className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium text-slate-500"
                aria-label={`${program.techTags.length - 3} additional technology categories`}
              >
                +{program.techTags.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Actions Footer */}
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-200" role="toolbar" aria-label="Program actions">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3" role="group" aria-label="Primary actions">
            <button 
              className="flex items-center gap-1.5 text-sm font-medium text-[#0c558c] hover:text-[#0a4876] transition-colors"
              onClick={() => onViewDetails?.(program)}
              data-testid={`button-view-details-${program.id}`}
              aria-label={`View details for ${program.name}`}
            >
              <Eye className="w-4 h-4" aria-hidden="true" />
              Details
            </button>
            
            <button 
              className="flex items-center gap-1.5 text-sm font-medium text-[#0c558c] hover:text-[#0a4876] transition-colors"
              onClick={() => onApplyEnlighting?.(program)}
              data-testid={`button-email-program-${program.id}`}
              aria-label={`Email information about ${program.name}`}
            >
              <Mail className="w-4 h-4" aria-hidden="true" />
              Email this
            </button>
          </div>
          
          {program.url && (
            <a 
              href={program.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
              data-testid={`link-source-${program.id}`}
              aria-label={`View original source for ${program.name} (opens in new tab)`}
            >
              <ExternalLink className="w-4 h-4" aria-hidden="true" />
              Source
            </a>
          )}
        </div>
      </div>
    </article>
  );
}