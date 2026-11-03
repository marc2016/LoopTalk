import { BOARD_WALLS, type BoardWall } from "@looptalk/shared";

export const walls = BOARD_WALLS;

export const wallNames: Record<BoardWall, string> = {
  paper: "Papier",
  cork: "Kork",
  whiteboard: "Whiteboard",
};

export const wallName = (wall: unknown): string => wallNames[wall as BoardWall] ?? String(wall);
