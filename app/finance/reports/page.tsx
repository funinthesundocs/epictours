import { MasterReportPage } from "@/features/reports/master-report/page";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Master Report | EpicTours.ai",
    description: "Complete booking and customer data report",
};

export default function Page() {
    return <MasterReportPage />;
}
