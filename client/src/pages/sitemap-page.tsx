import { Helmet } from "react-helmet-async";
import { Link } from "wouter";
import NavigationHeader from "@/components/navigation-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Map, FileText, Home } from "lucide-react";
import terminologyData from "@shared/terminology-data.json";

export default function SitemapPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <Helmet>
        <title>Site Map | California Energy Incentives</title>
        <meta name="description" content="Complete site map for California Energy Incentives. Browse all pages, resources, and terminology entries for easy navigation." />
        <link rel="canonical" href="https://www.californiaenergyincentives.com/sitemap" />
        
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.californiaenergyincentives.com/sitemap" />
        <meta property="og:title" content="Site Map - California Energy Incentives" />
        <meta property="og:description" content="Browse all pages and resources on California Energy Incentives." />
      </Helmet>
      
      <NavigationHeader />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">
              <Map className="w-8 h-8 text-[#5B3A7D]" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-[#5B3A7D] mb-4">
            Site Map
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Browse all pages and resources available on California Energy Incentives
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Main Pages */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#5B3A7D]">
                <Home className="w-5 h-5" />
                Main Pages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li>
                  <Link 
                    href="/" 
                    className="text-slate-700 hover:text-[#B54BE3] transition-colors font-medium"
                    data-testid="link-sitemap-home"
                  >
                    Home - California Energy Incentives Finder
                  </Link>
                  <p className="text-sm text-slate-500 mt-1">
                    Search thousands of California energy efficiency programs
                  </p>
                </li>
                <li>
                  <Link 
                    href="/terminology" 
                    className="text-slate-700 hover:text-[#B54BE3] transition-colors font-medium"
                    data-testid="link-sitemap-terminology"
                  >
                    Terminology - Energy Incentive Glossary
                  </Link>
                  <p className="text-sm text-slate-500 mt-1">
                    Essential terms and concepts for energy efficiency incentives
                  </p>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Terminology Entries */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#5B3A7D]">
                <FileText className="w-5 h-5" />
                Terminology Entries ({terminologyData.terms.length} terms)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto">
                <ul className="space-y-2">
                  {terminologyData.terms.map((term: { id: string; name: string }) => (
                    <li key={term.id}>
                      <a 
                        href={`/terminology#${term.id}`}
                        className="text-slate-700 hover:text-[#B54BE3] transition-colors text-sm"
                        data-testid={`link-sitemap-term-${term.id}`}
                      >
                        {term.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Information */}
        <Card className="mt-6">
          <CardContent className="p-6">
            <div className="prose prose-slate max-w-none">
              <h2 className="text-2xl font-bold text-[#5B3A7D] mb-4">About Our Site</h2>
              <p className="text-slate-700 mb-4">
                California Energy Incentives helps commercial facilities discover and stack utility rebates, 
                state grants, and federal tax credits to maximize energy efficiency savings. Our platform 
                covers programs from SCE, PG&E, SDG&E, LADWP, and other California utilities.
              </p>
              <p className="text-slate-700">
                For technical details, view our <a href="/sitemap.xml" className="text-[#B54BE3] hover:underline">XML sitemap</a> 
                {' '}or explore our comprehensive <Link href="/terminology" className="text-[#B54BE3] hover:underline">terminology guide</Link>.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
