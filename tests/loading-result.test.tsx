import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { LoadingResult } from "@/components/LoadingResult";

it("announces the file being read and hides the placeholder shapes from screen readers", () => {
  const { container } = render(<LoadingResult fileName="KBS-DR118.pdf" />);
  expect(screen.getByRole("status")).toHaveTextContent("Uploading and reading KBS-DR118.pdf…");
  const skeleton = container.querySelector('[aria-hidden="true"]')!;
  expect(skeleton.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(5);
  expect(skeleton).toHaveTextContent("");
});
