import { useEffect, useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen } from "lucide-react";
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrgData) }} />
      
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-[#0c558c]" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-4">
              {terminologyData.title}
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Essential terms and concepts to help you navigate energy efficiency incentives, rebates, and financing programs in California.
            </p>
          </div>

          <Card className="shadow-lg">
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
                    className="border border-slate-200 rounded-lg overflow-hidden"
                    data-testid={`accordion-item-${term.id}`}
                  >
                    <AccordionTrigger 
                      className="px-6 py-4 hover:bg-slate-50 data-[state=open]:bg-[#0c558c] data-[state=open]:text-white transition-colors"
                      data-testid={`accordion-trigger-${term.id}`}
                    >
                      <span className="text-left font-semibold">{term.name}</span>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 py-4 bg-white">
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm font-medium text-[#0c558c] mb-2">Definition</h3>
                          <p className="text-slate-700 leading-relaxed">{term.definition}</p>
                        </div>
                        
                        <div>
                          <h3 className="text-sm font-medium text-[#0c558c] mb-2">Example</h3>
                          <p className="text-slate-600 italic bg-slate-50 p-3 rounded border-l-4 border-[#00a5cb]">
                            {term.example}
                          </p>
                        </div>

                        {term.tags && term.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-2">
                            {term.tags.map((tag: string) => (
                              <Badge 
                                key={tag} 
                                variant="secondary" 
                                className="bg-[#00a5cb]/10 text-[#0c558c] hover:bg-[#00a5cb]/20"
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

          <div className="mt-8 text-center text-sm text-slate-600">
            <p>Have questions about these terms or need help with your energy efficiency project?</p>
            <p className="mt-2">
              <a href="/#hero-section" className="text-[#00a5cb] hover:text-[#0c558c] font-medium" data-testid="link-get-report">
                Get your free incentive report
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
