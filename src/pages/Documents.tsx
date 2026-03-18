import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";

const Documents = () => (
  <DashboardLayout>
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground tracking-tight mb-6">Documents</h1>
      <Card className="shadow-industrial-sm">
        <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="p-4 rounded-full bg-muted">
            <FileText className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">Document management coming soon.</p>
        </CardContent>
      </Card>
    </div>
  </DashboardLayout>
);

export default Documents;
