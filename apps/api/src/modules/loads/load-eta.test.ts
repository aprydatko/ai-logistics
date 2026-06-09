import { describe, expect, it } from "vitest";

import { calculateLoadEta } from "./load-eta";

describe("calculateLoadEta", () => {
  it("calculates a same-shift ETA", () => {
    expect(
      calculateLoadEta({
        averageSpeedMph: 50,
        miles: 250,
        pickupDate: new Date("2026-06-10T08:00:00.000Z"),
      }).toISOString(),
    ).toBe("2026-06-10T13:00:00.000Z");
  });

  it("adds ten hours of rest between driving shifts", () => {
    expect(
      calculateLoadEta({
        averageSpeedMph: 50,
        miles: 750,
        pickupDate: new Date("2026-06-10T08:00:00.000Z"),
      }).toISOString(),
    ).toBe("2026-06-11T09:00:00.000Z");
  });
});
