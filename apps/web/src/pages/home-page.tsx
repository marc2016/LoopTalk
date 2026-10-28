import { LayoutGridIcon } from "lucide-react";
import { Link } from "react-router";
import { CreateBoardDialog } from "@/components/create-board-dialog";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/format";
import { useBoards } from "@/lib/queries";

export function HomePage() {
  const boards = useBoards();

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Meine Boards</h1>
          <p className="text-muted-foreground">Boards, die du erstellt oder über einen Link geöffnet hast.</p>
        </div>
        <CreateBoardDialog />
      </div>

      {boards.isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : boards.data?.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card p-10 text-center">
          <LayoutGridIcon className="mx-auto size-8 text-muted-foreground" aria-hidden />
          <p className="mt-3 font-medium">Noch keine Boards</p>
          <p className="text-sm text-muted-foreground">Erstelle ein Board oder öffne einen Link, den du bekommen hast.</p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {boards.data?.map((board) => (
            <li key={board.slug}>
              <Link to={`/b/${board.slug}`} className="block rounded-xl focus-visible:ring-3 focus-visible:ring-ring/50">
                <Card className="transition-shadow hover:shadow-md">
                  <CardHeader>
                    <CardTitle>{board.name}</CardTitle>
                    <CardDescription>Erstellt am {formatDateTime(board.createdAt)}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
