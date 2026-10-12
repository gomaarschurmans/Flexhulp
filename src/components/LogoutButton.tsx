import { logout } from "@/app/auth/actions";

export function LogoutButton() {
  return (
    <form action={logout}>
      <button type="submit" className="btn btn-ghost px-3.5 py-2.5 text-xs sm:py-2">
        Uitloggen
      </button>
    </form>
  );
}
