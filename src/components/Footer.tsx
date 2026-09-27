import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-[1080px] flex-wrap items-center justify-between gap-3 px-6 py-8 text-xs text-ink-soft">
        <span>© {new Date().getFullYear()} Flexhulp</span>
        <div className="flex gap-4">
          <Link href="/privacy" className="hover:text-ink">
            Privacyverklaring
          </Link>
          <Link href="/terms" className="hover:text-ink">
            Algemene voorwaarden
          </Link>
        </div>
      </div>
    </footer>
  );
}
