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
      className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:-translate-y-1 transition-all duration-200 ease-out" 
      data-testid={`card-program-${program.id}`}
    >
      {/* Header with Utility + Type */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center text-sm text-slate-600">
          <span className="font-medium">{getUtilityShortName(program.owner)}</span>
          <span className="mx-2">•</span>
          <span>{program.incentiveType}</span>
        </div>
        {program.status === 'open' && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
            Open
          </span>
        )}
      </div>

      {/* Program Name */}
      <h3 className="text-lg font-semibold text-blue-700 mb-2 leading-tight" data-testid={`text-program-name-${program.id}`}>
        {program.name}
      </h3>

      {/* 1-2 Line Summary */}
      <p className="text-slate-600 text-sm mb-4 leading-relaxed">
        {getSummary()}
      </p>

      {/* Rebate Badges */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
          {getRebateBadge()}
        </span>
        {program.techTags && program.techTags.slice(0, 3).map((tag, index) => (
          <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-50 text-slate-600">
            {tag}
          </span>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
        <button 
          className="flex items-center gap-1.5 text-sm font-medium text-blue-700 hover:text-blue-800 transition-colors"
          onClick={() => onViewDetails?.(program)}
          data-testid={`button-view-details-${program.id}`}
        >
          <Eye className="w-4 h-4" />
          Details
        </button>
        
        <button 
          className="flex items-center gap-1.5 text-sm font-medium text-blue-700 hover:text-blue-800 transition-colors"
          onClick={() => onApplyEnlighting?.(program)}
          data-testid={`button-email-program-${program.id}`}
        >
          <Mail className="w-4 h-4" />
          Email me this program
        </button>
        
        {program.url && (
          <a 
            href={program.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm font-medium text-blue-700 hover:text-blue-800 transition-colors ml-auto"
            data-testid={`link-source-${program.id}`}
          >
            <ExternalLink className="w-4 h-4" />
            Source
          </a>
        )}
      </div>
    </article>
  );
}