"use client";

import type { Document } from "@repo/shared";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  Bot,
  Check,
  ChevronDown,
  Download,
  Expand,
  FileDown,
  Link2,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  Search,
  Truck,
  UserRound,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@repo/ui/components/button";
import { documentQueryOptions } from "@/lib/documents/documents-query";

import { formatDocumentFileSize } from "./types";

const extractedFields = [
  ["Document type", "Bill of Lading", "98%"],
  ["BOL number", "78291", "99%"],
  ["Ship date", "May 28, 2025", "99%"],
  ["Delivery date", "May 29, 2025", "98%"],
  ["Shipper name", "Acme Industries", "98%"],
  ["Shipper address", "200 Industrial Blvd, Chicago, IL 60616", "97%"],
  ["Consignee name", "Detroit Manufacturing", "97%"],
  ["Consignee address", "1500 Factory Rd, Detroit, MI 48201", "97%"],
  ["Origin", "Chicago, IL", "99%"],
  ["Destination", "Detroit, MI", "99%"],
  ["Mode", "Truckload", "98%"],
  ["Terms", "Prepaid", "98%"],
  ["Total weight", "24,000 lbs", "99%"],
  ["Packaging", "—", "—"],
] as const;

const auditEvents = [
  {
    icon: FileDown,
    label: "Document uploaded",
    actor: "Alex Dispatcher",
    role: "Operator",
    tone: "navy",
  },
  {
    icon: Bot,
    label: "AI extraction completed",
    actor: "AI Engine",
    role: "Document Extractor v2.1",
    tone: "violet",
  },
  {
    icon: Link2,
    label: "Linked to load LD-78291",
    actor: "Alex Dispatcher",
    role: "Operator",
    tone: "navy",
  },
  {
    icon: UserRound,
    label: "Linked to driver John Smith (TR-1042)",
    actor: "Alex Dispatcher",
    role: "Operator",
    tone: "green",
  },
] as const;

const IconButton = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}): React.JSX.Element => (
  <button
    aria-label={label}
    className="flex size-9 items-center justify-center rounded-md border border-border bg-card text-primary-700 transition hover:bg-surface-100"
    type="button"
  >
    {children}
  </button>
);

const BolPreview = (): React.JSX.Element => (
  <div className="min-w-[570px] bg-white px-7 py-5 font-mono text-[10px] leading-[1.25] text-black">
    <div className="flex justify-between">
      <div>
        <strong>ACME LOGISTICS LLC</strong>
        <p>500 Logistics Way</p>
        <p>Chicago, IL 60601</p>
        <p>(312) 555-0198</p>
      </div>
      <h3 className="pt-2 text-xl font-black tracking-tight">BILL OF LADING</h3>
      <div>
        <p>
          <strong>BOL #: </strong>78291
        </p>
        <div className="mt-4 h-6 w-32 bg-[repeating-linear-gradient(90deg,#000_0,#000_2px,transparent_2px,transparent_4px)]" />
      </div>
    </div>
    <div className="mt-5 grid grid-cols-2 border border-black">
      <div className="border-r border-black p-2">
        <p>SHIPPER</p>
        <strong>Acme Industries</strong>
        <p>200 Industrial Blvd</p>
        <p>Chicago, IL 60616</p>
      </div>
      <div className="p-2">
        <p>CONSIGNEE</p>
        <strong>Detroit Manufacturing</strong>
        <p>1500 Factory Rd</p>
        <p>Detroit, MI 48201</p>
      </div>
      <div className="border-r border-t border-black p-2">
        <p>ORIGIN</p>
        <strong>Chicago, IL</strong>
      </div>
      <div className="border-t border-black p-2">
        <p>DESTINATION</p>
        <strong>Detroit, MI</strong>
      </div>
    </div>
    <div className="grid grid-cols-4 border-x border-b border-black">
      {[
        ["SHIP DATE", "May 28, 2025"],
        ["DELIVERY DATE", "May 29, 2025"],
        ["TERMS", "Prepaid"],
        ["MODE", "Truckload"],
      ].map(([label, value]) => (
        <div className="border-r border-black p-2 last:border-r-0" key={label}>
          <p>{label}</p>
          <strong>{value}</strong>
        </div>
      ))}
    </div>
    <div className="mt-0 grid grid-cols-[2fr_.6fr_1fr_1fr] border-x border-b border-black text-center">
      {["DESCRIPTION OF GOODS", "QTY", "WEIGHT", "NMFC"].map((item) => (
        <strong
          className="border-r border-black p-1 last:border-r-0"
          key={item}
        >
          {item}
        </strong>
      ))}
      {["Industrial Equipment Parts", "10", "24,000 lbs", "123456-7"].map(
        (item) => (
          <span
            className="border-r border-t border-black p-2 last:border-r-0"
            key={item}
          >
            {item}
          </span>
        ),
      )}
      <div className="col-span-4 h-16 border-t border-black bg-[repeating-linear-gradient(0deg,transparent_0,transparent_20px,#aaa_21px)]" />
    </div>
    <div className="grid grid-cols-[3fr_1fr] border-x border-b border-black">
      <div className="p-2">
        <strong>NOTES</strong>
        <p>Handle with care</p>
      </div>
      <div className="border-l border-black p-2">
        <strong>TOTAL WEIGHT</strong>
        <p>24,000 lbs</p>
      </div>
    </div>
    <div className="mt-5 flex justify-between px-2">
      <div>
        <p>SHIPPER SIGNATURE</p>
        <p className="mt-2 font-serif text-xl italic">John Gordon</p>
      </div>
      <div>
        <p>CARRIER SIGNATURE</p>
        <p className="mt-2 font-serif text-xl italic">Chris Lane</p>
      </div>
    </div>
  </div>
);

const DocumentReviewContent = ({
  document,
}: {
  document: Document;
}): React.JSX.Element => (
  <div className="-m-4 min-h-full bg-surface-50 lg:-mt-5 lg:-ml-6">
    <header className="border-b border-border bg-card px-5 pt-4 lg:px-7">
      <Link
        className="flex items-center gap-2 text-sm font-semibold text-primary-700 hover:text-primary"
        href="/documents"
      >
        <ArrowLeft className="size-4" /> Back to documents
      </Link>
      <div className="mt-4 flex flex-col justify-between gap-6 pb-5 xl:flex-row xl:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-h1 text-ink-900">{document.fileName}</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success-background px-2.5 py-1 text-xs font-semibold text-success">
              <Check className="size-3.5" /> Extraction complete
            </span>
          </div>
          <p className="mt-1 text-sm text-ink-500">
            Uploaded{" "}
            {new Intl.DateTimeFormat("en-US", {
              dateStyle: "medium",
              timeStyle: "short",
            }).format(new Date(document.uploadedAt))}
          </p>
        </div>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="grid grid-cols-[auto_auto_1fr] gap-x-3 gap-y-1 border-l border-border pl-5 text-sm">
            <span className="col-span-3 mb-1 font-semibold text-ink-700">
              Linked to
            </span>
            <Truck className="size-4 text-info" />
            <span>Load</span>
            <a className="font-medium text-info" href="#">
              {document.load?.referenceNumber ?? "Unassigned"}
            </a>
            <UserRound className="size-4 text-primary-700" />
            <span>Driver</span>
            <a className="font-medium text-primary-700" href="#">
              {document.driver
                ? `${document.driver.firstName} ${document.driver.lastName}`
                : "Unassigned"}
            </a>
            <AlertTriangle className="size-4 text-red-500" />
            <span>Incident</span>
            <a className="font-medium text-info" href="#">
              INC-2291
            </a>
          </div>
          <div className="flex gap-3">
            <Button className="h-10" variant="outline">
              <Download /> Download
            </Button>
            <Button className="h-10">
              More actions <ChevronDown />
            </Button>
          </div>
        </div>
      </div>
      <nav aria-label="Document views" className="flex gap-8">
        {["Overview", "Extraction", "Fields", "Audit trail"].map(
          (tab, index) => (
            <button
              className={`border-b-2 px-1 pb-3 text-sm font-semibold ${index === 0 ? "border-info text-ink-900" : "border-transparent text-ink-500 hover:text-ink-900"}`}
              key={tab}
              type="button"
            >
              {tab}
            </button>
          ),
        )}
      </nav>
    </header>

    <main className="space-y-4 p-4 lg:p-5">
      <div className="grid gap-4 2xl:grid-cols-[1.08fr_1fr]">
        <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          <h2 className="border-b border-border px-4 py-3 text-base font-semibold">
            Raw file preview
          </h2>
          <div className="flex items-center gap-2 border-b border-border px-4 py-2">
            <IconButton label="Search document">
              <Search className="size-4" />
            </IconButton>
            <div className="mx-1 h-7 border-l border-border" />
            <IconButton label="Zoom out">
              <ZoomOut className="size-4" />
            </IconButton>
            <IconButton label="Zoom in">
              <ZoomIn className="size-4" />
            </IconButton>
            <span className="ml-2 rounded-md border border-border px-3 py-2 text-sm font-semibold">
              1
            </span>
            <span className="text-sm text-ink-500">/ 1</span>
            <IconButton label="Rotate">
              <RotateCcw className="size-4" />
            </IconButton>
            <IconButton label="Expand">
              <Expand className="size-4" />
            </IconButton>
            <div className="ml-auto">
              <IconButton label="Download preview">
                <Download className="size-4" />
              </IconButton>
            </div>
          </div>
          <div className="overflow-auto bg-surface-100 p-4">
            <div className="mx-auto w-fit overflow-hidden rounded-sm border border-border shadow-sm">
              <BolPreview />
            </div>
          </div>
        </section>

        <div className="space-y-4">
          <section className="rounded-lg border border-border bg-card shadow-sm">
            <div className="flex items-center border-b border-border px-4 py-3">
              <h2 className="text-base font-semibold">Extracted fields</h2>
              <span className="ml-4 flex items-center gap-1.5 text-xs font-medium text-ink-700">
                <Check className="size-4 rounded-full bg-emerald-500 p-0.5 text-white" />
                32 fields extracted
              </span>
              <Button className="ml-auto" size="sm" variant="outline">
                <Pencil /> Edit
              </Button>
            </div>
            <dl className="grid grid-cols-[minmax(110px,1fr)_minmax(170px,1fr)_auto] gap-x-4 gap-y-2 px-5 py-4 text-sm">
              {extractedFields.map(([label, value, confidence]) => (
                <div className="contents" key={label}>
                  <dt className="text-ink-500">{label}</dt>
                  <dd className="font-medium text-primary-700">{value}</dd>
                  <dd
                    className={
                      confidence === "—"
                        ? "text-ink-500"
                        : "rounded-full bg-success-background px-2 py-0.5 text-xs font-semibold text-success"
                    }
                  >
                    {confidence}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
          <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <h2 className="text-base font-semibold">Metadata</h2>
            <dl className="mt-4 grid gap-x-7 gap-y-2 text-sm sm:grid-cols-[auto_1fr_auto_1fr]">
              {[
                ["File name", document.fileName],
                ["Owner", "Alex Dispatcher"],
                ["File size", formatDocumentFileSize(document.fileSize)],
                [
                  "Uploaded at",
                  new Intl.DateTimeFormat("en-US", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(document.uploadedAt)),
                ],
                ["File type", "application/pdf"],
                ["AI model", "Document Extractor v2.1"],
                ["Pages", "1"],
                ["Processing time", "4.2 sec"],
              ].map(([label, value]) => (
                <div className="contents" key={label}>
                  <dt className="text-ink-500">{label}</dt>
                  <dd className="font-medium text-primary-700">{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      </div>

      <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <h2 className="mb-3 text-base font-semibold">Audit &amp; links</h2>
        <div>
          {auditEvents.map(({ icon: Icon, label, actor, role, tone }) => (
            <div
              className="grid grid-cols-[36px_1fr_auto] items-center gap-3 border-t border-border py-2.5 sm:grid-cols-[36px_minmax(180px,1.3fr)_160px_minmax(180px,1fr)_30px]"
              key={label}
            >
              <span
                className={`relative z-10 flex size-9 items-center justify-center rounded-full border bg-card ${tone === "violet" ? "text-ai-600" : tone === "green" ? "text-teal-600" : "text-primary-700"}`}
              >
                <Icon className="size-4" />
              </span>
              <span className="font-medium text-primary-700">{label}</span>
              <time className="hidden text-sm text-ink-500 sm:block">
                May 28, 2025 09:15
              </time>
              <div className="hidden items-center gap-3 sm:flex">
                <span
                  className={`flex size-8 items-center justify-center rounded-full text-xs font-bold text-white ${tone === "violet" ? "bg-violet-500" : "bg-primary-700"}`}
                >
                  {tone === "violet" ? "AI" : "AD"}
                </span>
                <span>
                  <strong className="block text-sm">{actor}</strong>
                  <small className="text-ink-500">{role}</small>
                </span>
              </div>
              <button
                aria-label={`Actions for ${label}`}
                className="text-ink-500"
                type="button"
              >
                <MoreHorizontal className="size-4" />
              </button>
            </div>
          ))}
        </div>
      </section>
    </main>
  </div>
);

export const DocumentReview = ({
  documentId,
}: {
  documentId: string;
}): React.JSX.Element => {
  const query = useQuery(documentQueryOptions(documentId));

  if (query.isPending) {
    return <div className="p-10 text-center">Loading document...</div>;
  }
  if (query.isError) {
    return (
      <div className="p-10 text-center">
        Unable to load this document. It may have been deleted.
      </div>
    );
  }
  return <DocumentReviewContent document={query.data} />;
};
