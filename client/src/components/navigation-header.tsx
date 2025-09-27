import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, X } from "lucide-react";
import logoPath from "@assets/Enlighting_Logo_Web_1758865840922.png";

export default function NavigationHeader() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Programs" },
    { href: "https://www.enlightingenergy.com/insights", label: "Insights", external: true },
    { href: "https://www.enlightingenergy.com/about", label: "About", external: true }
  ];

  return (
    <header className="bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/">
              <img 
                src={logoPath} 
                alt="Enlighting Logo" 
                className="h-12 w-auto object-contain"
                data-testid="logo-enlighting"
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => 
              link.external ? (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium transition-colors text-slate-600 hover:text-blue-700"
                >
                  {link.label}
                </a>
              ) : (
                <Link 
                  key={link.href}
                  href={link.href} 
                  className={`text-sm font-medium transition-colors ${
                    location === link.href 
                      ? 'text-blue-700' 
                      : 'text-slate-600 hover:text-blue-700'
                  }`}
                >
                  {link.label}
                </Link>
              )
            )}
            <Button 
              asChild
              className="ml-4 bg-blue-700 hover:bg-blue-800 text-white"
              data-testid="button-get-report"
            >
              <a href="mailto:hello@enlightingenergy.com">
                Get My Report
              </a>
            </Button>
          </nav>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" data-testid="button-mobile-menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64">
                <div className="flex flex-col space-y-6 mt-8">
                  {navLinks.map((link) => 
                    link.external ? (
                      <a
                        key={link.href}
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-lg font-medium transition-colors text-slate-600 hover:text-blue-700"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link 
                        key={link.href}
                        href={link.href}
                        className={`text-lg font-medium transition-colors ${
                          location === link.href 
                            ? 'text-blue-700' 
                            : 'text-slate-600 hover:text-blue-700'
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {link.label}
                      </Link>
                    )
                  )}
                  <Button 
                    asChild
                    className="mt-6 bg-blue-700 hover:bg-blue-800 text-white justify-start"
                    data-testid="button-get-report-mobile"
                  >
                    <a 
                      href="mailto:hello@enlightingenergy.com"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Get My Report
                    </a>
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
