import { notFound } from "next/navigation";
import { Connect } from "@runmorph/atoms";

import { type ConnectorId, mocked } from "@/lib/mocked-data";
import { morph } from "@/morph";
import { DashboardHeader } from "@/components/navigation/dashboard-header";

/**
 * Props interface for the ConnectionPage component
 * @interface ConnectionPageProps
 * @property {Promise<{ connectorId: ConnectorId }>} params - Route parameters containing the connector ID
 */
interface ConnectionPageProps {
  params: Promise<{
    connectorId: ConnectorId;
  }>;
}

/**
 * ConnectionPage Component
 *
 * This page handles the connection and authorization flow for a specific connector.
 * It demonstrates how to:
 * 1. Create a session with required operations
 * 2. Handle connection authorization
 * 3. Manage connector-specific settings
 *
 * @param {ConnectionPageProps} props - Component props
 * @returns {Promise<JSX.Element>} The connection page component
 */
export default async function ConnectionPage({ params }: ConnectionPageProps) {
  const { connectorId } = await params;

  try {
    // Get owner ID from authentication system
    // In a real application, this would come from your auth provider
    const ownerId = mocked.auth.getUserOrOrgId();

    // Create a session with required operations for the connector
    const { data, error } = await morph.sessions().create({
      connection: {
        connectorId,
        ownerId,
        operations: [
          // Contact operations
          "genericContact::create",
          "genericContact::update",
          "genericContact::retrieve",
          "genericContact::list",
          "genericContact::fieldRead",
          // Company operations
          "genericCompany::create",
          "genericCompany::update",
          "genericCompany::retrieve",
          "genericCompany::list",
          "genericCompany::fieldRead",
          // Opportunity operations
          "crmOpportunity::create",
          "crmOpportunity::update",
          "crmOpportunity::retrieve",
          "crmOpportunity::list",
          "crmOpportunity::fieldRead",
        ],
      },
    });

    if (error) {
      console.error("Failed to create session:", error);
      throw new Error("Failed to create session");
    }

    const connectorDetails = mocked.connectors.get(connectorId);
    if (!connectorDetails) {
      throw new Error("Connector not found");
    }

    return (
      <>
        <DashboardHeader
          title={`Configure ${connectorDetails.name}`}
          description={`Manage your ${connectorDetails.name} connection settings and authorization`}
        />

        {/* 
          Connect Component
          This component handles the connection authorization flow
          It provides a pre-built UI for connecting to the connector
        */}
        <Connect
          sessionToken={data.sessionToken}
          connectionCallbacks={{
            async authorized(connectionData) {
              "use server";

              try {
                // After successful authorization, fetch custom fields
                const { data: fieldsData, error: fieldsError } = await morph
                  .connections({ connectorId, ownerId })
                  .models("genericCompany")
                  .listFields({ filters: { isCustom: true } });

                if (fieldsError) {
                  console.error("Failed to fetch custom fields:", fieldsError);
                  throw new Error("Failed to fetch custom fields");
                }

                // Log successful field retrieval
                console.log("Custom fields retrieved:", fieldsData);
              } catch (error) {
                console.error("Error in authorization callback:", error);
                throw error;
              }
            },
          }}
        />

        {/* 
          Custom Connection UI
          You can build your own connection experience using Morph Atoms
          Documentation: https://docs.runmorph.dev/api-reference/atoms/quick-start
        */}
      </>
    );
  } catch (error) {
    console.error("Connection page error:", error);
    notFound();
  }
}
