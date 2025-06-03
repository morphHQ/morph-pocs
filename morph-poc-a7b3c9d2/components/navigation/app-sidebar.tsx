"use client";

import type React from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import { ChevronDown, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ConnectorId, mocked } from "@/lib/mocked-data";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [selectedConnectorId, setSelectedConnectorId] =
    useState<ConnectorId | null>(null);

  // Set initial connector ID based on URL path
  useEffect(() => {
    const pathParts = pathname.split("/");
    const connectorIdIndex = pathParts.findIndex(
      (part) => part === "client" || part === "server"
    );

    if (connectorIdIndex !== -1 && connectorIdIndex + 1 < pathParts.length) {
      const connectorId = pathParts[connectorIdIndex + 1];
      // Validate that the connector ID exists in our mocked connectors
      if (mocked.connectors.list().some((c) => c.id === connectorId)) {
        setSelectedConnectorId(connectorId as ConnectorId);
      }
    }
  }, [pathname]);

  const isResourceActive = (model: string) => {
    return pathname.includes(`/resources/${model}`);
  };

  // Determine if we're in server or client mode
  const isServerMode = pathname.startsWith("/server");
  const baseResourcePath = isServerMode
    ? `/server/${selectedConnectorId}/resources`
    : `/client/${selectedConnectorId}/resources`;

  const handleConnectorChange = (connectorId: ConnectorId) => {
    setSelectedConnectorId(connectorId);

    // Navigate to connection page for the selected connection
    router.push(`/server/${connectorId}/connection`);
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b h-14 flex items-center">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              {selectedConnectorId
                ? mocked.connectors.get(selectedConnectorId)?.name
                : "Select a connector"}
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[280px] p-0" align="start">
            <Command>
              <CommandList>
                <CommandEmpty>No connections found.</CommandEmpty>
                {mocked.connectors.list().map((connector) => (
                  <CommandItem
                    key={connector.id}
                    value={connector.id}
                    onSelect={() => handleConnectorChange(connector.id)}
                  >
                    {connector.name}
                  </CommandItem>
                ))}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Connection</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.includes(
                    `/server/${selectedConnectorId}/connection`
                  )}
                >
                  {selectedConnectorId ? (
                    <Link href={`/server/${selectedConnectorId}/connection`}>
                      <Settings className="h-4 w-4" />
                      <span>
                        Configure{" "}
                        {mocked.connectors.get(selectedConnectorId)?.name}{" "}
                      </span>
                    </Link>
                  ) : (
                    <span>No connection selected</span>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Resources Section */}
        <SidebarGroup>
          <SidebarGroupLabel>
            Resources {isServerMode ? "(server)" : "(client)"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mocked.models.list().map((model) => (
                <SidebarMenuItem key={model.id}>
                  <SidebarMenuButton
                    asChild
                    isActive={isResourceActive(model.id)}
                  >
                    <Link href={`${baseResourcePath}/${model.id}`}>
                      {model.icon}
                      <span>{model.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t p-4">
        <div className="text-xs text-muted-foreground">
          {mocked.morphPocId()}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
