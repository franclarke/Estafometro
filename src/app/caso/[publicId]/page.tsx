import { AnalysisProgress } from "@/components/analysis-progress/analysis-progress";

export default async function CaseProgressPage({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;

  return (
    <main className="min-h-dvh bg-[var(--surface)] text-[var(--ink)]">
      <div className="mx-auto w-full max-w-[640px]">
        <AnalysisProgress publicId={publicId} />
      </div>
    </main>
  );
}
