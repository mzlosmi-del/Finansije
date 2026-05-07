"use client";

import { useTransition } from "react";
import { selectPersonAction } from "@/lib/actions";

type User = { id: string; name: string; color: string };

export function PersonSwitcher({
  users,
  currentId,
}: {
  users: User[];
  currentId: string | null;
}) {
  const [pending, start] = useTransition();
  if (users.length === 0) return null;

  function setPerson(id: string) {
    const fd = new FormData();
    fd.set("userId", id);
    start(() => {
      selectPersonAction(fd);
    });
  }

  return (
    <div className="flex items-center gap-1 rounded-full bg-white/5 p-1">
      {users.map((u) => {
        const active = u.id === currentId;
        return (
          <button
            key={u.id}
            type="button"
            onClick={() => setPerson(u.id)}
            disabled={pending}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition ${
              active ? "text-white" : "text-muted"
            }`}
            style={active ? { background: u.color } : undefined}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: active ? "rgba(255,255,255,0.9)" : u.color }}
            />
            {u.name}
          </button>
        );
      })}
    </div>
  );
}
