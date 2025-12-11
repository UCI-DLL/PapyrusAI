import { Loader2 } from "lucide-react";

export function PageLoader({pageName}: {pageName: string}) {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-4">
        <Loader2
          className="h-8 w-8 animate-spin text-primary"
          aria-hidden="true"
        />
        <p className="text-muted-foreground">Loading {pageName}</p>
      </div>
    </div>
  );
}

export function PageHeaderCard({
  title,
  icon,
}: {
  title: string;
  icon: React.ReactNode;
}) {
  return (
    <header className="animate-in slide-in-from-bottom-4 duration-700">
      <div className="relative overflow-hidden bg-card border rounded-xl p-6 shadow-lg">
        <div
          className="absolute top-0 right-0 w-48 h-48 opacity-10"
          aria-hidden="true"
        >
          {icon}
        </div>

        <div className="relative z-10">
          <h1 className="text-4xl font-bold mb-2 text-foreground leading-tight">
            {title}
          </h1>
        </div>
      </div>
    </header>
  );
}
