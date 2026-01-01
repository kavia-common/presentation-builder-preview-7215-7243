import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders PPT Generator header", () => {
  render(<App />);
  expect(screen.getByText(/PPT Generator/i)).toBeInTheDocument();
  // The button label can be "Generate PPT" or "Generating…" depending on state.
  expect(screen.getByRole("button", { name: /Generate PPT|Generating/i })).toBeInTheDocument();
});
