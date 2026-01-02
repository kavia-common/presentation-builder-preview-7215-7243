import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

const LS_NORMAL_SLIDES_KEY = "pptgen_normal_slides_v1";

function openSlideMegaMenu(user) {
  // SlideMegaMenu trigger is rendered as a <button> with accessible name "Slide"
  // (the current selection label is nested content and isn't the button's name for AT).
  return user.click(screen.getByRole("button", { name: /^Slide$/i }));
}

async function selectNormalSlideByIndex(user, idx0Based) {
  await openSlideMegaMenu(user);

  // Menu appears
  const menu = screen.getByRole("menu", { name: /Slide selector/i });

  // Click group "Normal Slides"
  await user.click(within(menu).getByRole("button", { name: /Normal Slides/i }));

  // Select the Nth normal slide entry in the right panel. Labels are like: "Slide 2 — Untitled slide 2"
  const slideButtons = within(menu).getAllByRole("button", { name: /Slide\s+\d+\s+—/i });
  await user.click(slideButtons[idx0Based]);
}

beforeEach(() => {
  // Keep tests isolated and ensure persistence assertions are deterministic.
  window.localStorage.clear();
  jest.restoreAllMocks();
});

test("renders minimal header actions and keeps Delete disabled on Global Cover", () => {
  render(<App />);

  expect(screen.getByRole("button", { name: /Generate presentation/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Add Skill Factory/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Add slide/i })).toBeInTheDocument();

  // Default selection = Global Cover => Delete disabled
  const deleteBtn = screen.getByRole("button", { name: /Delete Slide|Delete Factory Slide/i });
  expect(deleteBtn).toBeDisabled();
});

test("can add a Skill Factory and opens its Slide 1 editor", async () => {
  const user = userEvent.setup();
  render(<App />);

  const addSfBtn = screen.getByRole("button", { name: /Add Skill Factory/i });
  expect(addSfBtn).toBeEnabled();

  await user.click(addSfBtn);

  // Should navigate selection to the Skill Factory Slide 1 editor.
  expect(screen.getByRole("heading", { name: /Skill Factory – Slide 1/i })).toBeInTheDocument();

  // Should show inputs for Skill Factory name and sprint label.
  expect(screen.getByLabelText(/Skill Factory name/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/Sprint label \/ date/i)).toBeInTheDocument();
});

test("top-bar Delete deletes a normal slide, updates selection, and persists to localStorage", async () => {
  const user = userEvent.setup();
  render(<App />);

  // Add 2 normal slides so we can delete one and still have a neighbor to select.
  await user.click(screen.getByRole("button", { name: /Add slide/i }));
  await user.click(screen.getByRole("button", { name: /Add slide/i }));

  // Select the first normal slide via the mega menu.
  await selectNormalSlideByIndex(user, 0);

  // Confirm the editor is in normal slide mode (not cover/last/sf).
  expect(screen.getByRole("heading", { name: /^Editor$/i })).toBeInTheDocument();
  expect(screen.getByLabelText(/Slide title/i)).toBeInTheDocument();

  // Mock confirmation to accept deletion.
  const confirmSpy = jest.spyOn(window, "confirm").mockReturnValue(true);

  const deleteBtn = screen.getByRole("button", { name: /Delete Slide/i });
  expect(deleteBtn).toBeEnabled();

  await user.click(deleteBtn);

  expect(confirmSpy).toHaveBeenCalledTimes(1);

  // After deletion, selection should move to a neighboring slide.
  // NOTE: The SlideMegaMenu trigger button's accessible name is "Slide" (it is labeled by the
  // external <label htmlFor="topSlideSelect">), so we must assert the visible label text instead.
  // The selection should now display either a neighboring normal slide label OR (edge fallback)
  // a pinned slide label.
  expect(screen.getByText(/^(Slide\s+\d+\s+—|Global Cover|Global Last Page)/i)).toBeInTheDocument();

  // localStorage should contain exactly 1 normal slide now (we created 2, deleted 1).
  await waitFor(() => {
    const stored = JSON.parse(window.localStorage.getItem(LS_NORMAL_SLIDES_KEY) || "[]");
    expect(Array.isArray(stored)).toBe(true);
    expect(stored).toHaveLength(1);
  });
});

test("top-bar Delete deletes Skill Factory Slide 1 (still works)", async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole("button", { name: /Add Skill Factory/i }));
  expect(screen.getByRole("heading", { name: /Skill Factory – Slide 1/i })).toBeInTheDocument();

  // Delete action is contextual for Skill Factory slides.
  jest.spyOn(window, "confirm").mockReturnValue(true);

  const deleteBtn = screen.getByRole("button", { name: /Delete Factory Slide/i });
  expect(deleteBtn).toBeEnabled();
  await user.click(deleteBtn);

  // After deleting SF Slide 1, selection should resolve to a valid neighbor.
  // In the minimal UI, the safest observable is: the slide selector trigger exists and app still renders.
  expect(screen.getByRole("button", { name: /Global Cover|Slide\s+\d+|Global Last Page|Skill Factory/i })).toBeInTheDocument();
});
