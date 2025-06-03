import { Users, Target, Building2 } from "lucide-react";

// TODO: Replace with actual connectors you wish to use from Morph; with the details you need.
const CONNECTORS = [
  { id: "hubspot", name: "Hubspot" },
  { id: "salesforce", name: "Salesforce" },
  { id: "pipedrive", name: "Pipedrive" },
] as const;

// TODO: Replace with actual models you wish to use from Morph; with the actual fields you need (static or dynamically set by user)
const MODELS = [
  {
    id: "genericContact",
    name: "Contact",
    fields: [
      { id: "firstName", name: "First Name" },
      { id: "lastName", name: "Last Name" },
      { id: "email", name: "Email" },
      { id: "fld_journeybee_lead__c", name: "Journeybee Lead" },
      { id: "fld_journeybee_partner__c", name: "Journeybee Partner" },
    ],
    icon: <Users className="h-4 w-4" />,
  },
  {
    id: "genericCompany",
    name: "Company",
    fields: [
      { id: "name", name: "Name" },
      { id: "fld_journeybee_lead__c", name: "Journeybee Lead" },
      { id: "fld_journeybee_partner__c", name: "Journeybee Partner" },
    ],
    icon: <Building2 className="h-4 w-4" />,
  },
  {
    id: "crmOpportunity",
    name: "Opportunity",
    fields: [
      { id: "name", name: "Name" },
      { id: "amount", name: "Amount" },
      { id: "stage", name: "Stage" },
      { id: "pipeline", name: "Pipeline" },
      { id: "fld_journeybee_lead__c", name: "Journeybee Lead" },
      { id: "fld_journeybee_partner__c", name: "Journeybee Partner" },
    ],

    icon: <Target className="h-4 w-4" />,
  },
] as const;

const DEMO_OWNER_ID = "demo_owner_id";

const MORPH_POC_ID = "a7b3c9d2";

const mocked = {
  connectors: {
    get: (id: (typeof CONNECTORS)[number]["id"]) => {
      return CONNECTORS.find((connector) => connector.id === id);
    },
    list: () => {
      return CONNECTORS;
    },
  },
  models: {
    get: (id: (typeof MODELS)[number]["id"]) => {
      return MODELS.find((model) => model.id === id);
    },
    list: () => {
      return MODELS;
    },
  },
  auth: {
    getUserOrOrgId: () => {
      return DEMO_OWNER_ID;
    },
  },
  morphPocId: () => {
    return `morph-poc-${MORPH_POC_ID}`;
  },
};

type ConnectorId = (typeof CONNECTORS)[number]["id"];
type ModelId = (typeof MODELS)[number]["id"];

export type { ConnectorId, ModelId };
export { mocked };
