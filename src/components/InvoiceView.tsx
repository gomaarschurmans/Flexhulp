"use client";

import { formatEuro, formatTimeRange } from "@/lib/utils";
import { SELLER, VAT_EXEMPTION_TEXT, formatInvoiceNumber } from "@/lib/invoicing/business";
import type { Invoice } from "@/lib/types/domain";

export function InvoiceView({ invoice }: { invoice: Invoice }) {
  const issueDate = new Date(invoice.issued_at).toLocaleDateString("nl-BE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mx-auto max-w-[680px] px-6 py-10">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <h1 className="text-xl">Factuur {formatInvoiceNumber(invoice.invoice_number)}</h1>
        <button onClick={() => window.print()} className="btn btn-navy px-4 py-2 text-sm">
          Print / bewaar als PDF
        </button>
      </div>

      <div className="card">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h2 className="mb-1 text-lg font-semibold">{SELLER.tradeName}</h2>
            <p className="text-sm text-ink-soft">{SELLER.name}</p>
            <p className="text-sm text-ink-soft">{SELLER.address}</p>
            <p className="text-sm text-ink-soft">Ondernemingsnummer: {SELLER.vatNumber}</p>
          </div>
          <div className="text-right text-sm text-ink-soft">
            <p className="text-base font-semibold text-ink">
              {formatInvoiceNumber(invoice.invoice_number)}
            </p>
            <p>Factuurdatum: {issueDate}</p>
          </div>
        </div>

        <div className="mb-8">
          <p className="mb-1 text-xs font-semibold uppercase text-ink-soft">Factuur aan</p>
          <p className="text-sm">{invoice.client_name}</p>
          <p className="text-sm text-ink-soft">{invoice.client_address}</p>
          <p className="text-sm text-ink-soft">{invoice.client_email}</p>
        </div>

        <table className="mb-6 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-line text-left text-ink-soft">
              <th className="pb-2 font-semibold">Omschrijving</th>
              <th className="pb-2 text-right font-semibold">Uren</th>
              <th className="pb-2 text-right font-semibold">Tarief</th>
              <th className="pb-2 text-right font-semibold">Bedrag</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-line">
              <td className="py-3">
                <p className="font-medium">{invoice.category}</p>
                <p className="text-ink-soft">
                  {formatTimeRange(
                    invoice.service_date,
                    invoice.service_time,
                    invoice.service_end_time
                  )}
                </p>
                {invoice.description && (
                  <p className="mt-1 text-ink-soft">{invoice.description}</p>
                )}
              </td>
              <td className="py-3 text-right align-top">{invoice.hours}</td>
              <td className="py-3 text-right align-top">{formatEuro(invoice.rate)}</td>
              <td className="py-3 text-right align-top">{formatEuro(invoice.total)}</td>
            </tr>
          </tbody>
        </table>

        <div className="mb-8 flex justify-end">
          <div className="w-48 text-sm">
            <div className="flex justify-between py-1">
              <span className="text-ink-soft">Totaal</span>
              <strong>{formatEuro(invoice.total)}</strong>
            </div>
          </div>
        </div>

        {invoice.vat_exempt && (
          <p className="border-t border-line pt-4 text-xs text-ink-soft">
            {VAT_EXEMPTION_TEXT}
          </p>
        )}
      </div>
    </div>
  );
}
