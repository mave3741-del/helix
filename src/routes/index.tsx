import { createFileRoute } from "@tanstack/react-router";
import { CommandView } from "@/components/views/command-view";

export const Route = createFileRoute("/")({ component: CommandView });
