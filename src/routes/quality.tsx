import { createFileRoute } from "@tanstack/react-router";
import { QualityView } from "@/components/views/quality-view";

export const Route = createFileRoute("/quality")({ component: QualityView });
