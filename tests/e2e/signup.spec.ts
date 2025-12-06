import { randomUUID } from "crypto";
import { expect, test } from "@playwright/test";

test.describe("Sign-up flow", () => {
  test("submits the sign-up form and sends a successful request", async ({ page }) => {
    const uniqueEmail = `playwright-${Date.now()}@example.com`;

    await page.route("**/api/onboarding/signup", async (route) => {
      const request = route.request();
      expect(request.method()).toBe("POST");

      const body = request.postDataJSON();
      expect(body).toMatchObject({
        email: uniqueEmail,
        fullName: "John Doe",
        phone: "01012345678",
        roleType: "influencer",
        verificationMethod: "email",
      });

      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          userId: randomUUID(),
          nextPath: "/influencer/profile",
          onboardingStatus: "pending",
        }),
      });
    });

    await page.goto("/signup");

    await page.getByLabel("Full name").fill("John Doe");
    await page.getByLabel("Phone number").fill("01012345678");
    await page.getByRole("textbox", { name: "Email" }).fill(uniqueEmail);
    await page.getByLabel("Password", { exact: true }).fill("password123");
    await page.getByLabel("Confirm password", { exact: true }).fill("password123");
    await page.getByLabel("Influencer", { exact: true }).check();
    await page.getByLabel("Email verification", { exact: true }).check();

    const apiRequestPromise = page.waitForRequest("**/api/onboarding/signup");
    const apiResponsePromise = page.waitForResponse("**/api/onboarding/signup");

    await page.getByRole("button", { name: "Sign up" }).click();

    const request = await apiRequestPromise;
    expect(request.url()).toContain("/api/onboarding/signup");

    const response = await apiResponsePromise;
    expect(response.status()).toBe(201);

    await page.waitForURL(/\/influencer\/profile$/);
  });
});
