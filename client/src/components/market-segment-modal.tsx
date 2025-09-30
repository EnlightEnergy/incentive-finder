import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface MarketSegment {
  name: string;
  incentiveRate: string;
}

interface MarketSegmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  segments: MarketSegment[];
}

export default function MarketSegmentModal({
  open,
  onOpenChange,
  title,
  segments,
}: MarketSegmentModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-3xl max-h-[80vh] overflow-y-auto" 
        data-testid="market-segment-modal"
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#0c558c]">
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#0c558c] text-white">
                  <th className="text-left p-3 font-semibold border border-slate-300">
                    MSP Program - Market Segments (No kW Restrictions)
                  </th>
                  <th className="text-left p-3 font-semibold border border-slate-300 whitespace-nowrap">
                    Est. Incentive Rates
                  </th>
                </tr>
              </thead>
              <tbody>
                {segments.map((segment, index) => (
                  <tr 
                    key={index}
                    className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}
                    data-testid={`segment-row-${index}`}
                  >
                    <td className="p-3 border border-slate-300 text-slate-700">
                      {segment.name}
                    </td>
                    <td className="p-3 border border-slate-300 text-[#0c558c] font-semibold">
                      {segment.incentiveRate}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-6 p-4 bg-[#00a5cb]/10 rounded-lg border border-[#00a5cb]/20">
            <p className="text-sm text-slate-700">
              <strong className="text-[#0c558c]">Note:</strong> Incentive rates may vary based on specific program requirements, 
              utility territory, and project details. Contact us for a customized assessment.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
