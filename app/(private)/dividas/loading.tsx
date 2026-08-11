import { Card } from "@/components/ui/card";

export default function Loading() {
    return (
        <div className="mx-auto max-w-6xl animate-pulse">
            <div className="mb-6">
                <div className="h-4 w-32 rounded bg-line" />
                <div className="mt-3 h-8 w-44 rounded bg-line" />
                <div className="mt-2 h-4 w-full max-w-xl rounded bg-line" />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Card>
                    <div className="h-4 w-32 rounded bg-line" />
                    <div className="mt-4 h-7 w-36 rounded bg-line" />
                </Card>

                <Card>
                    <div className="h-4 w-24 rounded bg-line" />
                    <div className="mt-4 h-7 w-36 rounded bg-line" />
                </Card>

                <Card>
                    <div className="h-4 w-28 rounded bg-line" />
                    <div className="mt-4 h-7 w-36 rounded bg-line" />
                </Card>
            </div>

            <div className="mt-6 h-52 rounded-2xl border border-line bg-surface" />

            <div className="mt-6 space-y-3">
                <div className="h-32 rounded-2xl border border-line bg-surface" />
                <div className="h-32 rounded-2xl border border-line bg-surface" />
            </div>
        </div>
    );
}