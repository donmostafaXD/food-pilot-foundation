import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, FileText, FileDown } from "lucide-react";

export type PrintMode = "data" | "blank" | "pdf";

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (mode: PrintMode) => void;
  title?: string;
  /** Hide "Print with Data" option (e.g. when no data loaded) */
  hideData?: boolean;
}

const PrintDialog = ({ open, onClose, onSelect, title = "Print Options", hideData }: Props) => {
  const pick = (mode: PrintMode) => {
    onSelect(mode);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">{title}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2 pt-2">
          {!hideData && (
            <Button variant="outline" className="justify-start gap-3 h-12" onClick={() => pick("data")}>
              <Printer className="w-4 h-4 text-primary shrink-0" />
              <div className="text-left">
                <p className="text-sm font-medium">Print with Data</p>
                <p className="text-xs text-muted-foreground">Includes all recorded values</p>
              </div>
            </Button>
          )}
          <Button variant="outline" className="justify-start gap-3 h-12" onClick={() => pick("blank")}>
            <FileText className="w-4 h-4 text-primary shrink-0" />
            <div className="text-left">
              <p className="text-sm font-medium">Print Blank Template</p>
              <p className="text-xs text-muted-foreground">Empty form for manual use</p>
            </div>
          </Button>
          <Button variant="outline" className="justify-start gap-3 h-12" onClick={() => pick("pdf")}>
            <FileDown className="w-4 h-4 text-primary shrink-0" />
            <div className="text-left">
              <p className="text-sm font-medium">Export as PDF</p>
              <p className="text-xs text-muted-foreground">Save to PDF via print dialog</p>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PrintDialog;
