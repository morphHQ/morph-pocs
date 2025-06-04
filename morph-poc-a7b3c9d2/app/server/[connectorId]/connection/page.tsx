import { notFound } from "next/navigation";
import { Connect } from "@runmorph/atoms";

import { type ConnectorId, mocked } from "@/lib/mocked-data";
import { morph } from "@/morph";
import { DashboardHeader } from "@/components/navigation/dashboard-header";

/**
 * Route parameters for the connection page
 */
interface ConnectionPageParams {
  connectorId: ConnectorId;
}

/**
 * Props for the ConnectionPage component
 */
interface ConnectionPageProps {
  params: Promise<ConnectionPageParams>;
}

/**
 * Type definition for valid operations
 */
type ValidOperation =
  | "genericContact::create"
  | "genericContact::update"
  | "genericContact::retrieve"
  | "genericContact::list"
  | "genericContact::fieldRead"
  | "genericContact::fieldWrite"
  | "genericCompany::create"
  | "genericCompany::update"
  | "genericCompany::retrieve"
  | "genericCompany::list"
  | "genericCompany::fieldRead"
  | "genericCompany::fieldWrite"
  | "crmOpportunity::create"
  | "crmOpportunity::update"
  | "crmOpportunity::retrieve"
  | "crmOpportunity::list"
  | "crmOpportunity::fieldRead"
  | "crmOpportunity::fieldWrite";

/**
 * Required operations for the connector session
 */
const REQUIRED_OPERATIONS: ValidOperation[] = [
  // Contact operations
  "genericContact::create",
  "genericContact::update",
  "genericContact::retrieve",
  "genericContact::list",
  "genericContact::fieldRead",
  "genericContact::fieldWrite",
  // Company operations
  "genericCompany::create",
  "genericCompany::update",
  "genericCompany::retrieve",
  "genericCompany::list",
  "genericCompany::fieldRead",
  "genericCompany::fieldWrite",
  // Opportunity operations
  "crmOpportunity::create",
  "crmOpportunity::update",
  "crmOpportunity::retrieve",
  "crmOpportunity::list",
  "crmOpportunity::fieldRead",
  "crmOpportunity::fieldWrite",
];

/**
 * Custom field configuration
 */
const CUSTOM_FIELD_CONFIG = {
  key: "custom_field_1",
  name: "My Custom Field",
  type: "text" as const,
} as const;

/**
 * ConnectionPage Component
 *
 * Handles the connection and authorization flow for a specific connector.
 * This page:
 * 1. Creates a session with required operations
 * 2. Manages connector authorization
 * 3. Handles custom field creation and management
 * 4. Provides a pre-built UI for connection setup
 *
 * @param {ConnectionPageProps} props - Component props containing route parameters
 * @returns {Promise<JSX.Element>} The connection page component
 * @throws {Error} When session creation fails or connector is not found
 */
export default async function ConnectionPage({ params }: ConnectionPageProps) {
  const { connectorId } = await params;

  try {
    // Get owner ID from authentication system
    const ownerId = mocked.auth.getUserOrOrgId();

    // Create a session with required operations
    const { data: sessionData, error: sessionError } = await morph
      .sessions()
      .create({
        connection: {
          connectorId,
          ownerId,
          operations: REQUIRED_OPERATIONS,
        },
      });

    if (sessionError) {
      console.error("Failed to create session:", sessionError);
      throw new Error("Failed to create session");
    }

    // Verify connector exists
    const connectorDetails = mocked.connectors.get(connectorId);
    if (!connectorDetails) {
      throw new Error(`Connector not found: ${connectorId}`);
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
          sessionToken={sessionData.sessionToken}
          connectionCallbacks={{
            async authorized(connectionData) {
              "use server";

              try {
                // Fetch existing custom fields
                const { data: fieldsData, error: fieldsError } = await morph
                  .connections({ connectorId, ownerId })
                  .models("genericCompany")
                  .listFields({ filters: { isCustom: true } });

                if (fieldsError) {
                  console.error("Failed to fetch custom fields:", fieldsError);
                  throw new Error("Failed to fetch custom fields");
                }

                // Check if custom field already exists
                const existingField = fieldsData.find(
                  (field) => field.remote.key === CUSTOM_FIELD_CONFIG.key
                );

                if (!existingField) {
                  // Create new custom field if it doesn't exist
                  const { data: newFieldData, error: newFieldError } =
                    await morph
                      .connections({ connectorId, ownerId })
                      .models("genericCompany")
                      .createField(CUSTOM_FIELD_CONFIG);

                  if (newFieldError) {
                    console.error(
                      "Failed to create custom field:",
                      newFieldError
                    );
                    throw new Error("Failed to create custom field");
                  }

                  console.log("New custom field created:", newFieldData);
                } else {
                  console.log("Custom field already exists:", existingField);
                }
              } catch (error) {
                console.error("Error in authorization callback:", error);
                throw error;
              }
            },
          }}
        />
      </>
    );
  } catch (error) {
    console.error("Connection page error:", error);
    notFound();
  }
}
