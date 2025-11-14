import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import NavigationHeader from "@/components/navigation-header";
import HeroSearchForm from "@/components/hero-search-form";
import ProgramCard from "@/components/program-card";
import FiltersPanel from "@/components/filters-panel";
import LeadCaptureModal from "@/components/lead-capture-modal";
import ProgramDetailsModal from "@/components/program-details-modal";
import ApplyEnlightingModal from "@/components/apply-enlighting-modal";
import { ChatBot } from "@/components/chatbot";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { api } from "@/lib/api";
import type { SearchProgramsParams, Program } from "@shared/schema";
import solarBgPath from "@assets/solar background_1762806461396.png";

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

  const { data: searchResponse, isLoading } = useQuery({
    queryKey: ["/api/programs", searchParams, filters],
    queryFn: async () => {
      if (!searchParams) return { allPrograms: [] };
      
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
  
  // Extract programs from the response
  const rawPrograms = searchResponse?.allPrograms || [];
  const exactMatches = searchResponse?.exactMatches || [];
  const otherPrograms = searchResponse?.otherPrograms || [];
  const hasTwoTiers = exactMatches.length > 0 && otherPrograms.length > 0;
  const totalPrograms = exactMatches.length + otherPrograms.length + rawPrograms.length;


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
      <Helmet>
        <title>California Energy Incentives | Stackable Utility, State & Federal Rebates - Save Up to 70%</title>
        <meta name="description" content="Find California energy efficiency incentives for your commercial facility. Stack SCE, PG&E, SDG&E utility rebates with state grants and federal tax credits to cover up to 70% of upgrade costs. Instant search across thousands of programs." />
        <meta name="keywords" content="California energy incentives, utility rebates, SCE rebates, PG&E incentives, SDG&E programs, LADWP rebates, federal tax credits, ITC, energy efficiency, commercial rebates, stackable incentives, Los Angeles, San Francisco, San Diego, Title 24, CARB" />
        <link rel="canonical" href="https://www.californiaenergyincentives.com/" />
        
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.californiaenergyincentives.com/" />
        <meta property="og:title" content="California Energy Incentives - Stack Rebates to Save Up to 70%" />
        <meta property="og:description" content="Search thousands of California energy efficiency programs. Stack utility rebates, state grants, and federal tax credits for maximum savings on commercial upgrades." />
        <meta property="og:image" content="https://www.californiaenergyincentives.com/solar-background.png" />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://www.californiaenergyincentives.com/" />
        <meta name="twitter:title" content="California Energy Incentives - Stack Rebates to Save Up to 70%" />
        <meta name="twitter:description" content="Find and stack California energy efficiency incentives for your commercial facility." />
        <meta name="twitter:image" content="https://www.californiaenergyincentives.com/solar-background.png" />
        
        {/* Organization Schema */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Enlighting Energy",
            "legalName": "Enlighting Energy Consultants",
            "url": "https://www.californiaenergyincentives.com",
            "logo": "https://www.californiaenergyincentives.com/enlighting-logo.png",
            "description": "California energy efficiency consultants specializing in incentive discovery and stacking for commercial facilities",
            "address": {
              "@type": "PostalAddress",
              "addressRegion": "California",
              "addressCountry": "US"
            },
            "areaServed": {
              "@type": "State",
              "name": "California"
            },
            "sameAs": [
              "https://www.enlightingenergy.com"
            ]
          })}
        </script>
        
        {/* Service Schema */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            "serviceType": "Energy Efficiency Incentive Advisory",
            "provider": {
              "@type": "Organization",
              "name": "Enlighting Energy"
            },
            "areaServed": {
              "@type": "State",
              "name": "California"
            },
            "description": "California energy efficiency incentive discovery, qualification, and stacking services for commercial, industrial, and multifamily facilities. We help businesses maximize savings by combining utility rebates, state grants, and federal tax credits.",
            "offers": {
              "@type": "Offer",
              "description": "Stack utility rebates, state grants, and federal tax credits to cover up to 70% of energy efficiency upgrade costs"
            }
          })}
        </script>
        
        {/* WebSite + SearchAction Schema */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "California Energy Incentives",
            "url": "https://www.californiaenergyincentives.com",
            "description": "Search and discover stackable California energy efficiency incentives",
            "potentialAction": {
              "@type": "SearchAction",
              "target": {
                "@type": "EntryPoint",
                "urlTemplate": "https://www.californiaenergyincentives.com/?search={search_term_string}"
              },
              "query-input": "required name=search_term_string"
            }
          })}
        </script>
        
        {/* FAQPage Schema for AI Search */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "What California energy incentives are available for commercial facilities?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "California commercial facilities can access utility rebates from SCE, PG&E, SDG&E, and LADWP; state grants and programs; and federal tax credits including the Investment Tax Credit (ITC). These programs can be stacked to cover up to 70% of energy efficiency upgrade costs."
                }
              },
              {
                "@type": "Question",
                "name": "How does incentive stacking work in California?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Incentive stacking combines multiple funding sources for a single energy efficiency project. You can layer utility rebates (like SCE or PG&E programs), state-level grants, and federal tax credits (ITC, 179D) to maximize total savings. Typical stacking achieves 40-70% project cost coverage."
                }
              },
              {
                "@type": "Question",
                "name": "Which California utilities offer energy efficiency rebates?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Southern California Edison (SCE), Pacific Gas & Electric (PG&E), San Diego Gas & Electric (SDG&E), and Los Angeles Department of Water & Power (LADWP) all offer comprehensive energy efficiency rebate programs for commercial customers including prescriptive and performance-based incentives."
                }
              },
              {
                "@type": "Question",
                "name": "What is the typical timeline for receiving California energy rebates?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "California utility rebates typically process within 60-90 days after project completion and documentation submission. Federal tax credits are claimed on annual tax returns. State grants may have longer processing times depending on the specific program."
                }
              }
            ]
          })}
        </script>
        
        {/* HowTo Schema for 3-Step Process */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "HowTo",
            "name": "How to Find and Stack California Energy Efficiency Incentives",
            "description": "Step-by-step guide to discovering and maximizing California energy efficiency incentives for your commercial facility",
            "step": [
              {
                "@type": "HowToStep",
                "position": 1,
                "name": "Discover",
                "text": "Search available utility, state, and federal programs for your California facility address and NAICS code. Our database covers SCE, PG&E, SDG&E, LADWP, state agencies, and federal programs."
              },
              {
                "@type": "HowToStep",
                "position": 2,
                "name": "Qualify",
                "text": "Verify eligibility requirements, calculate estimated savings, and review application deadlines. We help with rebate calculations and qualification assessments."
              },
              {
                "@type": "HowToStep",
                "position": 3,
                "name": "Deliver (Optional)",
                "text": "If you want turnkey service, we engineer, install, commission, and file for incentives in one complete package, ensuring you capture every available dollar."
              }
            ],
            "totalTime": "PT1H"
          })}
        </script>
        
        {/* SpeakableSpecification for Voice/AI Read */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "California Energy Incentives Home",
            "speakable": {
              "@type": "SpeakableSpecification",
              "cssSelector": [".hero__kicker", ".hero__title", ".hero__sub", ".ai-summary"]
            }
          })}
        </script>
      </Helmet>
      <NavigationHeader />
      
      <main id="main-content" tabIndex={-1}>
      
      {/* New Hero Section */}
      <section 
        className="hero" 
        data-testid="hero-section"
        style={{
          backgroundImage: `url(${solarBgPath})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div 
          className="hero__inner"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.30)',
            padding: '1.5rem',
            borderRadius: '1rem',
            backdropFilter: 'blur(8px)'
          }}
        >
          <div className="hero__kicker" style={{ color: '#5B3A7D' }}>Find Energy Savings for Your Facility</div>
          <h1 className="hero__title" style={{ color: '#5B3A7D' }}>
            We help you discover every incentive<br />that your business qualifies for
          </h1>
          <p className="hero__sub" style={{ color: '#1e293b' }}>
            Utility rebates, state grants, and federal tax credits can cover up to 70% of your energy efficiency upgrade. We make it easy to find them all — and stack them together to maximize your savings.
          </p>
        </div>
      </section>
      
      {/* AI Summary Block for LLM Extraction */}
      <section className="bg-gradient-to-r from-purple-50 to-pink-50 py-8" aria-label="AI Summary">
        <div className="max-w-[1180px] mx-auto px-4">
          <div className="ai-summary text-center max-w-3xl mx-auto">
            <p className="text-lg text-slate-700">
              <strong className="text-[#5B3A7D]">AI Summary:</strong> California commercial facilities can stack utility rebates (SCE, PG&E, SDG&E, LADWP), state grants, and federal tax credits to cover up to 70% of energy efficiency upgrade costs. Search thousands of programs instantly by ZIP code and facility type.
            </p>
          </div>
        </div>
      </section>

      {/* Search Form Section - On white background */}
      <section className="bg-white py-16">
        <div className="max-w-[1180px] mx-auto px-4">
          <HeroSearchForm onSearch={handleSearch} />
        </div>
      </section>

      {searchParams && (
        <>
          {/* Results Summary */}
          <section className="summary" data-testid="results-summary">
            <div className="summary__card">
              <div className="summary__content">
                <div className="summary__info">
                  <h2 className="summary__title">Programs Found</h2>
                  <div className="summary__meta">
                    <span>Programs found: <strong>{hasTwoTiers ? exactMatches.length + otherPrograms.length : programs.length}</strong></span>
                    <span className="divider">•</span>
                    <span>Last updated: <span>Sep 2025</span></span>
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
            <div className="mx-auto px-4 sm:px-6 lg:px-8" style={{ maxWidth: '1180px' }}>
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
                    {hasTwoTiers ? (
                      <>
                        <span className="font-semibold text-slate-900">{exactMatches.length + otherPrograms.length} programs</span> available ({exactMatches.length} match selected measures)
                      </>
                    ) : (
                      <>
                        <span className="font-semibold text-slate-900">{programs.length} programs</span> match your criteria
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* Executive Savings Summary */}
              <div className="mb-8 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-[#B54BE3]/20">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-full bg-[#5B3A7D] flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">$</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-[#5B3A7D] mb-2">
                      Your Facility Could Save Thousands
                    </h3>
                    <p className="text-slate-700 text-base leading-relaxed mb-3">
                      Based on these {hasTwoTiers ? exactMatches.length + otherPrograms.length : programs.length} programs, 
                      similar California facilities typically save <strong className="text-[#5B3A7D]">40-70% on energy upgrade costs</strong> by 
                      stacking utility rebates, state grants, and federal tax incentives together.
                    </p>
                    <p className="text-sm text-slate-600">
                      Want to know your specific savings potential? 
                      <button 
                        onClick={() => setLeadModalOpen(true)}
                        className="ml-1 text-[#B54BE3] hover:text-[#9E3CCD] font-semibold underline"
                      >
                        Get your free personalized report →
                      </button>
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-foreground">Available Incentives</h3>
                <p className="text-slate-600 mt-1">
                  California utility, state, and federal energy efficiency programs
                </p>
              </div>

              {/* 2-Column Layout: Programs + Right Rail Card */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Programs Column (left, takes 2/3 of space) */}
                <div className="lg:col-span-2">
                  {/* Results */}
              {isLoading ? (
                <div className="text-center py-12" data-testid="loading-state">
                  <p className="text-slate-600">Searching for programs...</p>
                </div>
              ) : totalPrograms === 0 ? (
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
                      className="bg-[#5B3A7D] hover:bg-[#4A2F66]"
                      onClick={() => setLeadModalOpen(true)}
                      data-testid="button-talk-to-experts"
                    >
                      Talk to Our Experts
                    </Button>
                  </div>
                </div>
              ) : (exactMatches.length > 0 || otherPrograms.length > 0) ? (
                <div className="space-y-8">
                  {/* Exact Matches Section */}
                  {exactMatches.length > 0 && (
                    <div data-testid="exact-matches-section">
                      <div className="mb-4">
                        <h4 className="text-xl font-bold text-slate-900">
                          Programs matching your criteria ({exactMatches.length})
                        </h4>
                        <p className="text-sm text-slate-600 mt-1">
                          These programs match your selected measures
                        </p>
                      </div>
                      <div className="space-y-4">
                        {exactMatches.map((program) => (
                          <ProgramCard
                            key={program.id}
                            program={program}
                            onViewDetails={handleViewDetails}
                            onApplyEnlighting={handleApplyEnlighting}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Consultation CTA - Only show when both tiers exist */}
                  {hasTwoTiers && (
                    <div className="bg-slate-50 rounded-xl p-6 border border-slate-200" data-testid="consultation-cta">
                      <p className="text-slate-700 text-sm mb-3">
                        💡 <strong>Not sure which programs fit your specific project?</strong> Our experts can help you identify all available incentives and maximize your savings.
                      </p>
                      <Button 
                        className="bg-[#0c558c] hover:bg-[#0a4876]"
                        onClick={() => setLeadModalOpen(true)}
                        data-testid="button-get-consultation"
                      >
                        Get Free Consultation
                      </Button>
                    </div>
                  )}

                  {/* Other Programs Section */}
                  {otherPrograms.length > 0 && (
                    <div data-testid="other-programs-section">
                      <div className="mb-4">
                        <h4 className="text-xl font-bold text-slate-900">
                          Other programs available for your facility ({otherPrograms.length})
                        </h4>
                        <p className="text-sm text-slate-600 mt-1">
                          Additional programs that may apply based on your location and business type
                        </p>
                      </div>
                      <div className="space-y-4">
                        {otherPrograms.map((program) => (
                          <ProgramCard
                            key={program.id}
                            program={program}
                            onViewDetails={handleViewDetails}
                            onApplyEnlighting={handleApplyEnlighting}
                          />
                        ))}
                      </div>
                    </div>
                  )}
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
                
                {/* Right Rail CTA Card (right, takes 1/3 of space) */}
                <div className="lg:col-span-1">
                  <div className="sticky top-8">
                    <Card className="bg-white shadow-md rounded-xl p-6" data-testid="right-rail-cta">
                      <h4 className="font-bold text-lg mb-3 text-slate-900">Questions about these programs?</h4>
                      <p className="text-sm text-slate-600 mb-6">
                        We help you understand which incentives work best for your facility — and handle the entire process from application to installation.
                      </p>
                      <div className="space-y-3">
                        <Button 
                          className="w-full bg-[#B54BE3] hover:bg-[#9E3CCD]"
                          onClick={() => setLeadModalOpen(true)}
                          data-testid="button-talk-to-engineer"
                        >
                          Get My Free Savings Report
                        </Button>
                        <Button 
                          variant="outline"
                          className="w-full border-[#5aafef] border-opacity-28 hover:bg-[#5aafef] hover:bg-opacity-8"
                          onClick={() => setLeadModalOpen(true)}
                          data-testid="button-email-report-rail"
                        >
                          Talk to an Engineer
                        </Button>
                      </div>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
        </section>
        </>
      )}

      {/* Utility Logo Trust Strip */}
      <div className="bg-slate-50 py-8 border-t border-gray-200 border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-6">
            <p className="text-sm font-medium text-slate-600 uppercase tracking-wide">
              Partner utilities & programs
            </p>
          </div>
          <div className="flex justify-center items-center gap-8 lg:gap-12 flex-wrap pb-8">
            <div className="text-xl font-bold text-slate-400 hover:text-[#5B3A7D] transition-colors cursor-default">SCE</div>
            <div className="text-xl font-bold text-slate-400 hover:text-[#5B3A7D] transition-colors cursor-default">PG&E</div>
            <div className="text-xl font-bold text-slate-400 hover:text-[#5B3A7D] transition-colors cursor-default">SDG&E</div>
            <div className="text-xl font-bold text-slate-400 hover:text-[#5B3A7D] transition-colors cursor-default">LADWP</div>
            <div className="text-lg font-semibold text-slate-400 hover:text-[#5B3A7D] transition-colors cursor-default">SoCalREN</div>
            <div className="text-lg font-semibold text-slate-400 hover:text-[#5B3A7D] transition-colors cursor-default">MCE</div>
            <div className="text-lg font-semibold text-slate-400 hover:text-[#5B3A7D] transition-colors cursor-default">GoGreen Financing</div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <section className="bg-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#5B3A7D] mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-slate-600">
              Common questions about California energy efficiency incentives
            </p>
          </div>
          
          <Accordion type="single" collapsible className="w-full space-y-4">
            <AccordionItem value="faq-1" className="border border-slate-200 rounded-lg overflow-hidden" data-testid="faq-item-1">
              <AccordionTrigger className="px-6 py-4 hover:bg-purple-50 data-[state=open]:bg-[#5B3A7D] data-[state=open]:text-white transition-colors" data-testid="faq-trigger-1">
                <span className="text-left font-semibold">What California energy incentives are available for commercial facilities?</span>
              </AccordionTrigger>
              <AccordionContent className="px-6 py-4 bg-white" data-testid="faq-content-1">
                <p className="text-slate-700 leading-relaxed">
                  California commercial facilities can access utility rebates from SCE, PG&E, SDG&E, and LADWP; state grants and programs; and federal tax credits including the Investment Tax Credit (ITC). These programs can be stacked to cover up to 70% of energy efficiency upgrade costs.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-2" className="border border-slate-200 rounded-lg overflow-hidden" data-testid="faq-item-2">
              <AccordionTrigger className="px-6 py-4 hover:bg-purple-50 data-[state=open]:bg-[#5B3A7D] data-[state=open]:text-white transition-colors" data-testid="faq-trigger-2">
                <span className="text-left font-semibold">How does incentive stacking work in California?</span>
              </AccordionTrigger>
              <AccordionContent className="px-6 py-4 bg-white" data-testid="faq-content-2">
                <p className="text-slate-700 leading-relaxed">
                  Incentive stacking combines multiple funding sources for a single energy efficiency project. You can layer utility rebates (like SCE or PG&E programs), state-level grants, and federal tax credits (ITC, 179D) to maximize total savings. Typical stacking achieves 40-70% project cost coverage.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-3" className="border border-slate-200 rounded-lg overflow-hidden" data-testid="faq-item-3">
              <AccordionTrigger className="px-6 py-4 hover:bg-purple-50 data-[state=open]:bg-[#5B3A7D] data-[state=open]:text-white transition-colors" data-testid="faq-trigger-3">
                <span className="text-left font-semibold">Which California utilities offer energy efficiency rebates?</span>
              </AccordionTrigger>
              <AccordionContent className="px-6 py-4 bg-white" data-testid="faq-content-3">
                <p className="text-slate-700 leading-relaxed">
                  Southern California Edison (SCE), Pacific Gas & Electric (PG&E), San Diego Gas & Electric (SDG&E), and Los Angeles Department of Water & Power (LADWP) all offer comprehensive energy efficiency rebate programs for commercial customers including prescriptive and performance-based incentives.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-4" className="border border-slate-200 rounded-lg overflow-hidden" data-testid="faq-item-4">
              <AccordionTrigger className="px-6 py-4 hover:bg-purple-50 data-[state=open]:bg-[#5B3A7D] data-[state=open]:text-white transition-colors" data-testid="faq-trigger-4">
                <span className="text-left font-semibold">What is the typical timeline for receiving California energy rebates?</span>
              </AccordionTrigger>
              <AccordionContent className="px-6 py-4 bg-white" data-testid="faq-content-4">
                <p className="text-slate-700 leading-relaxed">
                  California utility rebates typically process within 60-90 days after project completion and documentation submission. Federal tax credits are claimed on annual tax returns. State grants may have longer processing times depending on the specific program.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Client Proof Strip */}
      <div className="bg-white py-8 border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-6">
            <p className="text-sm font-medium text-slate-600 uppercase tracking-wide">
              Trusted by leading California businesses
            </p>
          </div>
          <div className="flex justify-center items-center gap-8 lg:gap-12 flex-wrap">
            <img src={boeingLogo} alt="Boeing" className="h-12 grayscale opacity-60 hover:opacity-100 hover:grayscale-0 transition-all duration-300" />
            <img src={dreamworksLogo} alt="DreamWorks" className="h-12 grayscale opacity-60 hover:opacity-100 hover:grayscale-0 transition-all duration-300" />
            <img src={edcoLogo} alt="EDCO" className="h-6 grayscale opacity-60 hover:opacity-100 hover:grayscale-0 transition-all duration-300" />
            <img src={fenderLogo} alt="Fender" className="h-12 grayscale opacity-60 hover:opacity-100 hover:grayscale-0 transition-all duration-300" />
            <img src={howmetLogo} alt="Howmet Aerospace" className="h-8 grayscale opacity-60 hover:opacity-100 hover:grayscale-0 transition-all duration-300" />
            <img src={metroLogo} alt="Metro" className="h-6 grayscale opacity-60 hover:opacity-100 hover:grayscale-0 transition-all duration-300" />
            <img src={nasaJplLogo} alt="NASA JPL" className="h-8 grayscale opacity-60 hover:opacity-100 hover:grayscale-0 transition-all duration-300" />
            <img src={nipponLogo} alt="Nippon Express" className="h-8 grayscale opacity-60 hover:opacity-100 hover:grayscale-0 transition-all duration-300" />
            <img src={redBullLogo} alt="Red Bull" className="h-8 grayscale opacity-60 hover:opacity-100 hover:grayscale-0 transition-all duration-300" />
          </div>
        </div>
      </div>

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
      
      <footer className="bg-[#5B3A7D] border-t border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="mb-4">
                <img 
                  src="/enlighting-logo-optimized.png" 
                  alt="Enlighting Energy Logo" 
                  className="h-12 w-auto"
                />
              </div>
              <p className="text-sm text-white">
                Over 36 years of combined expertise helping industrial, manufacturing, warehousing, and commercial facilities unlock and secure energy incentives.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-white mb-4">Services</h3>
              <ul className="space-y-2 text-sm text-white">
                <li>Locate and Target Incentives</li>
                <li>Energy Efficiency Audits</li>
                <li>Engineering Services</li>
                <li>Turnkey Upgrades</li>
                <li>Energy Project Consulting</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-white mb-4">Resources</h3>
              <ul className="space-y-2 text-sm text-white">
                <li>Documentation</li>
                <li>API Reference</li>
                <li>Case Studies</li>
                <li>Blog</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-white mb-4">Contact</h3>
              <ul className="space-y-2 text-sm text-white">
                <li>
                  <a 
                    href="mailto:hello@enlightingenergy.com" 
                    className="hover:text-white/80 transition-colors"
                    data-testid="link-footer-email"
                  >
                    hello@enlightingenergy.com
                  </a>
                </li>
                <li>
                  <a 
                    href="tel:+18057245299" 
                    className="hover:text-white/80 transition-colors"
                    data-testid="link-footer-phone"
                  >
                    805-724-5299
                  </a>
                </li>
                <li>Santa Barbara, CA</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-white/20 text-center text-sm text-white">
            <p>&copy; Enlighting Energy. All rights reserved. Data sourced from DSIRE, OpenEI, utility partners and aggregators.</p>
          </div>
        </div>
      </footer>

      <ChatBot />
    </div>
  );
}
