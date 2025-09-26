import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import NavigationHeader from "@/components/navigation-header";
import HeroSearchForm from "@/components/hero-search-form";
import ProgramCard from "@/components/program-card";
import FiltersPanel from "@/components/filters-panel";
import LeadCaptureModal from "@/components/lead-capture-modal";
import ProgramDetailsModal from "@/components/program-details-modal";
import ApplyEnlightingModal from "@/components/apply-enlighting-modal";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import type { SearchProgramsParams, Program } from "@shared/schema";
import logoPath from "@assets/P_Mark_transp_1758848685119.png";

export default function Home() {
  const [searchParams, setSearchParams] = useState<Partial<SearchProgramsParams> | null>(null);
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [programDetailsOpen, setProgramDetailsOpen] = useState(false);
  const [applyEnlightingModalOpen, setApplyEnlightingModalOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [countdown, setCountdown] = useState<{ days: number; hours: number; program: string } | null>(null);
  const [filters, setFilters] = useState({
    status: 'open' as string,
    incentiveType: [] as string[],
    programOwner: [] as string[]
  });
  const [sortBy, setSortBy] = useState<string>('relevance');

  const { data: rawPrograms = [], isLoading } = useQuery({
    queryKey: ["/api/programs", searchParams, filters],
    queryFn: () => {
      if (!searchParams) return Promise.resolve([]);
      
      // Combine search params with current filters for the API call
      const combinedParams = {
        ...searchParams,
        status: filters.status || undefined, // Don't send empty status to backend
        incentiveType: filters.incentiveType.length > 0 ? filters.incentiveType : undefined,
        programOwner: filters.programOwner.length > 0 ? filters.programOwner : undefined
      };
      
      return api.searchPrograms(combinedParams);
    },
    enabled: !!searchParams,
  });


  // Sort programs based on selected sort option (clone array to avoid mutating React Query cache)
  const programs = [...rawPrograms].sort((a, b) => {
    switch (sortBy) {
      case 'deadline':
        // Sort by end date (earliest deadline first)
        if (!a.endDate && !b.endDate) return 0;
        if (!a.endDate) return 1; // Programs without deadlines go to end
        if (!b.endDate) return -1;
        return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
      
      case 'owner':
        // Sort alphabetically by program owner
        return a.owner.localeCompare(b.owner);
      
      
      case 'relevance':
      default:
        // Default sort by updatedAt (most recently updated first)
        if (!a.updatedAt && !b.updatedAt) return 0;
        if (!a.updatedAt) return 1;
        if (!b.updatedAt) return -1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
  });

  const handleSearch = (params: Partial<SearchProgramsParams>) => {
    // Store the base search parameters (without filters)
    setSearchParams(params);
  };

  const handleFiltersChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    // The useQuery will automatically refetch due to the filters dependency in queryKey
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      status: '' as string, // Empty status to show all programs
      incentiveType: [] as string[],
      programOwner: [] as string[]
    };
    setFilters(clearedFilters);
    // The useQuery will automatically refetch due to the filters dependency in queryKey
  };

  const handleViewDetails = (program: Program) => {
    setSelectedProgram(program);
    setProgramDetailsOpen(true);
  };

  const handleApplyEnlighting = (program: Program) => {
    setSelectedProgram(program);
    setApplyEnlightingModalOpen(true);
  };

  // Countdown timer effect
  useEffect(() => {
    const updateCountdown = () => {
      if (programs.length === 0) {
        setCountdown(null);
        return;
      }

      // Find programs with future deadlines only
      const now = new Date();
      const futurePrograms = programs
        .filter(p => p.endDate && new Date(p.endDate!).getTime() > now.getTime())
        .map(p => ({ ...p, deadline: new Date(p.endDate!) }))
        .sort((a, b) => a.deadline.getTime() - b.deadline.getTime());

      if (futurePrograms.length === 0) {
        setCountdown(null);
        return;
      }

      const nextDeadline = futurePrograms[0];
      const timeRemaining = nextDeadline.deadline.getTime() - now.getTime();

      if (timeRemaining > 0) {
        const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        
        setCountdown({
          days,
          hours,
          program: nextDeadline.name
        });
      } else {
        setCountdown(null);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000 * 60 * 60); // Update every hour

    return () => clearInterval(interval);
  }, [programs]);

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
              <div className="summary__content">
                <div className="summary__info">
                  <h2 className="summary__title">Programs Found</h2>
                  <div className="summary__meta">
                    <span>Programs found: <strong>{programs.length}</strong></span>
                    <span className="divider">•</span>
                    <span>Last updated: <span>Sep 2025</span></span>
                  </div>
                  <p className="summary__note">
                    <strong>Book a free on-site audit</strong> to verify eligibility and maximize your payout.
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
                <div className="summary__countdown">
                  <div className="countdown" data-testid="countdown-timer">
                    <div className="countdown__label">Upcoming Program Deadline</div>
                    <div className="countdown__timer">
                      {countdown ? `${countdown.days} days, ${countdown.hours} hours` : '—'}
                    </div>
                    <div className="countdown__program">
                      {countdown ? countdown.program : 'No upcoming deadlines'}
                    </div>
                  </div>
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
                <FiltersPanel 
                  filters={filters}
                  onFiltersChange={handleFiltersChange}
                  onClearFilters={handleClearFilters}
                />
              </div>

              {/* Results Content */}
              <div className="lg:col-span-3">
                <div className="flex items-center justify-between mb-6">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-48" data-testid="select-sort">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relevance">Sort by Relevance</SelectItem>
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
                        onApplyEnlighting={handleApplyEnlighting}
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
      <ProgramDetailsModal 
        open={programDetailsOpen} 
        onOpenChange={setProgramDetailsOpen}
        program={selectedProgram}
      />
      <ApplyEnlightingModal
        open={applyEnlightingModalOpen}
        onOpenChange={setApplyEnlightingModalOpen}
        program={selectedProgram}
        searchData={{
          location: searchParams?.location,
          businessType: searchParams?.businessType,
          utility: searchParams?.utility,
          measures: searchParams?.measures,
          sqft: searchParams?.sqft,
          hours: searchParams?.hours,
        }}
      />

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
                <li>
                  <a 
                    href="mailto:hello@enlightingenergy.com" 
                    className="hover:text-foreground transition-colors"
                    data-testid="link-footer-email"
                  >
                    hello@enlightingenergy.com
                  </a>
                </li>
                <li>
                  <a 
                    href="tel:+18057245299" 
                    className="hover:text-foreground transition-colors"
                    data-testid="link-footer-phone"
                  >
                    805-724-5299
                  </a>
                </li>
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
