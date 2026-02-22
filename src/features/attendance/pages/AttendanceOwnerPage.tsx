import Layout from "@/components/Layout";
import { OwnerDashboard } from "./OwnerDashboard";

const AttendanceOwnerPage = () => {
  return (
    <Layout>
      <section className="section-container py-10 md:py-14">
        <div className="mb-8 space-y-2">
          <p className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            Owner Panel
          </p>
          <h1 className="text-3xl font-bold text-foreground md:text-4xl">Attendance Center - Owner</h1>
        </div>
        <OwnerDashboard />
      </section>
    </Layout>
  );
};

export default AttendanceOwnerPage;
