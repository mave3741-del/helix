import { createFileRoute } from "@tanstack/react-router";
import { GovernanceView } from "@/components/views/governance-view";

export const Route = createFileRoute("/governance")({ component: GovernanceView });
