"use client";

export function SignOutButton() {
  async function handleClick() {
    await fetch("/api/session/logout", { method: "POST" });
    window.location.assign("/login");
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="rounded-full border border-white/18 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/16"
    >
      Sign Out
    </button>
  );
}
