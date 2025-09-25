import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { FileText, Users, Database, RefreshCw, Plus } from "lucide-react";

export default function AdminDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: programs = [], isLoading: programsLoading } = useQuery({
    queryKey: ["/api/admin/programs"],
    queryFn: api.admin.getPrograms,
  });

  const { data: leads = [], isLoading: leadsLoading } = useQuery({
    queryKey: ["/api/admin/leads"],
    queryFn: api.admin.getLeads,
  });

  const publishMutation = useMutation({
    mutationFn: api.admin.publishProgram,
    onSuccess: () => {
      toast({ title: "Program published successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/programs"] });
    },
    onError: () => {
      toast({ title: "Error publishing program", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: api.admin.deleteProgram,
    onSuccess: () => {
      toast({ title: "Program deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/programs"] });
    },
    onError: () => {
      toast({ title: "Error deleting program", variant: "destructive" });
    },
  });

  const filteredPrograms = programs.filter(program => 
    program.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (sourceFilter === "" || program.source === sourceFilter)
  );

  const stats = {
    totalPrograms: programs.length,
    activePrograms: programs.filter(p => p.status === 'open').length,
    newLeads: leads.filter(l => l.status === 'new').length,
    lastSync: "2h",
  };

  return (
    <div className="p-8 space-y-8" data-testid="admin-dashboard">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Program Management</h1>
          <p className="text-muted-foreground">Manage incentive programs and review data changes</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="outline" data-testid="button-sync-data">
            <RefreshCw className="w-4 h-4 mr-2" />
            Sync DSIRE Data
          </Button>
          <Button data-testid="button-add-program">
            <Plus className="w-4 h-4 mr-2" />
            Add Program
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Programs</p>
                <p className="text-2xl font-bold text-foreground" data-testid="stat-total-programs">
                  {stats.totalPrograms}
                </p>
              </div>
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-primary" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">+12 this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Programs</p>
                <p className="text-2xl font-bold text-foreground" data-testid="stat-active-programs">
                  {stats.activePrograms}
                </p>
              </div>
              <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center">
                <Database className="w-4 h-4 text-accent" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {Math.round((stats.activePrograms / stats.totalPrograms) * 100)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">New Leads</p>
                <p className="text-2xl font-bold text-foreground" data-testid="stat-new-leads">
                  {stats.newLeads}
                </p>
              </div>
              <div className="w-8 h-8 bg-destructive/10 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-destructive" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">This week</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Last Sync</p>
                <p className="text-2xl font-bold text-foreground" data-testid="stat-last-sync">
                  {stats.lastSync}
                </p>
              </div>
              <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                <RefreshCw className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">ago</p>
          </CardContent>
        </Card>
      </div>

      {/* Programs Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Program Updates</CardTitle>
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Search programs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
                data-testid="input-search-programs"
              />
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="All Sources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Sources</SelectItem>
                  <SelectItem value="dsire">DSIRE</SelectItem>
                  <SelectItem value="utility">Utility</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Program</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {programsLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">Loading programs...</TableCell>
                </TableRow>
              ) : filteredPrograms.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No programs found
                  </TableCell>
                </TableRow>
              ) : (
                filteredPrograms.map((program) => (
                  <TableRow key={program.id} data-testid={`row-program-${program.id}`}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{program.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {program.sectorTags?.join(', ')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{program.owner}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{program.incentiveType}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={program.status === 'open' ? 'default' : 'secondary'}
                        data-testid={`badge-status-${program.id}`}
                      >
                        {program.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {program.updatedAt ? new Date(program.updatedAt).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          data-testid={`button-edit-${program.id}`}
                        >
                          Edit
                        </Button>
                        {program.status !== 'open' && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => publishMutation.mutate(program.id)}
                            disabled={publishMutation.isPending}
                            data-testid={`button-publish-${program.id}`}
                          >
                            Publish
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => deleteMutation.mutate(program.id)}
                          disabled={deleteMutation.isPending}
                          className="text-destructive hover:text-destructive"
                          data-testid={`button-delete-${program.id}`}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
