// Tipe untuk binding Cloudflare dan locals
declare global {
	namespace App {
		interface Locals {
			admin: string | null;
		}
		interface Platform {
			env: {
				DB: D1Database;
				GALLERY: R2Bucket;
				ADMIN_EMAILS: string;
				ADMIN_PASSWORD: string;
				SESSION_SECRET: string;
			};
			context: ExecutionContext;
			caches: CacheStorage & { default: Cache };
		}
	}
}

export {};
