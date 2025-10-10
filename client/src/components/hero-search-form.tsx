import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Search, Building2, Store, Factory, Building, Wrench, Sun } from "lucide-react";
import type { SearchProgramsParams } from "@shared/schema";
import MarketSegmentModal from "@/components/market-segment-modal";


interface HeroSearchFormProps {
  onSearch: (params: Partial<SearchProgramsParams>) => void;
}

const energyMeasures = [
  { id: "Lighting", label: "Lighting" },
  { id: "HVAC", label: "HVAC Systems" },
  { id: "Heat Pump Water Heaters", label: "Heat Pump Water Heaters" },
  { id: "Motors", label: "Motors & VFDs" },
  { id: "Refrigeration", label: "Refrigeration" },
  { id: "Compressed Air", label: "Compressed Air Systems" },
  { id: "Envelope", label: "Building Envelope" },
  { id: "Solar", label: "Solar Panels" },
  { id: "Energy Storage", label: "Energy Storage" },
];

export default function HeroSearchForm({ onSearch }: HeroSearchFormProps) {
  const [businessType, setBusinessType] = useState("");
  const [location, setLocation] = useState("");
  const [utility, setUtility] = useState("");
  const [selectedMeasures, setSelectedMeasures] = useState<string[]>([]);
  const [sqft, setSqft] = useState("");
  const [hours, setHours] = useState("");
  const [projectCost, setProjectCost] = useState("");
  const [marketSegmentModalOpen, setMarketSegmentModalOpen] = useState(false);
  const [smallCommercialModalOpen, setSmallCommercialModalOpen] = useState(false);
  const [industrialModalOpen, setIndustrialModalOpen] = useState(false);
  const [multifamilyModalOpen, setMultifamilyModalOpen] = useState(false);
  const [directInstallModalOpen, setDirectInstallModalOpen] = useState(false);
  const [solarModalOpen, setSolarModalOpen] = useState(false);

  const commercialIndustrySegments = [
    { name: "Public administration buildings", incentiveRate: "$.12 to $.20 per kWh Saved" },
    { name: "Care homes, nursing homes, hospitals, and assisted living facilities", incentiveRate: "$.12 to $.20 per kWh Saved" },
    { name: "Schools (K–12 and universities, including trade schools)", incentiveRate: "$.12 to $.20 per kWh Saved" },
    { name: "Supermarkets and grocery retailers", incentiveRate: "$.12 to $.20 per kWh Saved" },
    { name: "Convenience retailers", incentiveRate: "$.12 to $.20 per kWh Saved" },
    { name: "Office and executive buildings", incentiveRate: "$.12 to $.20 per kWh Saved" },
    { name: "Car dealerships", incentiveRate: "$.12 to $.20 per kWh Saved" },
    { name: "Religious organizations", incentiveRate: "$.12 to $.20 per kWh Saved" },
    { name: "Government buildings (courts, police, fire departments)", incentiveRate: "$.12 to $.20 per kWh Saved" },
    { name: "Warehousing and distribution centers", incentiveRate: "$.12 to $.20 per kWh Saved" },
    { name: "Amusement arcades and theme parks", incentiveRate: "$.12 to $.20 per kWh Saved" },
    { name: "Casinos and other gaming", incentiveRate: "$.12 to $.20 per kWh Saved" },
    { name: "Skiing facilities", incentiveRate: "$.12 to $.20 per kWh Saved" },
    { name: "Fitness and recreational sport centers", incentiveRate: "$.12 to $.20 per kWh Saved" },
  ];

  const smallCommercialSegments = [
    { name: "Healthcare", incentiveRate: "$.10 per kWh Saved" },
    { name: "Outpatient centers", incentiveRate: "$.10 per kWh Saved" },
    { name: "Residential care facilities", incentiveRate: "$.10 per kWh Saved" },
    { name: "Biotech", incentiveRate: "$.10 per kWh Saved" },
    { name: "High-tech facilities", incentiveRate: "$.10 per kWh Saved" },
    { name: "Data centers", incentiveRate: "$.10 per kWh Saved" },
    { name: "Private universities and schools", incentiveRate: "$.10 per kWh Saved" },
    { name: "Small businesses", incentiveRate: "$.10 per kWh Saved" },
  ];

  const industrialSegments = [
    { name: "All Industrial and Manufacturing Facilities", incentiveRate: "$.03 to $.20 per kWh Saved" },
    { name: "Food Processing", incentiveRate: "$.03 to $.20 per kWh Saved" },
  ];

  const multifamilySegments = [
    { name: "Multifamily", incentiveRate: "Up to 65% of project cost" },
    { name: "Multifamily Hard-to-Reach, Disadvantage Community Direct Install (DI)", incentiveRate: "100% Project Cost" },
  ];

  const directInstallSegments = [
    { name: "Hard-to-reach (HTR), Low Income/Low Access (LILA) or Disadvantaged Community (DAC)", incentiveRate: "100% Project Cost" },
    { name: "Food Desert Energy Efficiency Equity (FDEEE) - commercial underserved/refrigeration", incentiveRate: "100% Project Cost" },
  ];

  const solarSegments = [
    { name: "Investment Tax Credit (ITC) + Federal & State/SGIP", incentiveRate: "Up to 65% Project Cost" },
    { name: "Solar Photovoltaic (PV) Systems", incentiveRate: "Up to 30% Tax Credit" },
    { name: "Battery Energy Storage Systems (BESS)", incentiveRate: "Up to 30% Tax Credit" },
    { name: "Self-Generation Incentive Program (SGIP)", incentiveRate: "$200-$850 per kWh" },
    { name: "Net Energy Metering (NEM) 3.0", incentiveRate: "Bill Credit for Excess Generation" },
  ];

  const handleMeasureChange = (measureId: string, checked: boolean) => {
    if (checked) {
      setSelectedMeasures(prev => [...prev, measureId]);
    } else {
      setSelectedMeasures(prev => prev.filter(id => id !== measureId));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const searchParams: Partial<SearchProgramsParams> = {
      businessType: businessType || undefined,
      location: location || undefined,
      utility: utility || undefined,
      measures: selectedMeasures.length > 0 ? selectedMeasures : undefined,
      sqft: sqft ? parseInt(sqft) : undefined,
      hours: hours ? parseInt(hours) : undefined,
      projectCost: projectCost ? parseInt(projectCost) : undefined,
    };
    
    onSearch(searchParams);
    
    setTimeout(() => {
      const resultsSection = document.querySelector('[data-testid="results-summary"]');
      if (resultsSection) {
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  return (
    <section className="bg-gradient-to-br from-primary/5 to-accent/5 py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Find Your Energy Incentives
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Search all applicable utility, state, federal, and aggregator programs available to California businesses. Enlighting can help you apply and qualify for these incentives at no cost to you — we simply claim a fractional % of the free money we generate for your efficiency project.
          </p>
        </div>

        <Card>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="businessType" className="text-base font-semibold text-center block">Business Type</Label>
                  <Select value={businessType} onValueChange={setBusinessType}>
                    <SelectTrigger data-testid="select-business-type">
                      <SelectValue placeholder="Select business type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Commercial">Commercial</SelectItem>
                      <SelectItem value="Industrial">Industrial</SelectItem>
                      <SelectItem value="Small Business">Small Business</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="location" className="text-base font-semibold text-center block">Location / Address</Label>
                  <Input
                    id="location"
                    placeholder="Enter ZIP code or address"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    data-testid="input-location"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="utility" className="text-base font-semibold text-center block">Utility Provider</Label>
                  <Select value={utility} onValueChange={setUtility}>
                    <SelectTrigger data-testid="select-utility" className="text-left">
                      <SelectValue placeholder="Auto-detected from address" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Southern California Edison">Southern California Edison (SCE)</SelectItem>
                      <SelectItem value="Pacific Gas & Electric">Pacific Gas & Electric (PG&E)</SelectItem>
                      <SelectItem value="San Diego Gas & Electric">San Diego Gas & Electric (SDG&E)</SelectItem>
                      <SelectItem value="Los Angeles Department of Water & Power">Los Angeles Department of Water & Power</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-base font-semibold text-left block">Energy Measures (Select all that apply)</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2" data-testid="measures-checkboxes">
                    {energyMeasures.map((measure) => (
                      <div key={measure.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={measure.id}
                          checked={selectedMeasures.includes(measure.id)}
                          onCheckedChange={(checked) => handleMeasureChange(measure.id, checked as boolean)}
                          data-testid={`checkbox-measure-${measure.id}`}
                        />
                        <Label htmlFor={measure.id} className="text-sm text-left">
                          {measure.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <Button 
                  type="submit" 
                  size="lg" 
                  className="px-8 bg-[#00a5cb] hover:bg-[#0094b3] text-white" 
                  data-testid="button-search"
                >
                  <Search className="w-5 h-5 mr-2" />
                  Find My Incentives
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Program Category Icons - Moved after the form */}
        <div className="text-center mt-8">
          <div className="flex justify-center items-center gap-6 lg:gap-8 max-w-5xl mx-auto py-6 flex-wrap">
            <div 
              className="flex flex-col items-center gap-2 cursor-pointer" 
              data-testid="icon-commercial-industry"
              onClick={() => setMarketSegmentModalOpen(true)}
            >
              <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center hover:bg-slate-300 transition-all duration-300 hover:scale-105">
                <Building2 className="w-10 h-10 text-[#0c558c]" />
              </div>
              <span className="text-xs text-slate-600 font-medium text-center max-w-[100px]">Commercial Buildings</span>
            </div>
            <div 
              className="flex flex-col items-center gap-2 cursor-pointer" 
              data-testid="icon-small-commercial"
              onClick={() => setSmallCommercialModalOpen(true)}
            >
              <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center hover:bg-slate-300 transition-all duration-300 hover:scale-105">
                <Store className="w-10 h-10 text-[#0c558c]" />
              </div>
              <span className="text-xs text-slate-600 font-medium text-center max-w-[100px]">Small Commercial</span>
            </div>
            <div 
              className="flex flex-col items-center gap-2 cursor-pointer" 
              data-testid="icon-industrial"
              onClick={() => setIndustrialModalOpen(true)}
            >
              <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center hover:bg-slate-300 transition-all duration-300 hover:scale-105">
                <Factory className="w-10 h-10 text-[#0c558c]" />
              </div>
              <span className="text-xs text-slate-600 font-medium text-center max-w-[100px]">Industrial</span>
            </div>
            <div 
              className="flex flex-col items-center gap-2 cursor-pointer" 
              data-testid="icon-multifamily"
              onClick={() => setMultifamilyModalOpen(true)}
            >
              <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center hover:bg-slate-300 transition-all duration-300 hover:scale-105">
                <Building className="w-10 h-10 text-[#0c558c]" />
              </div>
              <span className="text-xs text-slate-600 font-medium text-center max-w-[100px]">Multifamily</span>
            </div>
            <div 
              className="flex flex-col items-center gap-2 cursor-pointer" 
              data-testid="icon-direct-install"
              onClick={() => setDirectInstallModalOpen(true)}
            >
              <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center hover:bg-slate-300 transition-all duration-300 hover:scale-105">
                <Wrench className="w-10 h-10 text-[#0c558c]" />
              </div>
              <span className="text-xs text-slate-600 font-medium text-center max-w-[100px]">Direct Install</span>
            </div>
            <div 
              className="flex flex-col items-center gap-2 cursor-pointer" 
              data-testid="icon-solar"
              onClick={() => setSolarModalOpen(true)}
            >
              <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center hover:bg-slate-300 transition-all duration-300 hover:scale-105">
                <Sun className="w-10 h-10 text-[#0c558c]" />
              </div>
              <span className="text-xs text-slate-600 font-medium text-center max-w-[100px]">Solar</span>
            </div>
          </div>
        </div>
      </div>
      
      <MarketSegmentModal
        open={marketSegmentModalOpen}
        onOpenChange={setMarketSegmentModalOpen}
        title="Commercial Buildings"
        segments={commercialIndustrySegments}
      />
      
      <MarketSegmentModal
        open={smallCommercialModalOpen}
        onOpenChange={setSmallCommercialModalOpen}
        title="Smaller Commercial Building Types <200 kW"
        segments={smallCommercialSegments}
      />
      
      <MarketSegmentModal
        open={industrialModalOpen}
        onOpenChange={setIndustrialModalOpen}
        title="Industrial/Manufacturing Market Segments"
        segments={industrialSegments}
      />
      
      <MarketSegmentModal
        open={multifamilyModalOpen}
        onOpenChange={setMultifamilyModalOpen}
        title="SoCal Ren Multifamily Market Segments"
        segments={multifamilySegments}
      />
      
      <MarketSegmentModal
        open={directInstallModalOpen}
        onOpenChange={setDirectInstallModalOpen}
        title="SoCal Ren Commercial Direct Install"
        segments={directInstallSegments}
      />
      
      <MarketSegmentModal
        open={solarModalOpen}
        onOpenChange={setSolarModalOpen}
        title="Renewable Solar and BESS"
        segments={solarSegments}
      />
    </section>
  );
}
