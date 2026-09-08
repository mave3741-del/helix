import { createFileRoute } from "@tanstack/react-router";
import { BrainsView } from "@/components/views/brains-view";

export const Route = createFileRoute("/brains")({ component: BrainsView });
