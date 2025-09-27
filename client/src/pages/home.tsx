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

// Client logo imports
import boeingLogo from "@assets/boeing_1758932853739.jpg";
import dreamworksLogo from "@assets/dreamworks_1758932853741.jpg";
import edcoLogo from "@assets/edco_1758932853742.jpg";
import fenderLogo from "@assets/fender_1758932853743.jpg";
import howmetLogo from "@assets/howmet_1758932853743.jpg";
import metroLogo from "@assets/Metro_1758932853743.jpg";
import nasaJplLogo from "@assets/nasa_jpl_1758932853744.jpg";
import nipponLogo from "@assets/nippon_1758932853744.jpg";
import redBullLogo from "@assets/red_bull_1758932853745.jpg";
import sbAirportLogo from "@assets/SB Airport_1758932853745.jpg";
import zogsLogo from "@assets/zogs_1758932853746.jpg";

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
      
      <main id="main-content" tabIndex={-1}>
      
      {/* New Hero Section */}
      <section className="hero" data-testid="hero-section">
        <div className="hero__inner">
          <div className="hero__kicker">California Commercial Energy</div>
          <h1 className="hero__title">Unlock Rebates, Grants & 0% Financing for Your Facility</h1>
          <p className="hero__sub">
            Stack utility rebates, state grants, and federal tax incentives to cut project costs by up to 70%. 
            Zero upfront costs with 0% financing. Our energy engineers handle eligibility verification, application filing, and full project management from audit to rebate payout.
          </p>

          <div className="hero__ctas">
            <button 
              className="btn btn--primary" 
              onClick={() => setLeadModalOpen(true)}
              data-testid="button-get-report"
            >
              Get My Incentive Report
            </button>
            <a href="#search-form" className="btn btn--secondary" data-testid="button-browse-programs">
              Browse Programs
            </a>
          </div>

          <ul className="hero__proof">
            <li>$2.3M in incentives secured YTD</li>
            <li>Avg payback: 14 months across 127 sites</li>
            <li>Design-to-rebate, handled</li>
          </ul>
        </div>

        {/* Utility Logo Trust Strip */}
        <div className="bg-slate-50 py-8 border-t border-gray-200">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-6">
              <p className="text-sm font-medium text-slate-600 uppercase tracking-wide">
                Partner utilities & programs
              </p>
            </div>
            <div className="flex justify-center items-center gap-8 lg:gap-12 flex-wrap">
              <div className="text-xl font-bold text-slate-400 hover:text-blue-600 transition-colors cursor-default">SCE</div>
              <div className="text-xl font-bold text-slate-400 hover:text-blue-600 transition-colors cursor-default">PG&E</div>
              <div className="text-xl font-bold text-slate-400 hover:text-blue-600 transition-colors cursor-default">SDG&E</div>
              <div className="text-xl font-bold text-slate-400 hover:text-blue-600 transition-colors cursor-default">LADWP</div>
              <div className="text-lg font-semibold text-slate-400 hover:text-blue-600 transition-colors cursor-default">SoCalREN</div>
              <div className="text-lg font-semibold text-slate-400 hover:text-blue-600 transition-colors cursor-default">MCE</div>
            </div>
          </div>
        </div>

        {/* Client Proof Strip */}
        <div className="bg-white py-8 border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-6">
              <p className="text-sm font-medium text-slate-600 uppercase tracking-wide">
                Trusted by leading California businesses
              </p>
            </div>
            <div className="flex justify-center items-center gap-8 lg:gap-12 flex-wrap">
              <img src={boeingLogo} alt="Boeing" className="h-8 grayscale opacity-60 hover:opacity-100 hover:grayscale-0 transition-all duration-300" />
              <img src={dreamworksLogo} alt="DreamWorks" className="h-8 grayscale opacity-60 hover:opacity-100 hover:grayscale-0 transition-all duration-300" />
              <img src={edcoLogo} alt="EDCO" className="h-8 grayscale opacity-60 hover:opacity-100 hover:grayscale-0 transition-all duration-300" />
              <img src={fenderLogo} alt="Fender" className="h-8 grayscale opacity-60 hover:opacity-100 hover:grayscale-0 transition-all duration-300" />
              <img src={howmetLogo} alt="Howmet Aerospace" className="h-8 grayscale opacity-60 hover:opacity-100 hover:grayscale-0 transition-all duration-300" />
              <img src={metroLogo} alt="Metro" className="h-8 grayscale opacity-60 hover:opacity-100 hover:grayscale-0 transition-all duration-300" />
              <img src={nasaJplLogo} alt="NASA JPL" className="h-8 grayscale opacity-60 hover:opacity-100 hover:grayscale-0 transition-all duration-300" />
              <img src={nipponLogo} alt="Nippon Express" className="h-8 grayscale opacity-60 hover:opacity-100 hover:grayscale-0 transition-all duration-300" />
              <img src={redBullLogo} alt="Red Bull" className="h-8 grayscale opacity-60 hover:opacity-100 hover:grayscale-0 transition-all duration-300" />
              <img src={sbAirportLogo} alt="Santa Barbara Airport" className="h-8 grayscale opacity-60 hover:opacity-100 hover:grayscale-0 transition-all duration-300" />
              <img src={zogsLogo} alt="Zog's" className="h-8 grayscale opacity-60 hover:opacity-100 hover:grayscale-0 transition-all duration-300" />
            </div>
          </div>
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
                      Book Free Energy Audit
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

          <section className="py-16 bg-slate-50" data-testid="results-section">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* Horizontal Filters Bar */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
                <div className="flex flex-col lg:flex-row gap-4 items-center">
                  <div className="flex flex-col sm:flex-row gap-4 flex-1">
                    <Select value={filters.programOwner[0] || ""} onValueChange={(value) => handleFiltersChange({...filters, programOwner: value ? [value] : []})}>
                      <SelectTrigger className="min-w-48" data-testid="select-utility">
                        <SelectValue placeholder="Utility (SCE, PG&E...)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Utilities</SelectItem>
                        <SelectItem value="Southern California Edison">SCE</SelectItem>
                        <SelectItem value="Pacific Gas & Electric">PG&E</SelectItem>
                        <SelectItem value="San Diego Gas & Electric">SDG&E</SelectItem>
                        <SelectItem value="Los Angeles Department of Water & Power">LADWP</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select value={filters.incentiveType[0] || ""} onValueChange={(value) => handleFiltersChange({...filters, incentiveType: value ? [value] : []})}>
                      <SelectTrigger className="min-w-48" data-testid="select-incentive-type">
                        <SelectValue placeholder="Incentive Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="Prescriptive">Prescriptive</SelectItem>
                        <SelectItem value="Performance-Based">Performance-Based</SelectItem>
                        <SelectItem value="Tax Credit">Tax Credit</SelectItem>
                        <SelectItem value="Financing + Rebates">Financing + Rebates</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={filters.status} onValueChange={(value) => handleFiltersChange({...filters, status: value})}>
                      <SelectTrigger className="min-w-36" data-testid="select-status">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="paused">Paused</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <Button 
                      variant="outline" 
                      onClick={handleClearFilters}
                      data-testid="button-clear-filters"
                      className="text-slate-600"
                    >
                      Clear
                    </Button>
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
                </div>
                
                {/* Live Result Count */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm text-slate-600" data-testid="text-results-count">
                    <span className="font-semibold text-slate-900">{programs.length} programs</span> match your criteria
                  </p>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-foreground">Available Incentives</h3>
                  <p className="text-slate-600 mt-1">
                    California utility, state, and federal energy efficiency programs
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
                    className="bg-blue-700 hover:bg-blue-800"
                    onClick={() => setLeadModalOpen(true)}
                    data-testid="button-book-audit"
                  >
                    Book Free Energy Audit
                  </Button>
                </div>
              </div>

              {/* Results */}
              {isLoading ? (
                <div className="text-center py-12" data-testid="loading-state">
                  <p className="text-slate-600">Searching for programs...</p>
                </div>
              ) : programs.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center" data-testid="empty-state">
                  <div className="max-w-md mx-auto">
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">No programs found</h3>
                    <p className="text-slate-600 mb-6">
                      Try these popular searches or talk to our experts for personalized guidance:
                    </p>
                    
                    <div className="space-y-3 mb-8">
                      <button 
                        className="block w-full text-left p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors text-sm"
                        onClick={() => handleSearch({ businessType: "Commercial", measures: ["HVAC"] })}
                      >
                        <span className="font-medium text-slate-900">Commercial HVAC rebates</span>
                        <span className="text-slate-600 ml-2">→ Find cooling & heating incentives</span>
                      </button>
                      <button 
                        className="block w-full text-left p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors text-sm"
                        onClick={() => handleSearch({ businessType: "Industrial", measures: ["Lighting"] })}
                      >
                        <span className="font-medium text-slate-900">Industrial lighting upgrades</span>
                        <span className="text-slate-600 ml-2">→ LED retrofit programs</span>
                      </button>
                      <button 
                        className="block w-full text-left p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors text-sm"
                        onClick={() => handleSearch({ businessType: "Small Business" })}
                      >
                        <span className="font-medium text-slate-900">Small business programs</span>
                        <span className="text-slate-600 ml-2">→ Direct install & financing</span>
                      </button>
                    </div>

                    <Button 
                      className="bg-blue-700 hover:bg-blue-800"
                      onClick={() => setLeadModalOpen(true)}
                      data-testid="button-talk-to-experts"
                    >
                      Talk to Our Experts
                    </Button>
                  </div>
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
      </main>
      
      <footer className="bg-slate-50 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
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
