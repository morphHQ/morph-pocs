"use client";
import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";

import { type ModelId, mocked } from "@/lib/mocked-data";
import { notFound, useRouter } from "next/navigation";
import { EditableCell } from "@/components/resources/editable-cell";
import { useDebouncedCallback } from "use-debounce";
import { useMorph } from "@runmorph/atoms";
import { useToast } from "@/components/ui/use-toast";

/**
 * Props interface for the ClientResourceTable component
 * @interface ClientResourceTableProps
 * @property {ModelId} model - The model identifier for the resources to display
 * @property {string} sessionToken - The session token for authentication
 */
interface ClientResourceTableProps {
  model: ModelId;
  sessionToken: string;
}

/**
 * ClientResourceTable Component
 *
 * A client-side table component that displays and manages resources from a Morph connector.
 * Features include:
 * - Real-time search with debouncing
 * - Pagination with "Load More" functionality
 * - Inline cell editing
 * - Dynamic column type inference
 * - Optimistic updates
 *
 * @param {ClientResourceTableProps} props - Component props
 * @returns {JSX.Element} The resource table component
 */
export function ClientResourceTable({
  model,
  sessionToken,
}: ClientResourceTableProps) {
  const morph = useMorph();
  const { toast } = useToast();
  const router = useRouter();

  // State management
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [rows, setRows] = useState<any[]>([]);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  // Get model details and validate
  const modelDetails = mocked.models.get(model);
  if (!modelDetails) {
    notFound();
  }

  // Generate table columns from model fields
  const allColumns = [...modelDetails.fields].map((field) => ({
    id: field.id,
    header: field.name,
    type: "text", // Default type, will be updated based on data
  }));

  /**
   * Calculate optimal column width based on header length
   * @param {string} header - The column header text
   * @returns {number} The calculated width in pixels
   */
  const getColumnWidth = (header: string) => {
    const minWidth = Math.max(header.length * 8 + 32, 120); // 8px per character + padding, minimum 120px
    const maxWidth = 300; // Maximum width
    return Math.min(minWidth, maxWidth);
  };

  // Debounce search input to prevent excessive API calls
  const debouncedSearchCallback = useDebouncedCallback((value: string) => {
    setDebouncedSearch(value);
  }, 300);

  useEffect(() => {
    debouncedSearchCallback(search);
  }, [search, debouncedSearchCallback]);

  /**
   * Load resources from the Morph API
   * @param {boolean} isLoadMore - Whether this is a "load more" request
   */
  const loadResources = useCallback(
    async (isLoadMore = false) => {
      const currentCursor = isLoadMore ? cursor : undefined;

      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        // Get all field IDs for the model
        const fields = modelDetails.fields.map((field) => field.id);

        // Initialize connection and resources
        const connection = morph.connections({ sessionToken });
        const resources = connection.resources(model);

        // Fetch resources with pagination and search
        const { data, error, next } = await resources.list({
          fields,
          limit: 20,
          q: debouncedSearch.length > 0 ? debouncedSearch : undefined,
          cursor: currentCursor,
        });

        if (error) {
          toast({
            title: "Error loading resources",
            description: "Failed to load resources. Please try again.",
            variant: "destructive",
          });
          return;
        }

        // Update column types based on actual data
        data.forEach((item) => {
          modelDetails.fields.forEach((field) => {
            // @ts-ignore –– as we are displaying different resource models; there is no intersection between the fields
            const value = item.fields[field.id];
            if (value !== undefined) {
              const column = allColumns.find((col) => col.id === field.id);
              if (column) {
                // Infer type from value
                if (typeof value === "number") column.type = "number";
                else if (typeof value === "boolean") column.type = "boolean";
                else if (
                  value instanceof Date ||
                  (typeof value === "string" && !isNaN(Date.parse(value)))
                )
                  column.type = "date";
              }
            }
          });
        });

        // Update rows based on whether this is a "load more" request
        if (isLoadMore) {
          setRows((prev) => [...prev, ...data]);
        } else {
          setRows(data);
        }

        setCursor(next || undefined);
        setHasMore(next !== null);
      } catch (error) {
        toast({
          title: "Error loading resources",
          description: "Failed to load resources. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setInitialLoad(false);
      }
    },
    [debouncedSearch, toast]
  );

  // Load resources when session token or search changes
  useEffect(() => {
    if (sessionToken) {
      setRows([]);
      setCursor(undefined);
      setHasMore(true);
      loadResources();
    }
  }, [sessionToken, debouncedSearch, loadResources]);

  /**
   * Handle cell value updates
   * @param {string} rowId - The ID of the row being updated
   * @param {string} columnId - The ID of the column being updated
   * @param {any} value - The new value
   */
  const handleCellUpdate = async (
    rowId: string,
    columnId: string,
    value: any
  ) => {
    // Optimistic update
    setRows((prev) =>
      prev.map((row) =>
        row.id === rowId ? { ...row, [columnId]: value } : row
      )
    );

    try {
      // Update resource in Morph
      const connection = morph.connections({ sessionToken });
      const resources = connection.resources(model);
      const { error } = await resources.update(rowId, {
        [columnId]: value,
      });

      if (error) {
        toast({
          title: "Error updating resource",
          description: "Failed to update the value. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Update local state with the new value
      setRows((prev) =>
        prev.map((row) =>
          row.id === rowId
            ? { ...row, fields: { ...row.fields, [columnId]: value } }
            : row
        )
      );

      toast({
        title: "Value updated",
        description: `Updated ${columnId} for record ${rowId.substring(
          0,
          8
        )}...`,
      });
    } catch (error) {
      // Revert optimistic update on error
      loadResources();
      toast({
        title: "Update failed",
        description: "Failed to update the value. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLoadMore = () => {
    if (hasMore && !loadingMore) {
      loadResources(true);
    }
  };

  // Show connection required message if no session token
  if (!sessionToken) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No connected tools</CardTitle>
          <CardDescription>
            You need to connect at least one tool to view {modelDetails.name}s.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button onClick={() => router.push("/connections")}>
            Go to Connections
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search input */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex w-full sm:max-w-sm gap-2">
          <Input
            type="search"
            placeholder={`Search ${modelDetails.name}s...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Resources table */}
      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {allColumns.map((column) => (
                  <TableHead
                    key={column.id}
                    className="whitespace-nowrap"
                    style={{
                      minWidth: `${getColumnWidth(column.header)}px`,
                      maxWidth: "300px",
                    }}
                  >
                    <div className="truncate" title={column.header}>
                      {column.header}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialLoad ? (
                <TableRow>
                  <TableCell
                    colSpan={allColumns.length}
                    className="h-24 text-center"
                  >
                    Loading...
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={allColumns.length}
                    className="h-24 text-center"
                  >
                    {loading ? "Loading..." : "No results found."}
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.id}>
                    {allColumns.map((column) => {
                      const value = row.fields[column.id];
                      return (
                        <TableCell
                          key={`${row.id}-${column.id}`}
                          className="whitespace-nowrap"
                          style={{
                            minWidth: `${getColumnWidth(column.header)}px`,
                            maxWidth: "300px",
                          }}
                        >
                          <div className="truncate">
                            <EditableCell
                              value={value}
                              type={column.type as any}
                              options={[]}
                              onUpdate={(value) =>
                                handleCellUpdate(row.id, column.id, value)
                              }
                            />
                          </div>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Load more button */}
      {hasMore && rows.length > 0 && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={loadingMore || !sessionToken}
            className="min-w-[120px]"
          >
            {loadingMore ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Load More"
            )}
          </Button>
        </div>
      )}

      {/* No more results message */}
      {!hasMore && rows.length > 0 && (
        <div className="text-center text-sm text-muted-foreground py-4">
          No more results to load
        </div>
      )}
    </div>
  );
}
