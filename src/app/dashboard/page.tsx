import TermsPanel from "./TermsPanel";

export default async function DashboardOverview() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Dashboard Overview</h1>
      <TermsPanel initialTerms={[]} />
    </div>
  );
}