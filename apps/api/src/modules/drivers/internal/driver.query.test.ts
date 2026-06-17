import { PgDialect } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";

import { buildDriverFilters } from "./driver.query";

describe("buildDriverFilters", () => {
  it("matches full name searches across first and last name columns", () => {
    const [filter] = buildDriverFilters({
      limit: 20,
      page: 1,
      search: "Arthur Prydatko",
    });

    const query = filter ? new PgDialect().sqlToQuery(filter) : null;

    expect(query?.sql).toContain('"drivers"."first_name" ilike');
    expect(query?.sql).toContain('"drivers"."last_name" ilike');
    expect(query?.params).toContain("%Arthur Prydatko%");
    expect(query?.params).toContain("%Arthur%");
    expect(query?.params).toContain("%Prydatko%");
  });
});
