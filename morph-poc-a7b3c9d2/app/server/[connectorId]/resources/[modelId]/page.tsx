import { DashboardHeader } from "@/components/navigation/dashboard-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { type ConnectorId, type ModelId, mocked } from "@/lib/mocked-data";
import { morph } from "@/morph";
import { notFound } from "next/navigation";

/**
 * Props interface for the ServerResourcePage component
 * @interface ServerResourcePageProps
 * @property {Promise<{ connectorId: ConnectorId; modelId: ModelId }>} params - Route parameters
 * @property {Promise<{ q?: string }>} searchParams - Search query parameters
 */
interface ServerResourcePageProps {
  params: Promise<{
    connectorId: ConnectorId;
    modelId: ModelId;
  }>;
  searchParams: Promise<{
    q?: string;
  }>;
}

/**
 * ServerResourcePage Component
 *
 * This page displays a list of resources for a specific model in a connector.
 * It demonstrates how to:
 * 1. Fetch and display resources from a connector
 * 2. Implement search functionality
 * 3. Handle resource data in a table format
 *
 * @param {ServerResourcePageProps} props - Component props
 * @returns {Promise<JSX.Element>} The resource list page component
 */
export default async function ServerResourcePage({
  params,
  searchParams,
}: ServerResourcePageProps) {
  try {
    const { connectorId, modelId } = await params;
    const { q } = await searchParams;

    // Get model details and validate
    const modelDetails = mocked.models.get(modelId);
    if (!modelDetails) {
      throw new Error(`Model ${modelId} not found`);
    }

    // Get owner ID from authentication system
    const ownerId = mocked.auth.getUserOrOrgId();

    // Get all field IDs for the model
    const fields = modelDetails.fields.map((field) => field.id);

    // Initialize the connection and resources
    const connection = morph.connections({ ownerId, connectorId });
    const resources = connection.resources(modelId);

    // Fetch resources with search and pagination
    const { data, error } = await resources.list({
      q,
      limit: 10,
      fields,
    });

    if (error) {
      throw new Error(`Failed to fetch resources: ${error.message}`);
    }

    return (
      <div className="space-y-6">
        <DashboardHeader
          title={modelDetails.name}
          description={`Server-side ${modelDetails.name} resources`}
        />

        {/* Search Form */}
        <form className="flex gap-2 max-w-sm">
          <Input
            type="search"
            placeholder="Search resources..."
            defaultValue={q}
            name="q"
            className="flex-1"
            aria-label="Search resources"
          />
          <Button type="submit">Search</Button>
        </form>

        {/* Resources Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {modelDetails.fields.map((field) => (
                  <TableHead
                    key={field.id}
                    className="whitespace-nowrap"
                    title={field.name}
                  >
                    <div className="truncate">{field.name}</div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={modelDetails.fields.length}
                    className="h-24 text-center"
                  >
                    No results found.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row) => (
                  <TableRow key={row.id}>
                    {modelDetails.fields.map((field) => (
                      <TableCell
                        key={`${row.id}-${field.id}`}
                        className="whitespace-nowrap"
                      >
                        <div className="truncate">
                          {/* 
                            Handle different field types:
                            - For reference fields (with IDs), display the ID
                            - For other fields, display the value directly
                          */}
                          {/* @ts-ignore –– as we are displaying different reosurce model; there is no intersection between the fields of the three models */}
                          {row.fields[field.id]?.id
                            ? (row.fields as any)[field.id]?.id
                            : (row.fields as any)[field.id]}
                        </div>
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Resource page error:", error);
    notFound();
  }
}
