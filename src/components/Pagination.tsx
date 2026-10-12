"use client";

export const PAGE_SIZE = 15;

export function Pagination({
  page,
  total,
  pageSize = PAGE_SIZE,
  onPage,
}: {
  page: number;
  total: number;
  pageSize?: number;
  onPage: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-ink-soft">
      <span>
        {from}–{to} van {total}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="btn btn-ghost px-3.5 py-2 text-xs"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          Vorige
        </button>
        <span>
          Pagina {page} van {pages}
        </span>
        <button
          type="button"
          className="btn btn-ghost px-3.5 py-2 text-xs"
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
        >
          Volgende
        </button>
      </div>
    </div>
  );
}
