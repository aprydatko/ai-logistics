import { expect, type Page, test } from "@playwright/test";

const waitForLoginFormHydration = async (page: Page): Promise<void> => {
  await page.getByRole("button", { name: "Show password" }).click();
  await expect(page.getByRole("button", { name: "Hide password" })).toBeVisible();
  await page.getByRole("button", { name: "Hide password" }).click();
  await expect(page.getByRole("button", { name: "Show password" })).toBeVisible();
};

test.describe("auth", () => {
  test("redirects anonymous dashboard visitors to login", async ({ page }) => {
    await page.goto("/dashboard");

    await expect(page).toHaveURL("/login?next=%2Fdashboard");
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  });

  test("shows an error for invalid login credentials", async ({ page }) => {
    await page.goto("/login");
    await waitForLoginFormHydration(page);

    await page.getByLabel("Email").fill("wrong@example.com");
    await page.getByRole("textbox", { name: "Password" }).fill("password123");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(
      page.getByText("Unable to sign in. Check your credentials and try again."),
    ).toBeVisible();
    await expect(page).toHaveURL("/login");
  });

  test("signs in with valid credentials and opens the dashboard", async ({ page }) => {
    await page.goto("/login");
    await waitForLoginFormHydration(page);

    await page.getByLabel("Email").fill("alex.morgan@example.com");
    await page.getByRole("textbox", { name: "Password" }).fill("password123");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL("/dashboard");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

    const cookies = await page.context().cookies();
    expect(cookies.some((cookie) => cookie.name === "access_token")).toBe(true);
    expect(cookies.some((cookie) => cookie.name === "refresh_token")).toBe(true);
  });
});
