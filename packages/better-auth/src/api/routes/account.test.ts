import { describe, expect, it, vi } from "vitest";
import { getTestInstance } from "../../test-utils/test-instance";
import { parseSetCookieHeader } from "../../cookies";
import type { GoogleProfile } from "../../social-providers";
import { DEFAULT_SECRET } from "../../utils/constants";
import { getOAuth2Tokens } from "../../oauth2";
import { signJWT } from "../../crypto/jwt";
import { BASE_ERROR_CODES } from "../../error/codes";

let email = "";
vi.mock("../../oauth2", async (importOriginal) => {
	const original = (await importOriginal()) as any;
	return {
		...original,
		validateAuthorizationCode: vi
			.fn()
			.mockImplementation(async (...args: any) => {
				const data: GoogleProfile = {
					email,
					email_verified: true,
					name: "First Last",
					picture: "https://lh3.googleusercontent.com/a-/AOh14GjQ4Z7Vw",
					exp: 1234567890,
					sub: "1234567890",
					iat: 1234567890,
					aud: "test",
					azp: "test",
					nbf: 1234567890,
					iss: "test",
					locale: "en",
					jti: "test",
					given_name: "First",
					family_name: "Last",
				};
				const testIdToken = await signJWT(data, DEFAULT_SECRET);
				const tokens = getOAuth2Tokens({
					access_token: "test",
					refresh_token: "test",
					id_token: testIdToken,
				});
				return tokens;
			}),
	};
});

describe("account", async () => {
	const { auth, client, signInWithTestUser } = await getTestInstance({
		socialProviders: {
			google: {
				clientId: "test",
				clientSecret: "test",
				enabled: true,
			},
		},
		account: {
			accountLinking: {
				allowDifferentEmails: true,
			},
		},
	});

	const { headers } = await signInWithTestUser();

	it("should list all accounts", async () => {
		const accounts = await client.listAccounts({
			fetchOptions: {
				headers,
			},
		});
		expect(accounts.data?.length).toBe(1); // Initially, the user has one account
	});

	it("should link first account", async () => {
		const linkAccountRes = await client.linkSocial(
			{
				provider: "google",
				callbackURL: "/callback",
			},
			{
				headers,
				onSuccess(context) {
					const cookies = parseSetCookieHeader(
						context.response.headers.get("set-cookie") || "",
					);
					headers.set(
						"cookie",
						`better-auth.state=${cookies.get("better-auth.state")?.value}`,
					);
				},
			},
		);
		expect(linkAccountRes.data).toMatchObject({
			url: expect.stringContaining("google.com"),
			redirect: true,
		});
		const state =
			new URL(linkAccountRes.data!.url).searchParams.get("state") || "";
		email = "test@test.com";
		await client.$fetch("/callback/google", {
			query: {
				state,
				code: "test",
			},
			method: "GET",
			headers,
			onError(context) {
				expect(context.response.status).toBe(302);
				const location = context.response.headers.get("location");
				expect(location).toBeDefined();
				expect(location).toContain("/callback");
			},
		});

		const { headers: headers2 } = await signInWithTestUser();
		const accounts = await client.listAccounts({
			fetchOptions: { headers: headers2 },
		});
		expect(accounts.data?.length).toBe(2); // After linking the first Google account, there are 2 accounts
	});

	it("should link second account from the same provider", async () => {
		// Assuming user is already signed in
		const { headers: headers2 } = await signInWithTestUser();
		const linkAccountRes = await client.linkSocial(
			{
				provider: "google",
				callbackURL: "/callback",
			},
			{
				headers: headers2,
				onSuccess(context) {
					const cookies = parseSetCookieHeader(
						context.response.headers.get("set-cookie") || "",
					);
					headers.set(
						"cookie",
						`better-auth.state=${cookies.get("better-auth.state")?.value}`,
					);
				},
			},
		);
		expect(linkAccountRes.data).toMatchObject({
			url: expect.stringContaining("google.com"),
			redirect: true,
		});
		const state =
			new URL(linkAccountRes.data!.url).searchParams.get("state") || "";
		email = "test2@test.com"; // Different email for second account
		await client.$fetch("/callback/google", {
			query: {
				state,
				code: "test",
			},
			method: "GET",
			headers,
			onError(context) {
				expect(context.response.status).toBe(302);
				const location = context.response.headers.get("location");
				expect(location).toBeDefined();
				expect(location).toContain("/callback");
			},
		});

		const { headers: headers3 } = await signInWithTestUser();
		const accounts = await client.listAccounts({
			fetchOptions: { headers: headers3 },
		});
		expect(accounts.data?.length).toBe(3); // After linking the second Google account, there are 3 accounts
	});
	it("should unlink account", async () => {
		const { headers } = await signInWithTestUser();
		const previousAccounts = await client.listAccounts({
			fetchOptions: {
				headers,
			},
		});
		expect(previousAccounts.data?.length).toBe(3); // There should be 3 accounts
		// unlinking the second account from the list -which is not the primary one
		const unlinkAccountId = previousAccounts.data![1].accountId;
		const unlinkRes = await client.unlinkAccount({
			providerId: "google", // unlink a Google account
			accountId: unlinkAccountId!,
			fetchOptions: {
				headers,
			},
		});
		expect(unlinkRes.data?.status).toBe(true);
		const accounts = await client.listAccounts({
			fetchOptions: {
				headers,
			},
		});
		expect(accounts.data?.length).toBe(2); // After unlinking one account, there should be 2 left
	});

	it("should fail to unlink the last account of a provider", async () => {
		const { headers } = await signInWithTestUser();
		const previousAccounts = await client.listAccounts({
			fetchOptions: {
				headers,
			},
		});
		const unlinkAccountId = previousAccounts.data![0].accountId;
		const unlinkRes = await client.unlinkAccount({
			providerId: "credential",
			accountId: unlinkAccountId,
			fetchOptions: {
				headers,
			},
		});
		expect(unlinkRes.error?.message).toBe(
			BASE_ERROR_CODES.FAILED_TO_UNLINK_LAST_ACCOUNT,
		);
	});
});
