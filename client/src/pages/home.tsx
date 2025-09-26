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
import logoPath from "@assets/P_Mark_transp_1758848685119.png";

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
      
      {/* New Hero Section */}
      <section className="hero" data-testid="hero-section">
        <div className="hero__inner">
          <div className="hero__kicker">California Commercial</div>
          <h1 className="hero__title">Find Energy Incentives—in minutes.</h1>
          <p className="hero__sub">
            Stack utility, state, and federal rebates to cut project costs by up to <strong>70%</strong>. 
            We then handle the paperwork, installation, and verification to <strong>maximize your payout</strong>.
          </p>

          <div className="hero__ctas">
            <a href="#search-form" className="btn btn--primary" data-testid="button-find-incentives">Find My Incentives</a>
            <button 
              className="btn btn--secondary" 
              onClick={() => setLeadModalOpen(true)}
              data-testid="button-book-audit"
            >
              Book Free Audit
            </button>
          </div>

          <ul className="hero__proof">
            <li>Trusted by leading CA facilities</li>
            <li>$2M+ incentives secured</li>
            <li>End-to-end: audit → design → install → filing</li>
          </ul>
        </div>
      </section>

      {/* Search Form */}
      <div id="search-form">
        <HeroSearchForm onSearch={handleSearch} />
      </div>

      {searchParams && (
        <>
          {/* Results Summary */}
          <section className="summary" data-testid="results-summary">
            <div className="summary__card">
              <div className="summary__left">
                <div className="summary__label">Pre-Qualified Estimate</div>
                <h2 className="summary__range">$18,000–$26,000</h2>
                <div className="summary__meta">
                  <span className="tag tag--conf">Confidence: Medium</span>
                  <span className="divider">•</span>
                  <span>Programs found: <strong>{programs.length}</strong></span>
                  <span className="divider">•</span>
                  <span>Last updated: <span>Sep 2025</span></span>
                </div>
                <p className="summary__note">
                  Estimates depend on site conditions and operating hours. 
                  <strong> Book a free on-site audit</strong> to verify eligibility and maximize your payout.
                </p>
                <div className="summary__ctas">
                  <button 
                    className="btn btn--primary" 
                    onClick={() => setLeadModalOpen(true)}
                    data-testid="button-schedule-audit"
                  >
                    Book Free Audit
                  </button>
                  <button 
                    className="btn btn--secondary"
                    data-testid="button-upload-bill"
                  >
                    Upload Utility Bill
                  </button>
                </div>
              </div>
              <div className="summary__right">
                <div className="countdown" data-testid="countdown-timer">
                  <div className="countdown__label">Upcoming Program Deadline</div>
                  <div className="countdown__timer">72 days</div>
                  <div className="countdown__program">SCE GoGreen Business Energy Financing</div>
                </div>
              </div>
            </div>
          </section>

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
        </>
      )}

      <LeadCaptureModal open={leadModalOpen} onOpenChange={setLeadModalOpen} />

      {/* Footer */}
      <footer className="bg-card border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <img 
                  src={logoPath} 
                  alt="Enlighting Energy Logo" 
                  className="w-8 h-8"
                />
                <span className="text-lg font-semibold text-foreground">Enlighting Energy</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Helping commercial facilities find and secure energy incentives since 2018.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-foreground mb-4">Services</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Finding Incentives</li>
                <li>Energy Audits</li>
                <li>Engineering Services</li>
                <li>Turnkey Efficiency Upgrades</li>
                <li>Project Efficiency Consulting</li>
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
                <li>805-724-5299</li>
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
