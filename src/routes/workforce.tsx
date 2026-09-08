import { createFileRoute } from "@tanstack/react-router";
import { WorkforceView } from "@/components/views/workforce-view";

export const Route = createFileRoute("/workforce")({ component: WorkforceView });
