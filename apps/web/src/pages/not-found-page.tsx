import { Link } from "react-router";
import { Button } from "@/components/ui/button";

export function NotFoundPage({ message = "Diese Seite gibt es nicht." }: { message?: string }) {
  return (
    <div className="mx-auto mt-16 max-w-md text-center">
      <h1 className="text-xl font-semibold">Nicht gefunden</h1>
      <p className="mt-2 text-muted-foreground">{message}</p>
      <Button asChild className="mt-6">
        <Link to="/">Zur Startseite</Link>
      </Button>
    </div>
  );
}
