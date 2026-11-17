// MOB-1487: a plan's count stays on one line. With seven-digit counts
// («1.198.402») four tiles side by side are too narrow, so the tiles go two
// by two, as on the phone; with ordinary counts they stay four in a row.
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { UsersBody } from "./Groups";
import type { Users } from "./types";

const users = (per_plan: Users["per_plan"]): Users => ({ new: { today: 8, d7: 187, d30: 1030 }, registered: 1555, per_plan, store_started_month: 2, latest_at: null });

describe("Utenti registrati per piano", () => {
  it("goes two by two when a count is too long for four tiles", () => {
    render(<UsersBody d={users({ free: 1_198_402, premium: 52_318, unlimited: 21_946, trial: 11_837 })} />);
    const grid = screen.getByText("1.198.402").closest("[data-wide]");
    expect(grid?.getAttribute("data-wide")).toBe("true");
  });

  it("keeps four in a row with ordinary counts", () => {
    render(<UsersBody d={users({ free: 2_098, premium: 41, unlimited: 27, trial: 18 })} />);
    expect(screen.getByText("2.098").closest("[data-wide]")?.getAttribute("data-wide")).toBe("false");
  });
});
