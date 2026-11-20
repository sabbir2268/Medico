import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "./Button";

describe("Button", () => {
  it("renders its label", () => {
    render(<Button>Save changes</Button>);

    expect(screen.getByRole("button", { name: "Save changes" })).toBeInTheDocument();
  });

  it("defaults to type button so it does not submit forms accidentally", () => {
    render(<Button>Cancel</Button>);

    expect(screen.getByRole("button", { name: "Cancel" })).toHaveAttribute(
      "type",
      "button",
    );
  });
});
