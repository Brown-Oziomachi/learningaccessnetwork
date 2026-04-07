"use client";
import { useState, useEffect, useCallback } from "react";

/**
 * useTextSelection
 * Detects text highlighted on the page and returns:
 *   - selectedText: the highlighted string
 *   - position: { x, y } for placing the floating button near the cursor
 *   - clearSelection: call this to dismiss
 */
export function useTextSelection() {
  const [selectedText, setSelectedText] = useState("");
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleSelectionChange = useCallback(() => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();

    if (text && text.length > 3) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelectedText(text);
      setPosition({
        x: rect.left + rect.width / 2,
        y: rect.top + window.scrollY - 48, // float above selection
      });
    } else {
      setSelectedText("");
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mouseup", handleSelectionChange);
    document.addEventListener("touchend", handleSelectionChange);
    return () => {
      document.removeEventListener("mouseup", handleSelectionChange);
      document.removeEventListener("touchend", handleSelectionChange);
    };
  }, [handleSelectionChange]);

  const clearSelection = useCallback(() => {
    window.getSelection()?.removeAllRanges();
    setSelectedText("");
  }, []);

  return { selectedText, position, clearSelection };
}
