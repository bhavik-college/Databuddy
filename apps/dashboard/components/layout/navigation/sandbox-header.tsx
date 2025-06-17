import Link from "next/link";
import { CaretLeftIcon, TestTubeIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

export function SandboxHeader() {
    return (
        <div className="flex flex-col gap-2">
            <div>
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-muted-foreground hover:text-foreground cursor-pointer group"
                    asChild
                >
                    <Link href="/">
                        <CaretLeftIcon size={32} weight="fill" className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                        <span>Back to Dashboard</span>
                    </Link>
                </Button>
            </div>

            <div className="px-2 py-2 bg-accent/30 rounded-lg border border-border/50">
                <h2 className="text-base font-semibold truncate flex items-center">
                    <TestTubeIcon size={64} weight="duotone" className="h-5 w-5 mr-2 text-primary/70" />
                    Sandbox
                </h2>
                <div className="text-xs text-muted-foreground truncate mt-1 pl-6">
                    Test & Experiment
                </div>
            </div>
        </div>
    );
} 