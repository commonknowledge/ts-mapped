import { ReactNode, RefObject, useEffect, useRef } from "react";

import { ContextMenuContent } from "@/shadcn/ui/context-menu";

/**
 * ContextMenuContent wrapper that fixes bugs that happen when a
 * ContextMenuItem gives focus to a different component, e.g.
 * an "Edit" item that should give focus to an <input>.
 *
 * What normally happens: when a menu item is clicked and the mouse
 * is moved slightly, focus is taken away from the target component
 * and returned to the menu. This is fixed by detecting this focus
 * change and re-focusing the target.
 */
export default function ContextMenuContentWithFocus({
  shouldFocusTarget,
  targetRef,
  children,
}: {
  shouldFocusTarget: boolean;
  targetRef: RefObject<HTMLInputElement | null>;
  children: ReactNode;
}) {
  // Only trap focus for a short while
  const isFocusing = useRef(false);

  useEffect(() => {
    if (shouldFocusTarget) {
      isFocusing.current = true;
      setTimeout(() => {
        targetRef.current?.focus();
      }, 10);
      setTimeout(() => {
        isFocusing.current = false;
      }, 500);
    }
  }, [shouldFocusTarget, targetRef]);

  const onFocusMenu = () => {
    if (shouldFocusTarget && isFocusing.current) {
      targetRef.current?.focus();
    }
  };

  return (
    <ContextMenuContent
      onCloseAutoFocus={(e) => e.preventDefault()}
      onFocus={onFocusMenu}
    >
      {children}
    </ContextMenuContent>
  );
}
