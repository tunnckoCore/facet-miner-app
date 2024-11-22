"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface SwitchWithStateProps {
  disabled?: boolean;
  defaultState?: boolean;
  onLabel?: string;
  offLabel?: string;
  onToggle?: (state: boolean) => void;
}

export default function SwitchWithState({
  defaultState = false,
  onLabel = "On",
  offLabel = "Off",
  onToggle,
  ...props
}: SwitchWithStateProps) {
  const [isOn, setIsOn] = useState(defaultState);

  const handleToggle = (checked: boolean) => {
    setIsOn(checked);
    if (onToggle) {
      onToggle(checked);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Switch
        id="theme-mode"
        checked={isOn}
        onCheckedChange={handleToggle}
        {...props}
      />
      <Label htmlFor="theme-mode" className="flex items-center space-x-2">
        {isOn ? <span>{onLabel}</span> : <span>{offLabel}</span>}
      </Label>
    </div>
  );
}
