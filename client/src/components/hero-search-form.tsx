import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Search } from "lucide-react";
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
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Unlock Energy Incentives for Your Business
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Stack utility, state, and federal rebates to cut project costs by up to 70%. Get instant savings estimates—and book your free audit today.
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
                      <SelectItem value="Residential">Residential</SelectItem>
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
                <Button type="submit" size="lg" className="px-8" data-testid="button-search">
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
