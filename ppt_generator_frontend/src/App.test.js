import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

const LS_NORMAL_SLIDES_KEY = "pptgen_normal_slides_v1";

function openSlideMegaMenu(user) {
  /**
   * SlideMegaMenu trigger is a <button class="smButton"> but its accessible name is the
   * *current selection label* (e.g., "Global Cover", "Slide 4 — Untitled ..."), not "Slide".
   *
   * The stable element we can target is the nav item labeled "Slides" in the header.
   * We scope to the nearest .navItem container and click its button.
   */
  const slidesLabel = screen.getByText(/^Slides$/i);
  const navItem = slidesLabel.closest(".navItem");
  if (!navItem) throw new Error("Could not find Slides nav item container");
  return user.click(within(navItem).getByRole("button"));
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

  const deleteBtn = screen.getByRole("button", { name: /Delete Slide/i });
  expect(deleteBtn).toBeEnabled();

  await user.click(deleteBtn);

  // Confirm dialog should appear
  const dialog = screen.getByRole("dialog", { name: /Delete slide\?/i });
  expect(within(dialog).getByText(/cannot be undone/i)).toBeInTheDocument();

  await user.click(within(dialog).getByRole("button", { name: /^Delete$/i }));

  // After deletion, selection should move to a neighboring slide.
  expect(screen.getByText(/^(Slide\s+\d+\s+—|Global Cover|Global Last Page)/i)).toBeInTheDocument();

  // App starts with 1 normal slide by default.
  // After adding 2 and deleting 1, we should have 2 normal slides remaining.
  await waitFor(() => {
    const stored = JSON.parse(window.localStorage.getItem(LS_NORMAL_SLIDES_KEY) || "[]");
    expect(Array.isArray(stored)).toBe(true);
    expect(stored).toHaveLength(2);
  });
});

test("regression: deleting a selected normal slide decreases count and changes selection", async () => {
  const user = userEvent.setup();
  render(<App />);

  // Create a stable scenario: start (1) + add 2 => 3 normal slides total.
  await user.click(screen.getByRole("button", { name: /Add slide/i }));
  await user.click(screen.getByRole("button", { name: /Add slide/i }));

  // Select the *middle* normal slide so we can assert selection moves to a neighbor.
  await selectNormalSlideByIndex(user, 1);

  // Capture selection label before delete (the visible mega-menu label).
  const beforeLabel = screen.getByText(/^Slide\s+\d+\s+—/i).textContent;

  // Delete from header -> confirm in modal.
  await user.click(screen.getByRole("button", { name: /Delete Slide/i }));
  const dialog = screen.getByRole("dialog", { name: /Delete slide\?/i });
  await user.click(within(dialog).getByRole("button", { name: /^Delete$/i }));

  // Persisted slide list should have decreased by 1 (3 -> 2).
  await waitFor(() => {
    const stored = JSON.parse(window.localStorage.getItem(LS_NORMAL_SLIDES_KEY) || "[]");
    expect(stored).toHaveLength(2);
  });

  // Selection should now show a different slide label (prefer previous, else next).
  const afterLabel = screen.getByText(/^(Slide\s+\d+\s+—|Global Cover|Global Last Page)/i).textContent;
  expect(afterLabel).not.toEqual(beforeLabel);
});

test("top-bar Delete deletes Skill Factory Slide 1 (via modal) and keeps app stable", async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole("button", { name: /Add Skill Factory/i }));
  expect(screen.getByRole("heading", { name: /Skill Factory – Slide 1/i })).toBeInTheDocument();

  const deleteBtn = screen.getByRole("button", { name: /Delete Factory Slide/i });
  expect(deleteBtn).toBeEnabled();

  await user.click(deleteBtn);

  const dialog = screen.getByRole("dialog", { name: /Delete slide\?/i });
  expect(within(dialog).getByText(/Skill Factory slide/i)).toBeInTheDocument();
  await user.click(within(dialog).getByRole("button", { name: /^Delete$/i }));

  // After deleting SF Slide 1, app should still render header Delete button.
  expect(screen.getByRole("button", { name: /Delete Slide|Delete Factory Slide/i })).toBeInTheDocument();
});
