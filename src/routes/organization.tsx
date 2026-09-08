import { createFileRoute } from "@tanstack/react-router";
import { OrganizationView } from "@/components/views/organization-view";

export const Route = createFileRoute("/organization")({ component: OrganizationView });
