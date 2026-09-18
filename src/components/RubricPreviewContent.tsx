import React from "react";
import { RubricCriterion } from "../utility/types/CourseTypes";
import { useTranslation } from "../hooks/useTranslation";

interface RubricPreviewContentProps {
  criteria: RubricCriterion[];
}

export function RubricPreviewContent({ criteria }: RubricPreviewContentProps) {
  const { t } = useTranslation();

  if (criteria.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("createRubric.rubricGrid")}</p>;
  }

  return (
    <div className="space-y-2">
      {criteria.map((criterion, idx) => (
        <div
          key={criterion.id || idx}
          className="border-l-4 border-l-primary rounded-r-lg bg-muted/20 px-3 py-2.5"
        >
          {/* Criterion header */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
                {idx + 1}
              </span>
              <span className="font-semibold text-sm text-foreground">
                {criterion.name || t("createRubric.unnamedCriterion")}
              </span>
            </div>
            <span className="text-xs font-semibold text-muted-foreground shrink-0 bg-muted px-2 py-0.5 rounded-full">
              {criterion.maxPoints} {t("createRubric.pts")}
            </span>
          </div>

          {criterion.description && (
            <p className="text-xs text-muted-foreground mb-2 ml-7 leading-relaxed">
              {criterion.description}
            </p>
          )}

          {/* Ratings grid */}
          <div
            className="grid gap-2 mt-2"
            style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}
          >
            {criterion.ratings.map((rating, rIdx) => {
              const lowerBound =
                rIdx < criterion.ratings.length - 1
                  ? criterion.ratings[rIdx + 1].maxPoints + 1
                  : 0;
              return (
                <div
                  key={rating.id || rIdx}
                  className="border border-border rounded-md bg-background px-2.5 py-2 space-y-1"
                >
                  <div className="flex items-start justify-between gap-1">
                    <span className="text-xs font-semibold text-foreground leading-tight">
                      {rating.name || `Rating ${rIdx + 1}`}
                    </span>
                    <span className="text-xs font-semibold text-primary shrink-0 whitespace-nowrap">
                      {criterion.useRange
                        ? `${rating.maxPoints}–${lowerBound} ${t("createRubric.pts")}`
                        : `${rating.maxPoints} ${t("createRubric.pts")}`}
                    </span>
                  </div>
                  {rating.description && (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {rating.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
