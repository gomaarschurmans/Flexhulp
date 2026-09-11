import { logout } from "@/app/auth/actions";

export function LogoutButton() {
  return (
    <form action={logout}>
      <button type="submit" className="btn btn-ghost px-3.5 py-2 text-xs">
        Uitloggen
      </button>
    </form>
  );
}
