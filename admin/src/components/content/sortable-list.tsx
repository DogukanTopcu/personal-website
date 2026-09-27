"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DotsSixVertical } from "@phosphor-icons/react";
import { useId, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export type DragHandleProps = ComponentProps<"button">;

type SortableListProps<T> = {
  items: T[];
  getId: (item: T) => string;
  onReorder: (next: T[]) => void;
  renderItem: (item: T, handle: DragHandleProps, index: number) => ReactNode;
  layout?: "list" | "grid";
  className?: string;
  itemClassName?: string;
  disabled?: boolean;
};

/** Drag to reorder, with a handle and keyboard support (space, arrows, space). */
export function SortableList<T>({
  items,
  getId,
  onReorder,
  renderItem,
  layout = "list",
  className,
  itemClassName,
  disabled = false,
}: SortableListProps<T>) {
  const id = useId();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const ids = items.map(getId);

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from < 0 || to < 0) return;
    onReorder(arrayMove(items, from, to));
  }

  return (
    <DndContext id={id} sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={ids} strategy={layout === "grid" ? rectSortingStrategy : verticalListSortingStrategy} disabled={disabled}>
        <ul className={className}>
          {items.map((item, index) => (
            <SortableItem key={getId(item)} id={getId(item)} className={itemClassName} disabled={disabled}>
              {(handle) => renderItem(item, handle, index)}
            </SortableItem>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function SortableItem({
  id,
  className,
  disabled,
  children,
}: {
  id: string;
  className?: string;
  disabled: boolean;
  children: (handle: DragHandleProps) => ReactNode;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id, disabled });

  const handle: DragHandleProps = {
    ref: setActivatorNodeRef,
    ...attributes,
    ...listeners,
    type: "button",
    "aria-label": "Drag to reorder",
    disabled,
    className: cn(
      "flex h-8 w-6 shrink-0 cursor-grab touch-none items-center justify-center text-ink-soft hover:text-ink disabled:cursor-default disabled:opacity-40",
      isDragging && "cursor-grabbing",
    ),
    children: <DotsSixVertical size={16} aria-hidden="true" />,
  };

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("relative", isDragging && "z-10 opacity-80", className)}
    >
      {children(handle)}
    </li>
  );
}
