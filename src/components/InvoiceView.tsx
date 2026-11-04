"use client";

import { formatEuro, formatHours, formatTimeRange } from "@/lib/utils";
import {
  SELLER,
  PAYMENT_TERM_DAYS,
  VAT_EXEMPTION_TEXT,
  formatIban,
  formatInvoiceNumber,
  invoiceDueDate,
} from "@/lib/invoicing/business";
import type { Invoice } from "@/lib/types/domain";

const longDate = (d: Date | string) =>
  new Date(d).toLocaleDateString("nl-BE", { day: "numeric", month: "long", year: "numeric" });

export function InvoiceView({
  invoice,
  paidAt = null,
  onlinePayments = false,
}: {
  invoice: Invoice;
  /** Staat online betalen (Mollie) aan? */
  onlinePayments?: boolean;
  /** Moment waarop de factuur betaald werd (via Mollie), indien al betaald. */
  paidAt?: string | null;
}) {
  const number = formatInvoiceNumber(invoice.invoice_number);

  return (
    <div className="mx-auto max-w-[680px] px-6 py-10">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <h1 className="text-xl">Factuur {number}</h1>
        <button onClick={() => window.print()} className="btn btn-navy px-4 py-2 text-sm">
          Print / bewaar als PDF
        </button>
      </div>

      <div className="card relative">
        {paidAt && (
          <span className="absolute right-6 top-6 hidden rotate-[-6deg] rounded border-2 border-teal px-3 py-1 text-sm font-bold uppercase tracking-wide text-teal sm:block">
            Betaald
          </span>
        )}

        <div className="mb-8 flex flex-wrap items-start justify-between gap-6">
          <div>
            <h2 className="mb-1 text-lg font-semibold">{SELLER.tradeName}</h2>
            <p className="text-sm text-ink-soft">{SELLER.name}</p>
            <p className="text-sm text-ink-soft">{SELLER.address}</p>
            <p className="text-sm text-ink-soft">Ondernemingsnummer: {SELLER.vatNumber}</p>
            <p className="text-sm text-ink-soft">{SELLER.email}</p>
          </div>
          <div className="text-sm text-ink-soft sm:text-right">
            <p className="text-xs font-semibold uppercase">Factuur</p>
            <p className="text-base font-semibold text-ink">{number}</p>
            <p>Factuurdatum: {longDate(invoice.issued_at)}</p>
            <p>Uiterste betaaldatum: {longDate(invoiceDueDate(invoice.issued_at))}</p>
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
              <td className="py-3 text-right align-top">{formatHours(invoice.hours)}</td>
              <td className="py-3 text-right align-top">{formatEuro(invoice.rate)}</td>
              <td className="py-3 text-right align-top">{formatEuro(invoice.total)}</td>
            </tr>
          </tbody>
        </table>

        <div className="mb-8 flex justify-end">
          <div className="w-56 text-sm">
            <div className="flex justify-between py-1">
              <span className="text-ink-soft">Totaal excl. btw</span>
              <span>{formatEuro(invoice.total)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-ink-soft">BTW</span>
              <span>{invoice.vat_exempt ? "—" : "21%"}</span>
            </div>
            <div className="mt-1 flex justify-between border-t border-line py-2 text-base">
              <strong>Totaal te betalen</strong>
              <strong>{formatEuro(invoice.total)}</strong>
            </div>
          </div>
        </div>

        <div className="mb-6 rounded border border-line bg-[#FAF9F6] p-4 text-sm">
          <p className="mb-2 text-xs font-semibold uppercase text-ink-soft">Betaling</p>
          {paidAt ? (
            <p>
              <strong className="text-teal">Betaald op {longDate(paidAt)}.</strong> Bedankt!
            </p>
          ) : (
            <>
              <p className="mb-2">
                Te betalen binnen {PAYMENT_TERM_DAYS} dagen, uiterlijk op{" "}
                <strong>{longDate(invoiceDueDate(invoice.issued_at))}</strong>.
                {onlinePayments &&
                  " Online betalen (Bancontact, iDEAL, kaart of PayPal) kan via de link in de e-mail of op je overzicht op Flexhulp."}
              </p>
              {SELLER.iban ? (
                <p>
                  Liever overschrijven? Rekeningnummer <strong>{formatIban(SELLER.iban)}</strong>{" "}
                  t.n.v. {SELLER.name}, met vermelding van <strong>{number}</strong>.
                </p>
              ) : !onlinePayments ? (
                <p>Betaalinstructies vind je in de e-mail waarmee je deze factuur ontving.</p>
              ) : null}
            </>
          )}
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
