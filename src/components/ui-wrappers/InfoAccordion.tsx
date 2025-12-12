import React, { ReactNode } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { t } from "i18next";
import { useTranslation } from "react-i18next";

interface InfoAccordionProps {
  children: ReactNode;
  className?: string;
}

export function InfoAccordion({
  children,
  className = "",
}: InfoAccordionProps): JSX.Element {
  const { t } = useTranslation();
  return (
    <Accordion type="single" collapsible className={`w-full ${className}`}>
      <AccordionItem value="help-info" className="border-none">
        <AccordionTrigger className="text-sm text-muted-foreground hover:no-underline py-2 flex items-center gap-2 space-x-2 justify-start">
          {t("courses.tapToLearnMore")}
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-4">{children}</div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
