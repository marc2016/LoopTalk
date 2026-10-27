import type {
  AddPersonInput,
  AuditEntry,
  AuditPage,
  BoardSummary,
  BoardView,
  CreateCardInput,
  Me,
  MeetingHistoryEntry,
  SetRolesInput,
  UpdateCardInput,
  UserRef,
} from "@looptalk/shared";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "./api";

export const keys = {
  me: ["me"] as const,
  boards: ["boards"] as const,
  board: (slug: string) => ["board", slug] as const,
};

export const useMe = () => useQuery({ queryKey: keys.me, queryFn: () => api<Me>("/me") });

export const useBoards = () => useQuery({ queryKey: keys.boards, queryFn: () => api<BoardSummary[]>("/boards") });

export const useBoard = (slug: string) =>
  useQuery({ queryKey: keys.board(slug), queryFn: () => api<BoardView>(`/boards/${slug}`) });

export const useHistory = (slug: string) =>
  useQuery({
    queryKey: [...keys.board(slug), "meetings"],
    queryFn: () => api<MeetingHistoryEntry[]>(`/boards/${slug}/meetings`),
  });

export const useCardAudit = (slug: string, cardId: number | null) =>
  useQuery({
    queryKey: [...keys.board(slug), "cards", cardId, "audit"],
    queryFn: () => api<AuditEntry[]>(`/boards/${slug}/cards/${cardId}/audit`),
    enabled: cardId !== null,
  });

export function useAudit(slug: string, filter: { actor?: number; action?: string }) {
  return useInfiniteQuery({
    queryKey: [...keys.board(slug), "audit", filter],
    initialPageParam: undefined as number | undefined,
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams();
      if (pageParam) params.set("before", String(pageParam));
      if (filter.actor) params.set("actor", String(filter.actor));
      if (filter.action) params.set("action", filter.action);
      return api<AuditPage>(`/boards/${slug}/audit?${params}`);
    },
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
}

function onError(err: Error) {
  toast.error(err.message);
}

/** Jede Änderung lädt das Board neu; andere Clients erfahren es über SSE. */
function useBoardMutation<TVars, TResult = void>(slug: string, fn: (vars: TVars) => Promise<TResult>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onError,
    onSettled: () => qc.invalidateQueries({ queryKey: keys.board(slug) }),
  });
}

export function useCreateBoard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api<BoardSummary>("/boards", { method: "POST", body: { name } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.boards }),
  });
}

export function useBoardActions(slug: string) {
  const base = `/boards/${slug}`;
  const qc = useQueryClient();
  return {
    rename: useMutation({
      mutationFn: (name: string) => api<BoardSummary>(base, { method: "PATCH", body: { name } }),
      onSuccess: () => {
        void qc.invalidateQueries({ queryKey: keys.board(slug) });
        void qc.invalidateQueries({ queryKey: keys.boards });
      },
    }),
    createCard: useBoardMutation(slug, (input: CreateCardInput) =>
      api<{ id: number }>(`${base}/cards`, { method: "POST", body: input }),
    ),
    updateCard: useBoardMutation(slug, ({ id, ...input }: UpdateCardInput & { id: number }) =>
      api(`${base}/cards/${id}`, { method: "PATCH", body: input }),
    ),
    deleteCard: useBoardMutation(slug, (id: number) => api(`${base}/cards/${id}`, { method: "DELETE" })),
    addPerson: useBoardMutation(slug, ({ cardId, ...input }: AddPersonInput & { cardId: number }) =>
      api(`${base}/cards/${cardId}/people`, { method: "POST", body: input }),
    ),
    removePerson: useBoardMutation(slug, ({ cardId, personId }: { cardId: number; personId: number }) =>
      api(`${base}/cards/${cardId}/people/${personId}`, { method: "DELETE" }),
    ),
    start: useBoardMutation(slug, (version: number) =>
      api(`${base}/meetings/current/start`, { method: "POST", body: { version } }),
    ),
    end: useBoardMutation(slug, (version: number) =>
      api<{ moderator: UserRef; protocol: UserRef | null }>(`${base}/meetings/current/end`, {
        method: "POST",
        body: { version },
      }),
    ),
    setRoles: useBoardMutation(slug, (input: SetRolesInput) =>
      api(`${base}/meetings/current/roles`, { method: "PATCH", body: input }),
    ),
    setActive: useBoardMutation(slug, ({ userId, active }: { userId: number; active: boolean }) =>
      api(`${base}/participants/${userId}`, { method: "PATCH", body: { active } }),
    ),
  };
}
