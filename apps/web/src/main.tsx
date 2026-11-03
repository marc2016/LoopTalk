import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppShell } from "@/components/app-shell";
import { PageContainer } from "@/components/page-container";
import { ApiError } from "@/lib/api";
import { AuditPage } from "@/pages/audit-page";
import { BoardLayout } from "@/pages/board-layout";
import { BoardPage } from "@/pages/board-page";
import { HistoryPage } from "@/pages/history-page";
import { HomePage } from "@/pages/home-page";
import { NotFoundPage } from "@/pages/not-found-page";
import { ParticipantsPage } from "@/pages/participants-page";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10_000,
      retry: (count, err) => !(err instanceof ApiError && err.status < 500) && count < 2,
    },
  },
});

const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      {
        index: true,
        element: (
          <PageContainer>
            <HomePage />
          </PageContainer>
        ),
      },
      {
        path: "b/:slug",
        element: <BoardLayout />,
        children: [
          { index: true, element: <BoardPage /> },
          { path: "history", element: <HistoryPage /> },
          { path: "audit", element: <AuditPage /> },
          { path: "participants", element: <ParticipantsPage /> },
        ],
      },
      {
        path: "*",
        element: (
          <PageContainer>
            <NotFoundPage />
          </PageContainer>
        ),
      },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={200}>
        <RouterProvider router={router} />
        {/* Oben unter der Glasleiste, damit Hinweise das Dock am unteren Rand nicht verdecken */}
        <Toaster position="top-right" offset={72} richColors />
      </TooltipProvider>
    </QueryClientProvider>
  </StrictMode>,
);
