import { createFileRoute } from "@tanstack/react-router";
import { ScenariosView } from "@/components/views/scenarios-view";

export const Route = createFileRoute("/scenarios")({ component: ScenariosView });
