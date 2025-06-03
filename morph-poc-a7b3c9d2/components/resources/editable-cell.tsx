"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Props interface for the EditableCell component
 * @interface EditableCellProps
 * @property {any} value - The current value of the cell
 * @property {EditableCellType} type - The type of input to display
 * @property {{ label: string; value: string }[]} [options] - Options for select type inputs
 * @property {(value: any) => void} onUpdate - Callback function when value is updated
 */
interface EditableCellProps {
  value: any;
  type:
    | "text"
    | "number"
    | "date"
    | "select"
    | "boolean"
    | "email"
    | "url"
    | "phone";
  options?: { label: string; value: string }[];
  onUpdate: (value: any) => void;
}

/**
 * EditableCell Component
 *
 * A versatile cell component that supports inline editing of different data types.
 * This component is used in the Morph resource table to enable inline editing of resource fields.
 *
 * Features:
 * - Supports multiple input types (text, number, date, select, boolean, etc.)
 * - Keyboard navigation (Enter to save, Escape to cancel)
 * - Automatic focus management
 * - Optimistic updates with Morph integration
 *
 * The onUpdate callback is called when a value is changed, which triggers the Morph API update.
 * The parent component (ClientResourceTable) handles the actual API call to Morph.
 *
 * @param {EditableCellProps} props - Component props
 * @returns {JSX.Element} The editable cell component
 */
export function EditableCell({
  value,
  type,
  options,
  onUpdate,
}: EditableCellProps) {
  // State for managing edit mode and value
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset edit value when the cell value changes (unless currently editing)
  useEffect(() => {
    if (!isEditing) {
      setEditValue(value);
    }
  }, [value, isEditing]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  /**
   * Start editing the cell
   * Initializes the edit value and enters edit mode
   */
  const handleStartEdit = () => {
    setEditValue(value);
    setIsEditing(true);
  };

  /**
   * Cancel editing and revert to original value
   */
  const handleCancel = () => {
    setIsEditing(false);
  };

  /**
   * Save the edited value
   * This triggers the onUpdate callback which will:
   * 1. Update the local state optimistically
   * 2. Call the Morph API to persist the change
   * 3. Handle any errors and revert if necessary
   */
  const handleSave = async () => {
    await onUpdate(editValue);
    setIsEditing(false);
  };

  /**
   * Handle keyboard events for better UX
   * - Enter: Save changes
   * - Escape: Cancel editing
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  // Render appropriate input based on type when in edit mode
  if (isEditing) {
    switch (type) {
      case "select":
        return (
          <div className="w-full">
            <Select
              value={String(editValue)}
              onValueChange={(val) => {
                setEditValue(val);
                onUpdate(val);
                setIsEditing(false);
              }}
            >
              <SelectTrigger className="h-8 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case "date":
        return (
          <div className="w-full">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal h-8",
                    !editValue && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {editValue
                    ? format(new Date(editValue), "PPP")
                    : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={editValue ? new Date(editValue) : undefined}
                  onSelect={(date) => {
                    const dateValue = date?.toISOString() || "";
                    setEditValue(dateValue);
                    onUpdate(dateValue);
                    setIsEditing(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        );

      case "boolean":
        return (
          <div className="w-full">
            <Select
              value={editValue ? "true" : "false"}
              onValueChange={(v) => {
                const boolValue = v === "true";
                setEditValue(boolValue);
                onUpdate(boolValue);
                setIsEditing(false);
              }}
            >
              <SelectTrigger className="h-8 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Yes</SelectItem>
                <SelectItem value="false">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );

      default:
        return (
          <div className="w-full">
            <Input
              ref={inputRef}
              type={type === "number" ? "number" : "text"}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleSave}
              className="h-8 w-full"
              autoFocus
            />
          </div>
        );
    }
  }

  // Format display value based on type
  let displayValue: React.ReactNode = value;

  switch (type) {
    case "date":
      displayValue = value ? format(new Date(value), "PP") : "-";
      break;
    case "boolean":
      displayValue = value ? "Yes" : "No";
      break;
    case "select":
      displayValue = options?.find((o) => o.value === value)?.label || value;
      break;
  }

  // Display mode - clickable cell that shows the current value
  return (
    <div
      className="cursor-pointer py-1 px-2 -mx-2 -my-1 rounded hover:bg-muted/50 transition-colors w-full h-full"
      onClick={handleStartEdit}
    >
      {displayValue || "-"}
    </div>
  );
}
