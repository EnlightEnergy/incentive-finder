import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import logoPath from "@assets/Enlighting_Logo_Web_1758865840922.png";

export default function NavigationHeader() {
  const [location] = useLocation();

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-4">
              <img 
                src={logoPath} 
                alt="Enlighting Logo" 
                className="h-16 w-auto object-contain"
                data-testid="logo-enlighting"
              />
              <div className="flex items-baseline space-x-2">
                <h1 className="text-3xl font-bold text-[#6B21A8] leading-none">enlighting</h1>
                <span className="text-3xl font-normal text-[#6B21A8] leading-none" style={{ fontFamily: 'Lato, sans-serif' }}>incentive finder</span>
              </div>
            </Link>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/" className={`text-sm font-medium transition-colors ${location === '/' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              Find Incentives
            </Link>
            <a href="https://www.enlightingenergy.com/about" target="_blank" rel="noopener noreferrer" className="text-sm font-medium transition-colors text-muted-foreground hover:text-foreground">
              About
            </a>
            <Button 
              size="sm" 
              asChild
              data-testid="button-contact"
            >
              <a href="mailto:hello@enlightingenergy.com">
                Contact Sales
              </a>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}
