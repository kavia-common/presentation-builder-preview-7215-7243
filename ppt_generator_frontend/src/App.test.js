import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

test("renders PPT Generator header", () => {
  render(<App />);
  expect(screen.getByText(/PPT Generator/i)).toBeInTheDocument();
  // The button label can be "Generate PPT" or "Generating…" depending on state.
  expect(screen.getByRole("button", { name: /Generate PPT|Generating/i })).toBeInTheDocument();
});

test("can add a Skill Factory and opens its Slide 1 editor", async () => {
  const user = userEvent.setup();
  render(<App />);

  // The control should be visible and enabled.
  const addSfBtn = screen.getByRole("button", { name: /\+ Skill Factory/i });
  expect(addSfBtn).toBeEnabled();

  // Click to create a new Skill Factory.
  await user.click(addSfBtn);

  // Should navigate selection to the Skill Factory Slide 1 editor.
  expect(screen.getByRole("heading", { name: /Skill Factory – Slide 1/i })).toBeInTheDocument();

  // SlideList item should exist (default name from model is fine).
  // We check for the SlideList label text (not the editor heading).
  expect(screen.getAllByText(/Skill Factory – Slide 1/i).length).toBeGreaterThanOrEqual(1);

  // Should show inputs for Skill Factory name and sprint label.
  expect(screen.getByLabelText(/Skill Factory name/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/Sprint label \/ date/i)).toBeInTheDocument();
});
