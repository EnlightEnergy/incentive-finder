import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen } from "lucide-react";
import NavigationHeader from "@/components/navigation-header";
import terminologyData from "@shared/terminology-data.json";

interface Term {
  id: string;
  name: string;
  definition: string;
  example: string;
  tags: string[];
}

export default function Terminology() {
  const [openItem, setOpenItem] = useState<string | undefined>();

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      setOpenItem(hash);
      setTimeout(() => {
        const element = document.getElementById(hash);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 100);
    }
  }, []);

  const handleAccordionChange = (value: string) => {
    setOpenItem(value);
    if (value) {
      window.history.replaceState(null, "", `#${value}`);
    } else {
      window.history.replaceState(null, "", window.location.pathname);
    }
  };

  const schemaOrgData = {
    "@context": "https://schema.org",
    "@type": "DefinedTermSet",
    "name": terminologyData.title,
    "description": "Comprehensive glossary of energy efficiency incentive terminology for California commercial facilities",
    "hasDefinedTerm": terminologyData.terms.map((term: Term) => ({
      "@type": "DefinedTerm",
      "@id": `#${term.id}`,
      "name": term.name,
      "description": term.definition,
      "inDefinedTermSet": terminologyData.title
    }))
  };

  return (
    <>
      <Helmet>
        <title>California Energy Incentive Terminology | Rebate Glossary & Definitions</title>
        <meta name="description" content="Comprehensive glossary of California energy efficiency terms. Understand utility rebates, ITC, 179D, demand response, Title 24, and other key incentive terminology for commercial facilities." />
        <meta name="keywords" content="California energy incentive glossary, rebate definitions, energy efficiency terms, ITC, 179D, demand response, Title 24, CPUC, SCE programs, PG&E terminology, commercial rebates guide" />
        <link rel="canonical" href="https://www.californiaenergyincentives.com/terminology" />
        
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.californiaenergyincentives.com/terminology" />
        <meta property="og:title" content="California Energy Incentive Terminology - Rebate Glossary" />
        <meta property="og:description" content="Master the language of California energy incentives with our comprehensive glossary covering utility rebates, tax credits, and energy efficiency programs." />
        <meta property="og:image" content="https://www.californiaenergyincentives.com/solar-background.png" />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://www.californiaenergyincentives.com/terminology" />
        <meta name="twitter:title" content="California Energy Incentive Terminology - Rebate Glossary" />
        <meta name="twitter:description" content="Master the language of California energy incentives with our comprehensive glossary." />
        <meta name="twitter:image" content="https://www.californiaenergyincentives.com/solar-background.png" />
        
        {/* SpeakableSpecification for Voice/AI Read */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "California Energy Incentive Terminology",
            "speakable": {
              "@type": "SpeakableSpecification",
              "cssSelector": [".terminology-title", ".terminology-intro", ".ai-summary"]
            }
          })}
        </script>
        
        {/* BreadcrumbList Schema */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://www.californiaenergyincentives.com"
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Terminology",
                "item": "https://www.californiaenergyincentives.com/terminology"
              }
            ]
          })}
        </script>
      </Helmet>
      
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrgData) }} />
      
      <div className="min-h-screen bg-[#1C2B5E]">
        <NavigationHeader />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-[#C84EC4]" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-white mb-4 terminology-title">
              {terminologyData.title}
            </h1>
            <p className="text-lg text-blue-200 max-w-2xl mx-auto terminology-intro">
              Essential terms and concepts to help you navigate energy efficiency incentives, rebates, and financing programs in California.
            </p>
          </div>

          {/* AI Summary Block for LLM Extraction */}
          <div className="mb-8 bg-white/10 border border-white/20 p-6 rounded-lg">
            <div className="ai-summary">
              <p className="text-base text-blue-100">
                <strong className="text-white">AI Summary:</strong> California energy efficiency terminology glossary covering key terms including utility rebates (SCE, PG&E, SDG&E), tax incentives (ITC, 179D), demand response programs, Title 24 compliance, CPUC regulations, and commercial incentive structures for California businesses.
              </p>
            </div>
          </div>

          <Card className="shadow-lg bg-white/5 border border-white/20">
            <CardContent className="p-6">
              <Accordion
                type="single"
                collapsible
                className="w-full space-y-2"
                value={openItem}
                onValueChange={handleAccordionChange}
              >
                {terminologyData.terms.map((term: Term) => (
                  <AccordionItem
                    key={term.id}
                    value={term.id}
                    id={term.id}
                    className="border border-white/20 rounded-lg overflow-hidden"
                    data-testid={`accordion-item-${term.id}`}
                  >
                    <AccordionTrigger
                      className="px-6 py-4 text-white hover:bg-white/10 data-[state=open]:bg-[#C84EC4] data-[state=open]:text-white transition-colors"
                      data-testid={`accordion-trigger-${term.id}`}
                    >
                      <span className="text-left font-semibold">{term.name}</span>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 py-4 bg-white/5">
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm font-medium text-[#C84EC4] mb-2">Definition</h3>
                          <p className="text-blue-100 leading-relaxed">{term.definition}</p>
                        </div>

                        <div>
                          <h3 className="text-sm font-medium text-[#C84EC4] mb-2">Example</h3>
                          <p className="text-blue-200 italic bg-white/10 p-3 rounded border-l-4 border-[#C84EC4]">
                            {term.example}
                          </p>
                        </div>

                        {term.tags && term.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-2">
                            {term.tags.map((tag: string) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="bg-white/10 text-blue-200 hover:bg-white/20 border border-white/20"
                                data-testid={`tag-${tag}`}
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          <div className="mt-8 text-center text-sm text-blue-200">
            <p>Have questions about these terms or need help with your energy efficiency project?</p>
            <p className="mt-2">
              <a href="/#hero-section" className="text-[#C84EC4] hover:text-white font-medium" data-testid="link-get-report">
                Get your free incentive report
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
