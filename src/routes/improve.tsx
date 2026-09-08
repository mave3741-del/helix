import { createFileRoute } from "@tanstack/react-router";
import { ImproveView } from "@/components/views/improve-view";

export const Route = createFileRoute("/improve")({ component: ImproveView });
