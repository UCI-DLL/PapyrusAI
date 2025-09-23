import React from "react";
import { Button } from "./ui/button";

interface MessageOptionsProps {
  message: string;
  options: Array<{title: string, message: string}>;
}

export default function MessageOptions(props: MessageOptionsProps) {
  return (
    <div className="mt-2">
      <div className="text-xs text-muted-foreground mb-2 pl-2">
        {props.message}
      </div>
      <div className="space-y-2">
        {props.options.map((option: { title: string; message: string }, idx: number) => (
          <Button
            key={idx}
            variant="outline"
            className="w-full justify-start items-start text-left flex-col gap-1"
          >
            <div className="font-medium text-sm">{option.title}</div>
            <div className="text-xs text-muted-foreground">{option.message}</div>
          </Button>
        ))}
      </div>
    </div>
  )
}