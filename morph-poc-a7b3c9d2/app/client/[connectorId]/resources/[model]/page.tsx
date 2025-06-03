import { DashboardHeader } from "@/components/navigation/dashboard-header";
import { ClientResourceTable } from "@/components/resources/client-resource-table";
import { ConnectorId, type ModelId, mocked } from "@/lib/mocked-data";
import { notFound } from "next/navigation";
import { morph } from "@/morph";

/**
 * Props interface for the ClientResourcePage component
 * @interface ClientResourcePageProps
 * @property {Promise<{ model: ModelId; connectorId: ConnectorId }>} params - Route parameters
 * @property {{ remoteFields?: string }} searchParams - Search query parameters
 */
interface ClientResourcePageProps {
  params: Promise<{
    model: ModelId;
    connectorId: ConnectorId;
  }>;
  searchParams: {
    remoteFields?: string;
  };
}

/**
 * ClientResourcePage Component
 *
 * This page displays a list of resources for a specific model in a connector using client-side rendering.
 * It demonstrates how to:
 * 1. Create a session for client-side operations
 * 2. Handle resource data in a client-side table
 * 3. Manage remote field synchronization
 *
 * @param {ClientResourcePageProps} props - Component props
 * @returns {Promise<JSX.Element>} The client-side resource list page component
 */
export default async function ClientResourcePage({
  params,
  searchParams,
}: ClientResourcePageProps) {
  try {
    const { model, connectorId } = await params;

    // Get model details and validate
    const modelDetails = mocked.models.get(model);
    if (!modelDetails) {
      throw new Error(`Model ${model} not found`);
    }

    // Get owner ID from authentication system
    const ownerId = mocked.auth.getUserOrOrgId();

    // Create a session for client-side operations
    const { data, error } = await morph.sessions().create({
      connection: {
        connectorId,
        ownerId,
      },
    });

    if (error) {
      throw new Error(`Failed to create session: ${error.message}`);
    }

    return (
      <div className="space-y-6">
        <DashboardHeader
          title={modelDetails.name}
          description={`Client-side ${modelDetails.name} resources`}
        />

        {/* 
          ClientResourceTable Component
          This component handles the client-side rendering of resources
          It uses the session token for authentication and operations
        */}
        <ClientResourceTable model={model} sessionToken={data.sessionToken} />
      </div>
    );
  } catch (error) {
    console.error("Client resource page error:", error);
    notFound();
  }
}
