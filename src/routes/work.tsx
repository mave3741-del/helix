import { createFileRoute } from "@tanstack/react-router";
import { WorkView } from "@/components/views/work-view";

export const Route = createFileRoute("/work")({ component: WorkView });
