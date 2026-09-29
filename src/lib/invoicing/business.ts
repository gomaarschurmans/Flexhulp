export const SELLER = {
  name: "Gomar Schurmans",
  tradeName: "Flexhulp",
  address: "Nielstraat 73, 3840 Borgloon, België",
  vatNumber: "BE 1031.198.882",
};

export const VAT_EXEMPTION_TEXT =
  "Bijzondere vrijstellingsregeling kleine ondernemingen van toepassing (art. 56bis W.BTW) — BTW niet aangerekend.";

export function formatInvoiceNumber(n: number): string {
  return `FH-${String(n).padStart(6, "0")}`;
}
