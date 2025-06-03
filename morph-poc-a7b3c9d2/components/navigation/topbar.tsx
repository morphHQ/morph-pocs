"use client";

import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Switch } from "@/components/ui/switch";
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { usePathname, useRouter } from "next/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from "next/link";

function Breadcrumb({ pathname }: { pathname: string }) {
  // Parse the pathname to create breadcrumb segments
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return (
      <div className="flex items-center text-sm text-muted-foreground">
        <span>/</span>
      </div>
    );
  }

  const breadcrumbItems = segments.map((segment, index) => {
    const isLast = index === segments.length - 1;
    const isDynamic =
      (segments[index - 1] === "resources" && index === segments.length - 1) || // model parameter
      ((segments[0] === "server" || segments[0] === "client") &&
        segments[1] &&
        index === 1); // connector parameter

    let tooltip = "";

    // Handle dynamic segments
    if (isDynamic) {
      if (segments[index - 1] === "resources") {
        // This is a model parameter
        tooltip = `[modelId]`;
      } else if (index === 1) {
        // This is a connector parameter
        tooltip = `[connectorId]`;
      }
    }

    return (
      <div key={index} className="flex items-center">
        <span className="text-muted-foreground mx-1">/</span>
        {isDynamic ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-foreground font-medium">{segment}</span>
              </TooltipTrigger>
              <TooltipContent>
                <p>{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <span className="text-muted-foreground">{segment}</span>
        )}
      </div>
    );
  });

  return <div className="flex items-center text-sm">{breadcrumbItems}</div>;
}

export function Topbar() {
  const [isClientSide, setIsClientSide] = useState(true);
  const { toast } = useToast();
  const pathname = usePathname();
  const router = useRouter();

  // Check if we're on a resource page
  const isResourcePage = pathname.includes("/resources/");

  // Sync the toggle with the current route
  useEffect(() => {
    setIsClientSide(pathname.startsWith("/client"));
  }, [pathname]);

  const handleToggleChange = (checked: boolean) => {
    const newMode = checked ? "client" : "server";

    // Extract the model from current path
    const modelMatch = pathname.match(/\/resources\/([^/]+)/);
    const connectorMatch = pathname.match(/\/(server|client)\/([^/]+)/);

    if (modelMatch) {
      const model = modelMatch[1];
      const connectorId = connectorMatch?.[2];
      const newPath = `/${newMode}/${connectorId}/resources/${model}`;
      router.push(newPath);

      toast({
        title: `Switched to ${checked ? "Client-side" : "Server-side"} mode`,
        description: `Requests will now be processed ${
          checked ? "client-side" : "server-side"
        }`,
      });
    }
  };

  return (
    <header className="border-b h-14 flex items-center px-4 gap-4">
      <SidebarTrigger />
      <Breadcrumb pathname={pathname} />
      <div className="flex-1" />

      {/* Server/Client Toggle - only on resource pages */}
      {isResourcePage && (
        <div className="flex items-center gap-2">
          <span
            className={`text-sm ${isClientSide && "text-muted-foreground"}`}
          >
            Server
          </span>
          <Switch
            id="request-mode"
            checked={isClientSide}
            onCheckedChange={handleToggleChange}
          />
          <span
            className={`text-sm ${!isClientSide && "text-muted-foreground"}`}
          >
            Client
          </span>
        </div>
      )}

      <Link
        href="https://docs.runmorph.dev/api-reference/atoms/quick-start"
        target="_blank"
      >
        <Button variant="outline" size="sm" className="text-sm">
          Morph Atoms Documentation
        </Button>
      </Link>
    </header>
  );
}
