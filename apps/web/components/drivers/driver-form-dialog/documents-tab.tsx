import { FileText } from "lucide-react";

export const DocumentsTab = (): React.JSX.Element => (
  <div className="flex min-h-full flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface-100/50 p-8 text-center">
    <FileText className="size-9 text-primary-700/50" />
    <h3 className="mt-3 font-semibold text-ink-900">
      Documents are coming next
    </h3>
    <p className="mt-1 max-w-sm text-sm text-primary-700">
      License scans, medical cards, and insurance files will be managed here.
    </p>
  </div>
);
