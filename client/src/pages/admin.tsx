import { useState } from "react";
import NavigationHeader from "@/components/navigation-header";
import AdminDashboard from "@/components/admin-dashboard";
import { Card, CardContent } from "@/components/ui/card";
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider } from "@/components/ui/sidebar";
import { FileText, Users, Database, Settings } from "lucide-react";

export default function Admin() {
  const [activeSection, setActiveSection] = useState("programs");

  const menuItems = [
    { id: "programs", label: "Programs", icon: FileText },
    { id: "leads", label: "Leads", icon: Users },
    { id: "data-sources", label: "Data Sources", icon: Database },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background">
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-[#0c558c] text-white px-4 py-2 rounded-md z-50"
        data-testid="link-skip-to-main"
      >
        Skip to main content
      </a>
      <NavigationHeader />
      
      <SidebarProvider>
        <div className="flex h-screen">
          <Sidebar className="w-64 bg-card border-r border-border" data-testid="admin-sidebar">
            <SidebarHeader className="p-6">
              <h2 className="text-lg font-semibold text-foreground">Admin Dashboard</h2>
            </SidebarHeader>
            <SidebarContent>
              <SidebarMenu>
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => setActiveSection(item.id)}
                      isActive={activeSection === item.id}
                      data-testid={`sidebar-${item.id}`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarContent>
          </Sidebar>

          <main id="main-content" className="flex-1 overflow-hidden" tabIndex={-1}>
            {activeSection === "programs" && <AdminDashboard />}
            
            {activeSection === "leads" && (
              <div className="p-8">
                <h1 className="text-2xl font-bold text-foreground mb-4">Lead Management</h1>
                <Card>
                  <CardContent className="p-6">
                    <p className="text-muted-foreground">Lead management interface coming soon...</p>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {activeSection === "data-sources" && (
              <div className="p-8">
                <h1 className="text-2xl font-bold text-foreground mb-4">Data Sources</h1>
                <Card>
                  <CardContent className="p-6">
                    <p className="text-muted-foreground">Data source configuration coming soon...</p>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {activeSection === "settings" && (
              <div className="p-8">
                <h1 className="text-2xl font-bold text-foreground mb-4">Settings</h1>
                <Card>
                  <CardContent className="p-6">
                    <p className="text-muted-foreground">Settings interface coming soon...</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </main>
        </div>
      </SidebarProvider>
    </div>
  );
}
