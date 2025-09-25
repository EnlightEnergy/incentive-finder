import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import NavigationHeader from "@/components/navigation-header";
import HeroSearchForm from "@/components/hero-search-form";
import ProgramCard from "@/components/program-card";
import FiltersPanel from "@/components/filters-panel";
import LeadCaptureModal from "@/components/lead-capture-modal";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import type { SearchProgramsParams, Program } from "@shared/schema";

export default function Home() {
  const [searchParams, setSearchParams] = useState<Partial<SearchProgramsParams> | null>(null);
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);

  const { data: programs = [], isLoading } = useQuery({
    queryKey: ["/api/programs", searchParams],
    queryFn: () => searchParams ? api.searchPrograms(searchParams) : Promise.resolve([]),
    enabled: !!searchParams,
  });

  const handleSearch = (params: Partial<SearchProgramsParams>) => {
    setSearchParams(params);
  };

  const handleViewDetails = (program: Program) => {
    setSelectedProgram(program);
    // In a real app, this would open a detailed modal or navigate to a detail page
    console.log("Viewing details for program:", program);
  };

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />
      
      <HeroSearchForm onSearch={handleSearch} />

      {searchParams && (
        <section className="py-12 bg-background" data-testid="results-section">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-bold text-foreground">Available Incentives</h3>
                <p className="text-muted-foreground mt-1" data-testid="text-results-count">
                  Found {programs.length} eligible programs for your project
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <Button 
                  variant="outline"
                  onClick={() => setLeadModalOpen(true)}
                  data-testid="button-email-report"
                >
                  📄 Email Report
                </Button>
                <Button 
                  onClick={() => setLeadModalOpen(true)}
                  data-testid="button-book-audit"
                >
                  Book Free Audit
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Filters Sidebar */}
              <div className="lg:col-span-1">
                <FiltersPanel onFiltersChange={(filters) => console.log("Filters changed:", filters)} />
              </div>

              {/* Results Content */}
              <div className="lg:col-span-3">
                <div className="flex items-center justify-between mb-6">
                  <Select defaultValue="relevance">
                    <SelectTrigger className="w-48" data-testid="select-sort">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relevance">Sort by Relevance</SelectItem>
                      <SelectItem value="incentive">Sort by Incentive Amount</SelectItem>
                      <SelectItem value="deadline">Sort by Deadline</SelectItem>
                      <SelectItem value="owner">Sort by Owner</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {isLoading ? (
                  <div className="text-center py-12" data-testid="loading-state">
                    <p className="text-muted-foreground">Searching for programs...</p>
                  </div>
                ) : programs.length === 0 ? (
                  <div className="text-center py-12" data-testid="empty-state">
                    <p className="text-muted-foreground">
                      No programs found matching your criteria. Try adjusting your search or filters.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6" data-testid="programs-list">
                    {programs.map((program) => (
                      <ProgramCard
                        key={program.id}
                        program={program}
                        onViewDetails={handleViewDetails}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      <LeadCaptureModal open={leadModalOpen} onOpenChange={setLeadModalOpen} />

      {/* Footer */}
      <footer className="bg-card border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">E</span>
                </div>
                <span className="text-lg font-semibold text-foreground">Enlighting Energy</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Helping commercial facilities find and secure energy incentives since 2024.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-foreground mb-4">Services</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Incentive Finding</li>
                <li>Energy Audits</li>
                <li>Project Management</li>
                <li>Consulting</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-foreground mb-4">Resources</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Documentation</li>
                <li>API Reference</li>
                <li>Case Studies</li>
                <li>Blog</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-foreground mb-4">Contact</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>hello@enlightingenergy.com</li>
                <li>805-555-1212</li>
                <li>Santa Barbara, CA</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            <p>&copy; 2024 Enlighting Energy. All rights reserved. Data sourced from DSIRE, OpenEI, and utility partners.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
