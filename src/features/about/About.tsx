import React, { useEffect } from "react";
import Markdown from "react-markdown";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Info } from "lucide-react";
import { useTranslation } from "../../hooks/useTranslation";
import Post from "../../utility/Post";
import { logEvent } from "../../utility/endpoints/UserEndpoints";

export default function About(): JSX.Element {
  const { t } = useTranslation();

  useEffect(() => {
    //log page
    Post(logEvent(), {
      eventType: "view_page",
      metadata: {
        page: "about",
      }
    })
  }, [])

  return (
    <main className="bg-background text-foreground p-4 space-y-6">
      {/* Standard Page Header Pattern */}
      <header className="animate-in slide-in-from-bottom-4 duration-700">
        <div className="relative overflow-hidden bg-card border rounded-xl p-6 shadow-lg">
          <div
            className="absolute top-0 right-0 w-48 h-48 opacity-10"
            aria-hidden="true"
          >
            <Info size={192} className="text-primary" />
          </div>

          <div className="relative z-10">
            <h1 className="text-4xl font-bold mb-2 text-foreground leading-tight">
              {t("about.aboutPapyrusAI")}
            </h1>
          </div>
        </div>
      </header>

      {/* Content Section */}
      <section aria-labelledby="about-content">
        <div className="w-full">
          <Card className="border shadow-sm transition-all duration-300 hover:shadow-md">
            <CardHeader>
              <CardTitle
                id="about-content"
                className="flex items-center gap-2 text-2xl font-bold text-foreground"
              >
                <Info className="h-6 w-6 text-primary" aria-hidden="true" />
                {t("about.ourStory")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <Markdown
                  className="space-y-4"
                  components={{
                    p: ({ children }) => (
                      <p className="text-muted-foreground leading-6 text-base mb-4">
                        {children}
                      </p>
                    ),
                    a: ({ href, children }) => (
                      <a
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary dark:text-gold colorful-dark:text-gold 
                        underline underline-offset-2 hover:no-underline font-medium transition-colors duration-200"
                      >
                        {children}
                      </a>
                    ),
                  }}
                >
                  {t("about.aboutMessage")}
                </Markdown>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
