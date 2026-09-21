// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, test, vi } from "vitest";
import CustomMultiSelect from "@/components/forms/CustomMultiSelect";

// jsdom lacks these browser APIs, which cmdk uses to size and scroll its list
class ResizeObserverStub {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
vi.stubGlobal("ResizeObserver", ResizeObserverStub);
Element.prototype.scrollIntoView = vi.fn();

// Airtable (and CSV-imported) column names can start with a byte order mark.
// cmdk trims item values before passing them to `onSelect`, and trim() strips
// U+FEFF, so the component must report the original option string.
const BOM_COLUMN = "﻿Title";

describe("CustomMultiSelect", () => {
  test("reports the exact option string, including a leading BOM", () => {
    const onChange = vi.fn();
    render(
      <CustomMultiSelect
        id="name-columns"
        label="Name columns"
        allOptions={[BOM_COLUMN, "Address", "  Padded  "]}
        selectedOptions={[]}
        onChange={onChange}
      />,
    );

    // Radix DropdownMenu opens on pointerdown of the trigger
    fireEvent.pointerDown(
      screen.getByRole("button", { name: "Name columns" }),
      {
        button: 0,
        ctrlKey: false,
      },
    );

    // Accessible names are whitespace-normalised, so match on raw text
    const findOption = (text: string) => {
      const option = screen
        .getAllByRole("option")
        .find((o) => o.textContent === text);
      if (!option) {
        throw new Error(`Option not found: ${JSON.stringify(text)}`);
      }
      return option;
    };

    fireEvent.click(findOption(BOM_COLUMN));
    expect(onChange).toHaveBeenLastCalledWith(BOM_COLUMN);

    fireEvent.click(findOption("  Padded  "));
    expect(onChange).toHaveBeenLastCalledWith("  Padded  ");
  });
});
