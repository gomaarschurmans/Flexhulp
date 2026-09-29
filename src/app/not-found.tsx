import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-screen max-w-[420px] flex-col items-center justify-center px-6 text-center">
      <Image
        src="/flexhulp-logo.png"
        alt="Flexhulp"
        width={190}
        height={40}
        priority
        className="mb-1 h-10 w-auto"
      />
      <p className="mb-10 text-sm text-ink-soft">
        klussen &amp; opdrachten voor studenten
      </p>

      <div className="card w-full">
        <span className="mb-3 block text-5xl font-semibold text-navy">404</span>
        <h1 className="mb-2 text-xl">Deze pagina bestaat niet</h1>
        <p className="mb-6 text-sm text-ink-soft">
          De link klopt niet (meer), of de pagina is verplaatst. Ga terug naar
          de startpagina om verder te gaan.
        </p>
        <Link href="/" className="btn btn-navy inline-block w-full">
          Naar de startpagina
        </Link>
      </div>
    </div>
  );
}
