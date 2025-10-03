import { randomUUID } from "crypto";
import { expect, test } from "@playwright/test";

test.describe("회원가입 플로우", () => {
  test("회원가입 폼 제출 시 /api/onboarding/signup 으로 성공 요청을 보낸다", async ({ page }) => {
    const uniqueEmail = `playwright-${Date.now()}@example.com`;

    await page.route("**/api/onboarding/signup", async (route) => {
      const request = route.request();
      expect(request.method()).toBe("POST");

      const body = request.postDataJSON();
      expect(body).toMatchObject({
        email: uniqueEmail,
        fullName: "홍길동",
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

    await page.getByLabel("이름").fill("홍길동");
    await page.getByLabel("휴대폰 번호").fill("01012345678");
    await page.getByRole("textbox", { name: "이메일" }).fill(uniqueEmail);
    await page.getByLabel("비밀번호", { exact: true }).fill("password123");
    await page.getByLabel("비밀번호 확인", { exact: true }).fill("password123");
    await page.getByLabel("인플루언서", { exact: true }).check();
    await page.getByLabel("이메일 인증", { exact: true }).check();

    const apiRequestPromise = page.waitForRequest("**/api/onboarding/signup");
    const apiResponsePromise = page.waitForResponse("**/api/onboarding/signup");

    await page.getByRole("button", { name: "가입하기" }).click();

    const request = await apiRequestPromise;
    expect(request.url()).toContain("/api/onboarding/signup");

    const response = await apiResponsePromise;
    expect(response.status()).toBe(201);

    await page.waitForURL(/\/influencer\/profile$/);
  });
});
