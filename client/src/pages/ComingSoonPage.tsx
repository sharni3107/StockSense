import { PageHeader } from "../components/PageHeader";

export default function ComingSoonPage({ title }: { title: string }) {
  return (
    <div>
      <PageHeader title={title} />
      <div className="rounded-lg border border-dashed border-border bg-white p-10 text-center text-sm text-slate-400">
        This module hasn't been built yet in this hackathon plan — it arrives in a later hour.
      </div>
    </div>
  );
}
