"use client";

import { ArrowSquareOut, DotsThree, PencilSimple, Trash } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ActionResult } from "@/lib/action-result";
import { siteUrl } from "@/lib/paths";

type RowActionsProps = {
  id: string;
  /** Shown in the confirm dialog. */
  name: string;
  editHref: string;
  /** Public path when the row is live, otherwise null (the menu item is disabled). */
  publicPath: string | null;
  onDelete: (id: string) => Promise<ActionResult>;
  /** Extra line in the delete dialog, such as "Lessons go with it." */
  deleteWarning?: ReactNode;
  noun: string;
};

/** Edit, View on site, Delete. Deleting asks first and names the item. */
export function RowActions({ id, name, editHref, publicPath, onDelete, deleteWarning, noun }: RowActionsProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  function remove() {
    startTransition(async () => {
      const result = await onDelete(id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setConfirming(false);
      if (result.warning) toast.warning(result.warning);
      else toast.success(`Deleted "${name}".`);
      router.refresh();
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" icon aria-label={`Actions for ${name}`}>
            <DotsThree size={18} weight="bold" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem asChild>
            <Link href={editHref}>
              <PencilSimple size={14} aria-hidden="true" />
              Edit
            </Link>
          </DropdownMenuItem>
          {publicPath ? (
            <DropdownMenuItem asChild>
              <a href={siteUrl(publicPath)} target="_blank" rel="noopener">
                <ArrowSquareOut size={14} aria-hidden="true" />
                View on site
              </a>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem disabled>
              <ArrowSquareOut size={14} aria-hidden="true" />
              View on site
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setConfirming(true)}>
            <Trash size={14} aria-hidden="true" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={`Delete "${name}"?`}
        description={
          <>
            This {noun} is removed for good. {deleteWarning}
          </>
        }
        confirmLabel={`Delete ${noun}`}
        destructive
        pending={pending}
        onConfirm={remove}
      />
    </>
  );
}
