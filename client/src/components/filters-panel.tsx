import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface Filters {
  status: string;
  incentiveType: string[];
  programOwner: string[];
}

interface FiltersPanelProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  onClearFilters: () => void;
}

export default function FiltersPanel({ filters, onFiltersChange, onClearFilters }: FiltersPanelProps) {
  const handleFilterChange = (category: keyof Filters, value: string, checked: boolean) => {
    const newFilters = { ...filters };
    
    if (category === 'status') {
      // Status is single-select, so set directly
      newFilters.status = checked ? value : ''; // Clear status if unchecked
    } else {
      // Handle array properties (incentiveType, programOwner)
      const arrayProperty = newFilters[category] as string[];
      if (checked) {
        if (!arrayProperty.includes(value)) {
          (newFilters[category] as string[]) = [...arrayProperty, value];
        }
      } else {
        (newFilters[category] as string[]) = arrayProperty.filter(item => item !== value);
      }
    }
    
    onFiltersChange(newFilters);
  };
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
                <Checkbox 
                  id="status-open" 
                  checked={filters.status === 'open'}
                  onCheckedChange={(checked) => handleFilterChange('status', 'open', !!checked)}
                  data-testid="checkbox-status-open" 
                />
                <Label htmlFor="status-open" className="text-sm">Open</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="status-paused" 
                  checked={filters.status === 'paused'}
                  onCheckedChange={(checked) => handleFilterChange('status', 'paused', !!checked)}
                  data-testid="checkbox-status-paused" 
                />
                <Label htmlFor="status-paused" className="text-sm">Paused</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="status-expired" 
                  checked={filters.status === 'expired'}
                  onCheckedChange={(checked) => handleFilterChange('status', 'expired', !!checked)}
                  data-testid="checkbox-status-expired" 
                />
                <Label htmlFor="status-expired" className="text-sm">Expired</Label>
              </div>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium mb-2 block">Incentive Type</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="type-financing-rebates" 
                  checked={filters.incentiveType.includes('Financing + Rebates')}
                  onCheckedChange={(checked) => handleFilterChange('incentiveType', 'Financing + Rebates', !!checked)}
                  data-testid="checkbox-type-financing-rebates" 
                />
                <Label htmlFor="type-financing-rebates" className="text-sm">Financing + Rebates</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="type-prescriptive-financing" 
                  checked={filters.incentiveType.includes('Prescriptive + Financing')}
                  onCheckedChange={(checked) => handleFilterChange('incentiveType', 'Prescriptive + Financing', !!checked)}
                  data-testid="checkbox-type-prescriptive-financing" 
                />
                <Label htmlFor="type-prescriptive-financing" className="text-sm">Prescriptive + Financing</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="type-rebate" 
                  checked={filters.incentiveType.includes('Rebate')}
                  onCheckedChange={(checked) => handleFilterChange('incentiveType', 'Rebate', !!checked)}
                  data-testid="checkbox-type-rebate" 
                />
                <Label htmlFor="type-rebate" className="text-sm">Rebate</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="type-tax-credit" 
                  checked={filters.incentiveType.includes('Tax Credit')}
                  onCheckedChange={(checked) => handleFilterChange('incentiveType', 'Tax Credit', !!checked)}
                  data-testid="checkbox-type-tax-credit" 
                />
                <Label htmlFor="type-tax-credit" className="text-sm">Tax Credit</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="type-performance-based" 
                  checked={filters.incentiveType.includes('Performance-Based')}
                  onCheckedChange={(checked) => handleFilterChange('incentiveType', 'Performance-Based', !!checked)}
                  data-testid="checkbox-type-performance-based" 
                />
                <Label htmlFor="type-performance-based" className="text-sm">Performance-Based</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="type-prescriptive-custom" 
                  checked={filters.incentiveType.includes('Prescriptive + Custom')}
                  onCheckedChange={(checked) => handleFilterChange('incentiveType', 'Prescriptive + Custom', !!checked)}
                  data-testid="checkbox-type-prescriptive-custom" 
                />
                <Label htmlFor="type-prescriptive-custom" className="text-sm">Prescriptive + Custom</Label>
              </div>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium mb-2 block">Program Owner</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="owner-sce" 
                  checked={filters.programOwner.includes('Southern California Edison')}
                  onCheckedChange={(checked) => handleFilterChange('programOwner', 'Southern California Edison', !!checked)}
                  data-testid="checkbox-owner-sce" 
                />
                <Label htmlFor="owner-sce" className="text-sm">SCE</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="owner-pge" 
                  checked={filters.programOwner.includes('Pacific Gas & Electric')}
                  onCheckedChange={(checked) => handleFilterChange('programOwner', 'Pacific Gas & Electric', !!checked)}
                  data-testid="checkbox-owner-pge" 
                />
                <Label htmlFor="owner-pge" className="text-sm">PG&E</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="owner-cpuc" 
                  checked={filters.programOwner.includes('California Public Utilities Commission')}
                  onCheckedChange={(checked) => handleFilterChange('programOwner', 'California Public Utilities Commission', !!checked)}
                  data-testid="checkbox-owner-cpuc" 
                />
                <Label htmlFor="owner-cpuc" className="text-sm">CPUC</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="owner-irs" 
                  checked={filters.programOwner.includes('Internal Revenue Service')}
                  onCheckedChange={(checked) => handleFilterChange('programOwner', 'Internal Revenue Service', !!checked)}
                  data-testid="checkbox-owner-irs" 
                />
                <Label htmlFor="owner-irs" className="text-sm">Federal</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="owner-ladwp" 
                  checked={filters.programOwner.includes('Los Angeles Department of Water & Power')}
                  onCheckedChange={(checked) => handleFilterChange('programOwner', 'Los Angeles Department of Water & Power', !!checked)}
                  data-testid="checkbox-owner-ladwp" 
                />
                <Label htmlFor="owner-ladwp" className="text-sm">LADWP</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="owner-sdge" 
                  checked={filters.programOwner.includes('San Diego Gas & Electric')}
                  onCheckedChange={(checked) => handleFilterChange('programOwner', 'San Diego Gas & Electric', !!checked)}
                  data-testid="checkbox-owner-sdge" 
                />
                <Label htmlFor="owner-sdge" className="text-sm">SDG&E</Label>
              </div>
            </div>
          </div>

          <Button 
            variant="outline" 
            className="w-full" 
            style={{ backgroundColor: '#9f00ff', color: 'white', borderColor: '#9f00ff' }}
            onClick={onClearFilters}
            data-testid="button-clear-filters"
          >
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
