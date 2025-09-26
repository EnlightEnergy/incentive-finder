import type { Program } from "@shared/schema";

interface ProgramCardProps {
  program: Program;
  onViewDetails?: (program: Program) => void;
}

export default function ProgramCard({ program, onViewDetails }: ProgramCardProps) {
  const getStatusTag = () => {
    switch (program.status) {
      case 'open':
        return <span className="tag tag--open">Open</span>;
      case 'paused':
        return <span className="tag">Paused</span>;
      case 'expired':
        return <span className="tag">Expired</span>;
      default:
        return <span className="tag">Unknown</span>;
    }
  };

  const getIncentiveTypeTag = () => {
    const typeMap: { [key: string]: string } = {
      'Prescriptive + Custom': 'Financing + Rebates',
      'Custom': 'Custom Rebates',
      'Prescriptive': 'Standard Rebates',
      'Tax Credit': 'Tax Credits',
    };
    return typeMap[program.incentiveType] || program.incentiveType;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'numeric', 
      day: 'numeric' 
    });
  };

  return (
    <article className="program" data-testid={`card-program-${program.id}`}>
      <header className="program__header">
        <h3 className="program__title" data-testid={`text-program-name-${program.id}`}>
          {program.name}
        </h3>
        <div className="program__badges">
          {getStatusTag()}
          <span className="tag">{getIncentiveTypeTag()}</span>
        </div>
      </header>

      <div className="program__meta">
        <span data-testid={`text-program-owner-${program.id}`}>{program.owner}</span>
        {program.endDate && (
          <>
            <span className="bullet">•</span>
            <span className="program__end">
              Ends <time dateTime={program.endDate}>{formatDate(program.endDate)}</time>
            </span>
          </>
        )}
      </div>

      {program.techTags && program.techTags.length > 0 && (
        <ul className="program__chips">
          {program.techTags.map((tag, index) => (
            <li key={index}>{tag}</li>
          ))}
        </ul>
      )}

      <div className="program__actions">
        <button 
          className="btn btn--secondary"
          onClick={() => onViewDetails?.(program)}
          data-testid={`button-view-details-${program.id}`}
        >
          View Details
        </button>
        <button 
          className="btn btn--primary" 
          data-testid={`button-apply-enlighting-${program.id}`}
        >
          Apply With Enlighting
        </button>
      </div>

      <p className="program__disclaimer">
        *Estimates subject to program approval. Some programs are mutually exclusive; we'll stack what's eligible and most valuable.*
      </p>
    </article>
  );
}