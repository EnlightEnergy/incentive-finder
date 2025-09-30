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
  };

  return (
    <section className="bg-gradient-to-br from-primary/5 to-accent/5 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Program Category Icons */}
        <div className="text-center mb-6">
          <div className="flex justify-center items-center gap-6 lg:gap-8 max-w-5xl mx-auto py-6 flex-wrap">
            <div className="flex flex-col items-center gap-2" data-testid="icon-commercial-industry">
              <div className="w-20 h-20 rounded-full bg-[#00a5cb]/10 flex items-center justify-center hover:bg-[#00a5cb]/20 transition-all duration-300">
                <Building2 className="w-10 h-10 text-[#00a5cb]" />
              </div>
              <span className="text-xs text-slate-600 font-medium text-center max-w-[100px]">Commercial & Industry</span>
            </div>
            <div className="flex flex-col items-center gap-2" data-testid="icon-small-commercial">
              <div className="w-20 h-20 rounded-full bg-[#00a5cb]/10 flex items-center justify-center hover:bg-[#00a5cb]/20 transition-all duration-300">
                <Store className="w-10 h-10 text-[#00a5cb]" />
              </div>
              <span className="text-xs text-slate-600 font-medium text-center max-w-[100px]">Small Commercial</span>
            </div>
            <div className="flex flex-col items-center gap-2" data-testid="icon-industrial">
              <div className="w-20 h-20 rounded-full bg-[#00a5cb]/10 flex items-center justify-center hover:bg-[#00a5cb]/20 transition-all duration-300">
                <Factory className="w-10 h-10 text-[#00a5cb]" />
              </div>
              <span className="text-xs text-slate-600 font-medium text-center max-w-[100px]">Industrial</span>
            </div>
            <div className="flex flex-col items-center gap-2" data-testid="icon-multifamily">
              <div className="w-20 h-20 rounded-full bg-[#00a5cb]/10 flex items-center justify-center hover:bg-[#00a5cb]/20 transition-all duration-300">
                <Building className="w-10 h-10 text-[#00a5cb]" />
              </div>
              <span className="text-xs text-slate-600 font-medium text-center max-w-[100px]">Multifamily</span>
            </div>
            <div className="flex flex-col items-center gap-2" data-testid="icon-direct-install">
              <div className="w-20 h-20 rounded-full bg-[#00a5cb]/10 flex items-center justify-center hover:bg-[#00a5cb]/20 transition-all duration-300">
                <Wrench className="w-10 h-10 text-[#00a5cb]" />
              </div>
              <span className="text-xs text-slate-600 font-medium text-center max-w-[100px]">Direct Install</span>
            </div>
            <div className="flex flex-col items-center gap-2" data-testid="icon-solar">
              <div className="w-20 h-20 rounded-full bg-[#00a5cb]/10 flex items-center justify-center hover:bg-[#00a5cb]/20 transition-all duration-300">
                <Sun className="w-10 h-10 text-[#00a5cb]" />
              </div>
              <span className="text-xs text-slate-600 font-medium text-center max-w-[100px]">Solar</span>
            </div>
          </div>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Find Your Energy Incentives
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Search all applicable utility, state, federal, and aggregator programs available to California businesses. Enlighting will qualify and apply for these incentives at no cost to you — we simply take a small share of the free money we generate for your project.
          </p>
        </div>

        <Card>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="businessType">Business Type</Label>
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
                  <Label htmlFor="location">Location / Address</Label>
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
                  <Label htmlFor="utility">Utility Provider</Label>
                  <Select value={utility} onValueChange={setUtility}>
                    <SelectTrigger data-testid="select-utility">
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
                  <Label>Energy Measures (Select all that apply)</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2" data-testid="measures-checkboxes">
                    {energyMeasures.map((measure) => (
                      <div key={measure.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={measure.id}
                          checked={selectedMeasures.includes(measure.id)}
                          onCheckedChange={(checked) => handleMeasureChange(measure.id, checked as boolean)}
                          data-testid={`checkbox-measure-${measure.id}`}
                        />
                        <Label htmlFor={measure.id} className="text-sm">
                          {measure.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <Collapsible>
                <CollapsibleTrigger className="text-sm font-medium text-muted-foreground hover:text-foreground">
                  Optional: Project Details (improves accuracy)
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="sqft">Building Square Footage</Label>
                      <Input
                        id="sqft"
                        type="number"
                        placeholder="10,000"
                        value={sqft}
                        onChange={(e) => setSqft(e.target.value)}
                        data-testid="input-sqft"
                      />
                    </div>
                    <div>
                      <Label htmlFor="hours">Operating Hours/Day</Label>
                      <Input
                        id="hours"
                        type="number"
                        placeholder="12"
                        value={hours}
                        onChange={(e) => setHours(e.target.value)}
                        data-testid="input-hours"
                      />
                    </div>
                    <div>
                      <Label htmlFor="projectCost">Estimated Project Cost</Label>
                      <Input
                        id="projectCost"
                        type="number"
                        placeholder="25,000"
                        value={projectCost}
                        onChange={(e) => setProjectCost(e.target.value)}
                        data-testid="input-project-cost"
                      />
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

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
      </div>
    </section>
  );
}
