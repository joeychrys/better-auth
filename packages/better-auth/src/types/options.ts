import type { Dialect, Kysely, MysqlPool, PostgresPool } from "kysely";
import type { Account, Session, User, Verification } from "../types";
import type {
	BetterAuthPlugin,
	HookAfterHandler,
	HookBeforeHandler,
} from "./plugins";
import type { SocialProviderList, SocialProviders } from "../social-providers";
import type { AdapterInstance, SecondaryStorage } from "./adapter";
import type { KyselyDatabaseType } from "../adapters/kysely-adapter/types";
import type { FieldAttribute } from "../db";
import type { Models, RateLimit } from "./models";
import type { AuthContext, LiteralUnion, OmitId } from ".";
import type { CookieOptions } from "better-call";
import type { Database } from "better-sqlite3";
import type { Logger } from "../utils";

export type BetterAuthOptions = {
	/**
	 * The name of the application
	 *
	 * process.env.APP_NAME
	 *
	 * @default "Better Auth"
	 */
	appName?: string;
	/**
	 * Base URL for the better auth. This is typically the
	 * root URL where your application server is hosted.
	 * If not explicitly set,
	 * the system will check the following environment variable:
	 *
	 * process.env.BETTER_AUTH_URL
	 *
	 * If not set it will throw an error.
	 */
	baseURL?: string;
	/**
	 * Base path for the better auth. This is typically
	 * the path where the
	 * better auth routes are mounted.
	 *
	 * @default "/api/auth"
	 */
	basePath?: string;
	/**
	 * The secret to use for encryption,
	 * signing and hashing.
	 *
	 * By default better auth will look for
	 * the following environment variables:
	 * process.env.BETTER_AUTH_SECRET,
	 * process.env.AUTH_SECRET
	 * If none of these environment
	 * variables are set,
	 * it will default to
	 * "better-auth-secret-123456789".
	 *
	 * on production if it's not set
	 * it will throw an error.
	 *
	 * you can generate a good secret
	 * using the following command:
	 * @example
	 * ```bash
	 * openssl rand -base64 32
	 * ```
	 */
	secret?: string;
	/**
	 * Database configuration
	 */
	database?:
		| PostgresPool
		| MysqlPool
		| Database
		| Dialect
		| AdapterInstance
		| {
				dialect: Dialect;
				type: KyselyDatabaseType;
				/**
				 * casing for table names
				 *
				 * @default "camel"
				 */
				casing?: "snake" | "camel";
		  }
		| {
				/**
				 * Kysely instance
				 */
				db: Kysely<any>;
				/**
				 * Database type between postgres, mysql and sqlite
				 */
				type: KyselyDatabaseType;
				/**
				 * casing for table names
				 *
				 * @default "camel"
				 */
				casing?: "snake" | "camel";
		  };
	/**
	 * Secondary storage configuration
	 *
	 * This is used to store session and rate limit data.
	 */
	secondaryStorage?: SecondaryStorage;
	/**
	 * Email verification configuration
	 */
	emailVerification?: {
		/**
		 * Send a verification email
		 * @param data the data object
		 * @param request the request object
		 */
		sendVerificationEmail?: (
			/**
			 * @param user the user to send the
			 * verification email to
			 * @param url the url to send the verification email to
			 * it contains the token as well
			 * @param token the token to send the verification email to
			 */
			data: {
				user: User;
				url: string;
				token: string;
			},
			/**
			 * The request object
			 */
			request?: Request,
		) => Promise<void>;
		/**
		 * Send a verification email automatically
		 * after sign up
		 *
		 * @default false
		 */
		sendOnSignUp?: boolean;
		/**
		 * Auto signin the user after they verify their email
		 */
		autoSignInAfterVerification?: boolean;

		/**
		 * Number of seconds the verification token is
		 * valid for.
		 * @default 3600 seconds (1 hour)
		 */
		expiresIn?: number;
	};
	/**
	 * Email and password authentication
	 */
	emailAndPassword?: {
		/**
		 * Enable email and password authentication
		 *
		 * @default false
		 */
		enabled: boolean;
		/**
		 * Require email verification before creating a session.
		 *
		 * if enabled, the user must verify their email before they can signin.
		 * And on sign in attempts, `sendVerificationEmail` will be called, to
		 * send the user email verification token.
		 */
		requireEmailVerification?: boolean;
		/**
		 * The maximum length of the password.
		 *
		 * @default 32
		 */
		maxPasswordLength?: number;
		/**
		 * The minimum length of the password.
		 *
		 * @default 8
		 */
		minPasswordLength?: number;
		/**
		 * send reset password
		 */
		sendResetPassword?: (
			/**
			 * @param user the user to send the
			 * reset password email to
			 * @param url the url to send the reset password email to
			 * @param token the token to send to the user (could be used instead of sending the url
			 * if you need to redirect the user to custom route)
			 */
			data: { user: User; url: string; token: string },
			/**
			 * The request object
			 */
			request?: Request,
		) => Promise<void>;
		/**
		 * Number of seconds the reset password token is
		 * valid for.
		 *
		 * @default 1 hour (60 * 60)
		 */
		resetPasswordTokenExpiresIn?: number;
		/**
		 * Password hashing and verification
		 *
		 * By default Scrypt is used for password hashing and
		 * verification. You can provide your own hashing and
		 * verification function. if you want to use a
		 * different algorithm.
		 */
		password?: {
			hash?: (password: string) => Promise<string>;
			verify?: (data: { hash: string; password: string }) => Promise<boolean>;
		};
		/**
		 * Automatically sign in the user after sign up
		 */
		autoSignIn?: boolean;
	};
	/**
	 * list of social providers
	 */
	socialProviders?: SocialProviders;
	/**
	 * List of Better Auth plugins
	 */
	plugins?: BetterAuthPlugin[];
	/**
	 * User configuration
	 */
	user?: {
		/**
		 * The model name for the user. Defaults to "user".
		 */
		modelName?: string;
		/**
		 * Map core fields to different fields in your database.
		 * It does not affect the actual type, it just changes the mapping
		 * to your database.
		 *
		 * @example
		 *
		 * ```ts
		 * fields: {
		 * 	name: "display_name",
		 * 	email: "email_address"
		 * }
		 * ```
		 *
		 * NB: If you're using adapter, you may want to provide they `key`
		 * of the field in your orm rather than the actual field in your database.
		 */
		fields?: Partial<Record<keyof OmitId<User>, string>>;
		/**
		 * Additional fields for the session
		 *
		 * @example
		 * ```ts
		 * additionalFields: {
		 * 	plan: {
		 * 		type: "string",
		 * 		defaultValue: "free"
		 * 	},
		 * 	role: {
		 * 		type: ["super-admin", "user"],
		 * 		required: false,
		 * 		input: false
		 * 	}
		 * }
		 * ```
		 *
		 * @see https://www.better-auth.com/docs/concepts/database#extending-core-schema
		 */
		additionalFields?: {
			[key: string]: FieldAttribute;
		};
		/**
		 * Changing email configuration
		 *
		 * @see https://www.better-auth.com/docs/concepts/users-accounts#change-email
		 */
		changeEmail?: {
			/**
			 * Enable changing email
			 *
			 * @default false
			 */
			enabled: boolean;
			/**
			 * Send a verification email when the user changes their email.
			 * @param data the data object
			 * @param request the request object
			 */
			sendChangeEmailVerification?: (
				data: {
					user: User;
					newEmail: string;
					url: string;
					token: string;
				},
				request?: Request,
			) => Promise<void>;
		};
		/**
		 * User deletion configuration
		 */
		deleteUser?: {
			/**
			 * Enable user deletion
			 */
			enabled?: boolean;
			/**
			 * Send a verification email when the user deletes their account.
			 *
			 * if this is not set, the user will be deleted immediately.
			 * @param data the data object
			 * @param request the request object
			 */
			sendDeleteAccountVerification?: (
				data: {
					user: User;
					url: string;
					token: string;
				},
				request?: Request,
			) => Promise<void>;
			/**
			 * A function that is called before a user is deleted.
			 *
			 * to interrupt with error you can throw `APIError`
			 */
			beforeDelete?: (user: User, request?: Request) => Promise<void>;
			/**
			 * A function that is called after a user is deleted.
			 *
			 * This is useful for cleaning up user data
			 */
			afterDelete?: (user: User, request?: Request) => Promise<void>;
		};
	};
	session?: {
		/**
		 * The model name for the session.
		 *
		 * @default "session"
		 */
		modelName?: string;
		/**
		 * Map core fields to different fields in your database.
		 * It does not affect the actual type, it just changes the mapping
		 * to your database.
		 *
		 * @example
		 * ```ts
		 * {
		 *  userId: "user_id"
		 * }
		 */
		fields?: Partial<Record<keyof OmitId<Session>, string>>;
		/**
		 * Expiration time for the session token. The value
		 * should be in seconds.
		 * @default 7 days (60 * 60 * 24 * 7)
		 */
		expiresIn?: number;
		/**
		 * How often the session should be refreshed. The value
		 * should be in seconds.
		 * If set 0 the session will be refreshed every time it is used.
		 * @default 1 day (60 * 60 * 24)
		 */
		updateAge?: number;
		/**
		 * Additional fields for the session
		 */
		additionalFields?: {
			[key: string]: FieldAttribute;
		};
		/**
		 * By default if secondary storage is provided
		 * the session is stored in the secondary storage.
		 *
		 * Set this to true to store the session in the database
		 * as well.
		 *
		 * Reads are always done from the secondary storage.
		 *
		 * @default false
		 */
		storeSessionInDatabase?: boolean;
		/**
		 * By default, sessions are deleted from the database when secondary storage
		 * is provided when session is revoked.
		 *
		 * Set this to true to preserve session records in the database,
		 * even if they are deleted from the secondary storage.
		 *
		 * @default false
		 */
		preserveSessionInDatabase?: boolean;
		/**
		 * Enable caching session in cookie
		 */
		cookieCache?: {
			/**
			 * max age of the cookie
			 * @default 5 minutes (5 * 60)
			 */
			maxAge?: number;
			/**
			 * Enable caching session in cookie
			 * @default false
			 */
			enabled?: boolean;
		};
		/**
		 * The age of the session to consider it fresh.
		 *
		 * This is used to check if the session is fresh
		 * for sensitive operations. (e.g. deleting an account)
		 *
		 * If the session is not fresh, the user should be prompted
		 * to sign in again.
		 *
		 * If set to 0, the session will be considered fresh every time. (⚠︎ not recommended)
		 *
		 * @default 5 minutes (5 * 60)
		 */
		freshAge?: number;
	};
	/**
	 * Account configuration
	 */
	account?: {
		/**
		 * Model name for account table
		 *
		 * @default "account"
		 */
		modelName?: string;
		/**
		 * Map core fields to different fields in your database.
		 * It does not affect the actual type, it just changes the mapping
		 * to your database.
		 *
		 * @example
		 * ```ts
		 * {
		 *  userId: "user_id"
		 * }
		 */
		fields?: Partial<Record<keyof OmitId<Account>, string>>;
		/**
		 * Account Linking Configuration
		 *
		 * @see https://www.better-auth.com/docs/concepts/users-accounts#account-linking
		 */
		accountLinking?: {
			/**
			 * Enable account linking
			 *
			 * @default true
			 */
			enabled?: boolean;
			/**
			 * List of trusted providers
			 *
			 * When a user logs in using a trusted provider, their account will be automatically
			 * linked even if the provider doesn’t confirm the email verification status.
			 *
			 * @example
			 * ```ts
			 * trustedProviders: ["github", "google"]
			 * ```
			 */
			trustedProviders?: Array<
				LiteralUnion<SocialProviderList[number] | "email-password", string>
			>;
			/**
			 * If enabled (true), this will allow users to manually linking accounts with different email addresses than the main user.
			 *
			 * @default false
			 *
			 * ⚠️ Warning: enabling this might lead to account takeovers, so proceed with caution.
			 */
			allowDifferentEmails?: boolean;
		};
	};
	/**
	 * Verification configuration
	 */
	verification?: {
		/**
		 * Model name for verification table
		 *
		 * @default "verification"
		 */
		modelName?: string;
		/**
		 * Map core fields to different fields in your database.
		 * It does not affect the actual type, it just changes the mapping
		 * to your database.
		 *
		 * @example
		 * ```ts
		 * {
		 *  expiresAt: "expires"
		 * }
		 */
		fields?: Partial<Record<keyof OmitId<Verification>, string>>;
	};
	/**
	 * List of trusted origins.
	 *
	 * Trusted origins prevent CSRF attacks and block open redirects. The server url is trusted
	 * by default but any other request from a different origin, if it contains cookie or if it's
	 * provided as a callback url the request will be blocked.
	 *
	 * @example
	 * ```ts
	 * trustedOrigins: ["http://localhost:3000", process.env.FRONTEND_URL]
	 * ```
	 */
	trustedOrigins?: string[];
	/**
	 * Rate limiting configuration
	 *
	 * @see https://www.better-auth.com/docs/concepts/rate-limit
	 */
	rateLimit?: {
		/**
		 * By default, rate limiting is only
		 * enabled on production.
		 */
		enabled?: boolean;
		/**
		 * Default window to use for rate limiting. The value
		 * should be in seconds.
		 *
		 * @default 10 seconds
		 */
		window?: number;
		/**
		 * The default maximum number of requests allowed within the window.
		 *
		 * @default 100 requests
		 */
		max?: number;
		/**
		 * Custom rate limit rules to apply to
		 * specific paths.
		 */
		customRules?: {
			[key: string]:
				| {
						/**
						 * The window to use for the custom rule.
						 */
						window: number;
						/**
						 * The maximum number of requests allowed within the window.
						 */
						max: number;
				  }
				| ((request: Request) =>
						| { window: number; max: number }
						| Promise<{
								window: number;
								max: number;
						  }>);
		};
		/**
		 * Storage configuration
		 *
		 * By default, rate limiting is stored in memory. If you passed a
		 * secondary storage, rate limiting will be stored in the secondary
		 * storage.
		 *
		 * @default "memory"
		 */
		storage?: "memory" | "database" | "secondary-storage";
		/**
		 * If database is used as storage, the name of the table to
		 * use for rate limiting.
		 *
		 * @default "rateLimit"
		 */
		modelName?: string;
		/**
		 * Custom field names for the rate limit table
		 */
		fields?: Record<keyof RateLimit, string>;
		/**
		 * custom storage configuration.
		 *
		 * NOTE: If custom storage is used storage
		 * is ignored
		 */
		customStorage?: {
			get: (key: string) => Promise<RateLimit | undefined>;
			set: (key: string, value: RateLimit) => Promise<void>;
		};
	};
	/**
	 * Advanced options
	 */
	advanced?: {
		/**
		 * Ip address configuration
		 */
		ipAddress?: {
			/**
			 * List of headers to use for ip address
			 *
			 * Ip address is used for rate limiting and session tracking
			 *
			 * @example ["x-client-ip", "x-forwarded-for"]
			 *
			 * @default
			 * @link https://github.com/better-auth/better-auth/blob/main/packages/better-auth/src/utils/get-request-ip.ts#L8
			 */
			ipAddressHeaders?: string[];
			/**
			 * Disable ip tracking
			 *
			 * ⚠︎ This is a security risk and it may expose your application to abuse
			 */
			disableIpTracking?: boolean;
		};
		/**
		 * Use secure cookies
		 *
		 * @default false
		 */
		useSecureCookies?: boolean;
		/**
		 * Disable trusted origins check
		 *
		 * ⚠︎ This is a security risk and it may expose your application to CSRF attacks
		 */
		disableCSRFCheck?: boolean;
		/**
		 * Configure cookies to be cross subdomains
		 */
		crossSubDomainCookies?: {
			/**
			 * Enable cross subdomain cookies
			 */
			enabled: boolean;
			/**
			 * Additional cookies to be shared across subdomains
			 */
			additionalCookies?: string[];
			/**
			 * The domain to use for the cookies
			 *
			 * By default, the domain will be the root
			 * domain from the base URL.
			 */
			domain?: string;
		};
		/*
		 * Allows you to change default cookie names and attributes
		 *
		 * default cookie names:
		 * - "session_token"
		 * - "session_data"
		 * - "dont_remember"
		 *
		 * plugins can also add additional cookies
		 */
		cookies?: {
			[key: string]: {
				name?: string;
				attributes?: CookieOptions;
			};
		};
		/**
		 * Default cookie that's applied to all cookies assigned by Better Auth
		 */
		defaultCookieAttributes?: CookieOptions;
		/**
		 * Prefix for cookies. If a cookie name is provided
		 * in cookies config, this will be overridden.
		 *
		 * @default
		 * ```txt
		 * "appName" -> which defaults to "better-auth"
		 * ```
		 */
		cookiePrefix?: string;
		/**
		 * Custom generateId function.
		 *
		 * If not provided, random ids will be generated.
		 * If set to false, the database's auto generated id will be used.
		 */
		generateId?:
			| ((options: {
					model: LiteralUnion<Models, string>;
					size?: number;
			  }) => string)
			| false;
	};
	/**
	 * Customize Logger
	 */
	logger?: Logger;
	/**
	 * allows you to define custom hooks that can be
	 * executed during lifecycle of core database
	 * operations.
	 */
	databaseHooks?: {
		/**
		 * User hooks
		 */
		user?: {
			create?: {
				/**
				 * Hook that is called before a user is created.
				 * if the hook returns false, the user will not be created.
				 * If the hook returns an object, it'll be used instead of the original data
				 */
				before?: (user: User) => Promise<
					| boolean
					| void
					| {
							data: User & Record<string, any>;
					  }
				>;
				/**
				 * Hook that is called after a user is created.
				 */
				after?: (user: User) => Promise<void>;
			};
			update?: {
				/**
				 * Hook that is called before a user is updated.
				 * if the hook returns false, the user will not be updated.
				 * If the hook returns an object, it'll be used instead of the original data
				 */
				before?: (user: Partial<User>) => Promise<
					| boolean
					| void
					| {
							data: User & Record<string, any>;
					  }
				>;
				/**
				 * Hook that is called after a user is updated.
				 */
				after?: (user: User) => Promise<void>;
			};
		};
		/**
		 * Session Hook
		 */
		session?: {
			create?: {
				/**
				 * Hook that is called before a session is updated.
				 * if the hook returns false, the session will not be updated.
				 * If the hook returns an object, it'll be used instead of the original data
				 */
				before?: (session: Session) => Promise<
					| boolean
					| void
					| {
							data: Session & Record<string, any>;
					  }
				>;
				/**
				 * Hook that is called after a session is updated.
				 */
				after?: (session: Session) => Promise<void>;
			};
			/**
			 * Update hook
			 */
			update?: {
				/**
				 * Hook that is called before a user is updated.
				 * if the hook returns false, the session will not be updated.
				 * If the hook returns an object, it'll be used instead of the original data
				 */
				before?: (session: Partial<Session>) => Promise<
					| boolean
					| void
					| {
							data: Session & Record<string, any>;
					  }
				>;
				/**
				 * Hook that is called after a session is updated.
				 */
				after?: (session: Session) => Promise<void>;
			};
		};
		/**
		 * Account Hook
		 */
		account?: {
			create?: {
				/**
				 * Hook that is called before a account is created.
				 * If the hook returns false, the account will not be created.
				 * If the hook returns an object, it'll be used instead of the original data
				 */
				before?: (account: Account) => Promise<
					| boolean
					| void
					| {
							data: Account & Record<string, any>;
					  }
				>;
				/**
				 * Hook that is called after a account is created.
				 */
				after?: (account: Account) => Promise<void>;
			};
			/**
			 * Update hook
			 */
			update?: {
				/**
				 * Hook that is called before a account is update.
				 * If the hook returns false, the user will not be updated.
				 * If the hook returns an object, it'll be used instead of the original data
				 */
				before?: (account: Partial<Account>) => Promise<
					| boolean
					| void
					| {
							data: Account & Record<string, any>;
					  }
				>;
				/**
				 * Hook that is called after a account is updated.
				 */
				after?: (account: Account) => Promise<void>;
			};
		};
		/**
		 * Verification Hook
		 */
		verification?: {
			create?: {
				/**
				 * Hook that is called before a verification is created.
				 * if the hook returns false, the verification will not be created.
				 * If the hook returns an object, it'll be used instead of the original data
				 */
				before?: (verification: Verification) => Promise<
					| boolean
					| void
					| {
							data: Verification & Record<string, any>;
					  }
				>;
				/**
				 * Hook that is called after a verification is created.
				 */
				after?: (verification: Verification) => Promise<void>;
			};
			update?: {
				/**
				 * Hook that is called before a verification is updated.
				 * if the hook returns false, the verification will not be updated.
				 * If the hook returns an object, it'll be used instead of the original data
				 */
				before?: (verification: Partial<Verification>) => Promise<
					| boolean
					| void
					| {
							data: Verification & Record<string, any>;
					  }
				>;
				/**
				 * Hook that is called after a verification is updated.
				 */
				after?: (verification: Verification) => Promise<void>;
			};
		};
	};
	/**
	 * API error handling
	 */
	onAPIError?: {
		/**
		 * Throw an error on API error
		 *
		 * @default false
		 */
		throw?: boolean;
		/**
		 * Custom error handler
		 *
		 * @param error
		 * @param ctx - Auth context
		 */
		onError?: (error: unknown, ctx: AuthContext) => void | Promise<void>;
	};
	/**
	 * Hooks
	 */
	hooks?: {
		/**
		 * Before a request is processed
		 */
		before?: HookBeforeHandler;
		/**
		 * After a request is processed
		 */
		after?: HookAfterHandler;
	};
	/**
	 * Disabled paths
	 *
	 * Paths you want to disable.
	 */
	disabledPaths?: string[];
};
