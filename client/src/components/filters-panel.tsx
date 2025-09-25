import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface FiltersPanelProps {
  onFiltersChange: (filters: any) => void;
}

export default function FiltersPanel({ onFiltersChange }: FiltersPanelProps) {
  return (
    <div className="space-y-6">
      <Card data-testid="filters-panel">
        <CardHeader>
          <CardTitle className="text-lg">Filter Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="text-sm font-medium mb-2 block">Program Status</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox id="status-open" defaultChecked data-testid="checkbox-status-open" />
                <Label htmlFor="status-open" className="text-sm">Open</Label>
                <span className="text-xs text-muted-foreground">(47)</span>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="status-paused" data-testid="checkbox-status-paused" />
                <Label htmlFor="status-paused" className="text-sm">Paused</Label>
                <span className="text-xs text-muted-foreground">(3)</span>
              </div>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium mb-2 block">Incentive Type</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox id="type-prescriptive" data-testid="checkbox-type-prescriptive" />
                <Label htmlFor="type-prescriptive" className="text-sm">Prescriptive</Label>
                <span className="text-xs text-muted-foreground">(23)</span>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="type-custom" data-testid="checkbox-type-custom" />
                <Label htmlFor="type-custom" className="text-sm">Custom</Label>
                <span className="text-xs text-muted-foreground">(15)</span>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="type-tax-credit" data-testid="checkbox-type-tax-credit" />
                <Label htmlFor="type-tax-credit" className="text-sm">Tax Credit</Label>
                <span className="text-xs text-muted-foreground">(8)</span>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="type-grant" data-testid="checkbox-type-grant" />
                <Label htmlFor="type-grant" className="text-sm">Grant</Label>
                <span className="text-xs text-muted-foreground">(5)</span>
              </div>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium mb-2 block">Program Owner</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox id="owner-utility" data-testid="checkbox-owner-utility" />
                <Label htmlFor="owner-utility" className="text-sm">Utility</Label>
                <span className="text-xs text-muted-foreground">(28)</span>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="owner-state" data-testid="checkbox-owner-state" />
                <Label htmlFor="owner-state" className="text-sm">State</Label>
                <span className="text-xs text-muted-foreground">(12)</span>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="owner-federal" data-testid="checkbox-owner-federal" />
                <Label htmlFor="owner-federal" className="text-sm">Federal</Label>
                <span className="text-xs text-muted-foreground">(7)</span>
              </div>
            </div>
          </div>

          <Button variant="destructive" className="w-full" data-testid="button-clear-filters">
            Clear All Filters
          </Button>
        </CardContent>
      </Card>

      <Card data-testid="savings-calculator">
        <CardHeader>
          <CardTitle className="text-lg">Savings Calculator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="kwh-savings" className="text-xs text-muted-foreground">Annual kWh Savings</Label>
            <Input
              id="kwh-savings"
              type="number"
              placeholder="50,000"
              className="text-sm"
              data-testid="input-kwh-savings"
            />
          </div>
          <div>
            <Label htmlFor="therm-savings" className="text-xs text-muted-foreground">Annual Therm Savings</Label>
            <Input
              id="therm-savings"
              type="number"
              placeholder="2,000"
              className="text-sm"
              data-testid="input-therm-savings"
            />
          </div>
          <div className="bg-muted p-3 rounded-md">
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>Annual Savings:</span>
                <span className="font-medium" data-testid="text-annual-savings">$8,500</span>
              </div>
              <div className="flex justify-between">
                <span>Total Incentives:</span>
                <span className="font-medium text-primary" data-testid="text-total-incentives">$15,200</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Simple Payback:</span>
                <span data-testid="text-payback">2.1 years</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
