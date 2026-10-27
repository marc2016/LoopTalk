import { listAudit, listCardAudit } from "../audit/query";
import { boardService } from "./boards";
import { cardService } from "./cards";
import type { ServiceDeps } from "./common";
import { meetingService } from "./meetings";
import { participantService } from "./participants";

export type { BoardNotifier, BoardRow, ServiceDeps } from "./common";

export function createServices(deps: ServiceDeps) {
  return {
    boards: boardService(deps),
    cards: cardService(deps),
    meetings: meetingService(deps),
    participants: participantService(deps),
    audit: {
      list: (boardId: number, query: Parameters<typeof listAudit>[2]) => listAudit(deps.db, boardId, query),
      card: (boardId: number, cardId: number) => listCardAudit(deps.db, boardId, cardId),
    },
  };
}

export type Services = ReturnType<typeof createServices>;
