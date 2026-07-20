import PortalClient from "./PortalClient";

export const dynamic = "force-dynamic";

export default function PortalPage() {
  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      <PortalClient />
    </div>
  );
}
