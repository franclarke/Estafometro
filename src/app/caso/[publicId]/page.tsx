import { AnalysisProgress } from "@/components/analysis-progress/analysis-progress";

export default async function CaseProgressPage({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;

  return (
    <main className="min-h-dvh bg-[var(--surface)] px-4 py-5 text-[var(--ink)] sm:px-6">
      <div className="mx-auto flex min-h-[calc(100dvh-2.5rem)] w-full max-w-[640px] flex-col justify-center">
        <AnalysisProgress publicId={publicId} />
      </div>
    </main>
  );
}
