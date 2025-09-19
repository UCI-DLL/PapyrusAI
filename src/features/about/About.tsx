import React from "react";
import Markdown from "react-markdown";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Info } from "lucide-react";

export default function About(): JSX.Element {
  const text = `PapyrusAI was developed by the [Digital Learning Lab](https://www.digitallearninglab.org/) at the University of California, Irvine, in partnership with the Samueli School of Engineering, as part of an NSF grant (#23152984).

While our initial goal is to develop this tool for use in higher education courses, we received a Proof of Product grant from UCI's Beall Applied Innovation Center to adapt the tool for secondary school and determine the marketability and feasibility of commercializing PapyrusAI.

This tool is built on AWS serverless functions and React for the front end. We are using GPT-4 via OpenAI's API to power our tutor, although we are exploring other language models such as Claude and Llama 2 as alternatives.

If you want to learn more about what we're doing or want to get involved, email us at <digitallearninglab@uci.edu>.`;

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
              About <span className="text-primary">PapyrusAI</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl text-base leading-6">
              Learn about our mission and the team behind PapyrusAI
            </p>
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
                Our Story
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
                        className="text-primary underline underline-offset-2 hover:no-underline font-medium transition-colors duration-200"
                      >
                        {children}
                      </a>
                    ),
                  }}
                >
                  {text}
                </Markdown>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}