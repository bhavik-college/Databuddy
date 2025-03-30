"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Globe, MoreHorizontal, Plus, ExternalLink, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { WebsiteDialog } from "@/components/website-dialog";
import { useWebsites } from "@/hooks/use-websites";

export default function WebsitesPage() {
  const searchParams = useSearchParams();
  const shouldOpenDialog = searchParams.get('new') === 'true';
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const {
    websites,
    isLoading,
    isError,
    createWebsite,
    isCreating,
    updateWebsite,
    isUpdating,
    deleteWebsite,
    isDeleting,
    refetch,
  } = useWebsites();
  
  const [websiteToDelete, setWebsiteToDelete] = useState<string | null>(null);

  // Handle the query parameter to open the dialog
  useEffect(() => {
    if (shouldOpenDialog) {
      setDialogOpen(true);
    }
  }, [shouldOpenDialog]);

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (websiteToDelete) {
      deleteWebsite(websiteToDelete);
      setWebsiteToDelete(null);
    }
  };

  if (isError) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Websites</h1>
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground mb-4">
            Failed to load websites. Please try again.
          </p>
          <Button onClick={() => refetch()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Websites</h1>
          <p className="text-muted-foreground mt-1">
            Manage your websites for analytics tracking
          </p>
        </div>
        <WebsiteDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSubmit={(data) => createWebsite(data)}
          isSubmitting={isCreating}
        >
          <Button size="default" className="h-10">
            <Plus className="h-4 w-4 mr-2" />
            Add Website
          </Button>
        </WebsiteDialog>
      </div>

      {/* Show loading skeletons */}
      {isLoading && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="relative overflow-hidden border-border/60 shadow-sm card-hover-effect">
              <CardHeader className="gap-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Show empty state */}
      {!isLoading && websites.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 border border-dashed rounded-lg bg-accent/20">
          <Globe className="h-16 w-16 text-muted-foreground mb-5 opacity-80" />
          <h3 className="text-xl font-semibold mb-2">No websites added yet</h3>
          <p className="text-muted-foreground text-center max-w-md mb-6">
            Add your first website to start tracking analytics and insights.
          </p>
          <WebsiteDialog
            onSubmit={(data) => createWebsite(data)}
            isSubmitting={isCreating}
          >
            <Button size="lg">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Website
            </Button>
          </WebsiteDialog>
        </div>
      )}

      {/* Show website grid */}
      {!isLoading && websites.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {websites.map((website) => (
            <Card key={website.id} className="relative overflow-hidden border-border/60 shadow-sm card-hover-effect">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="truncate text-lg">{website.name}</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="h-8 w-8 p-0 focus-ring"
                      >
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild className="focus-ring cursor-pointer">
                        <Link href={`/websites/${website.id}`} className="flex items-center w-full">
                          <ExternalLink className="h-4 w-4 mr-2.5" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <WebsiteDialog
                        website={website}
                        onSubmit={(data) =>
                          updateWebsite({
                            id: website.id,
                            data,
                          })
                        }
                        isSubmitting={isUpdating}
                      >
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="focus-ring cursor-pointer">
                          <Pencil className="h-4 w-4 mr-2.5" />
                          Edit Website
                        </DropdownMenuItem>
                      </WebsiteDialog>
                      <AlertDialog open={websiteToDelete === website.id}>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive cursor-pointer focus-ring"
                            onSelect={(e) => {
                              e.preventDefault();
                              setWebsiteToDelete(website.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2.5" />
                            Delete Website
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="sm:max-w-md">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Website</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete {website.name}? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel
                              onClick={() => setWebsiteToDelete(null)}
                            >
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDeleteConfirm}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {isDeleting && websiteToDelete === website.id
                                ? "Deleting..."
                                : "Delete"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardTitle>
                <CardDescription className="truncate">
                  {website.domain}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block w-2 h-2 rounded-full bg-primary"></span>
                    Created {new Date(website.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full" variant="outline">
                  <Link href={`/websites/${website.id}`} className="flex items-center justify-center gap-2">
                    View Analytics
                    <ExternalLink className="h-4 w-4 ml-1 opacity-70" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 