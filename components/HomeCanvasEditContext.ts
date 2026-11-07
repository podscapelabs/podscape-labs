"use client";

import { createContext, useContext } from "react";

/** Home canvas editing is shared by full-width blocks and nested shortcut tiles. */
export const HomeCanvasEditContext = createContext(false);

export function useHomeCanvasEditing() {
  return useContext(HomeCanvasEditContext);
}
