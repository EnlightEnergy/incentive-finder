import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import logoPath from "@assets/Enlighting_Logo_F1_Web_1758840736815.png";

export default function NavigationHeader() {
  const [location] = useLocation();

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-end space-x-3">
              <img 
                src={logoPath} 
                alt="Enlighting Logo" 
                className="h-12 w-auto object-contain"
                data-testid="logo-enlighting"
              />
              <h1 className="text-xl font-semibold text-foreground leading-none pb-1 mt-1">Incentive Finder</h1>
            </Link>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/" className={`text-sm font-medium transition-colors ${location === '/' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              Find Incentives
            </Link>
            <Link href="/admin" className={`text-sm font-medium transition-colors ${location === '/admin' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              Admin
            </Link>
            <Button size="sm" data-testid="button-contact">
              Contact Sales
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}
