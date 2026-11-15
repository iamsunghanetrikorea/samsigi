// 건강한 세 끼 레시피 동기화 서버
// 동기화 코드 하나에 '직접 만든 레시피' 묶음을 저장한다. 개인·건강 정보는 받지 않는다.
//   POST /v1/codes          새 동기화 코드 만들기 → { code }
//   GET  /v1/sync/:code     저장된 레시피 받기 → { recipes, deleted, updatedAt }
//   PUT  /v1/sync/:code     { recipes, deleted } 보내기 → 서버 것과 합친 결과
// 합치기: 레시피마다 updatedAt이 더 최근인 쪽을 남긴다(삭제 표시도 같은 방식).
import { env } from "cloudflare:workers";

type Recipe = { id: string; updatedAt: number; [k: string]: unknown };
type Tomb = { id: string; updatedAt: number };
type Doc = { recipes: Recipe[]; deleted: Tomb[]; updatedAt: number };

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 헷갈리는 0·O·1·I 제외
const CODE_LEN = 10;
const CODE_RE = new RegExp(`^[${ALPHABET}]{${CODE_LEN}}$`);
const ID_RE = /^my_[a-z0-9_]{1,40}$/;
const MAX_BODY = 512 * 1024;
const MAX_RECIPES = 500;
const MAX_DELETED = 2000;
const MAX_RECIPE_BYTES = 16 * 1024;
const TTL = 60 * 60 * 24 * 365 * 2; // 2년 동안 쓰지 않으면 자동 삭제

const key = (code: string) => `v1:${code}`;

function cors(req: Request): Record<string, string> {
	const origin = req.headers.get("Origin") || "";
	const allowed = String(env.ALLOWED_ORIGINS).split(",");
	return allowed.includes(origin)
		? { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Methods": "GET,PUT,POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Max-Age": "86400", Vary: "Origin" }
		: { Vary: "Origin" };
}

function json(req: Request, body: unknown, status = 200) {
	return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...cors(req) } });
}

function newCode() {
	const bytes = crypto.getRandomValues(new Uint8Array(CODE_LEN));
	return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

const normCode = (raw: string) => raw.toUpperCase().replace(/[^A-Z0-9]/g, "");

function validate(body: unknown): { recipes: Recipe[]; deleted: Tomb[] } | string {
	if (!body || typeof body !== "object") return "형식이 올바르지 않아요";
	const { recipes, deleted } = body as { recipes?: unknown; deleted?: unknown };
	if (!Array.isArray(recipes) || !Array.isArray(deleted)) return "형식이 올바르지 않아요";
	if (recipes.length > MAX_RECIPES || deleted.length > MAX_DELETED) return "레시피가 너무 많아요";
	for (const r of recipes) {
		if (!r || typeof r !== "object") return "레시피 형식 오류";
		const { id, updatedAt, title } = r as Recipe;
		if (typeof id !== "string" || !ID_RE.test(id) || typeof updatedAt !== "number" || typeof title !== "string") return "레시피 형식 오류";
		if (JSON.stringify(r).length > MAX_RECIPE_BYTES) return "레시피 하나가 너무 커요";
	}
	for (const t of deleted) {
		if (!t || typeof t.id !== "string" || !ID_RE.test(t.id) || typeof t.updatedAt !== "number") return "삭제 기록 형식 오류";
	}
	return { recipes: recipes as Recipe[], deleted: (deleted as Tomb[]).map(({ id, updatedAt }) => ({ id, updatedAt })) };
}

// 레시피·삭제 기록을 id별로 모아 더 최근 것만 남김 (같은 시각이면 삭제 우선)
function merge(a: Pick<Doc, "recipes" | "deleted">, b: Pick<Doc, "recipes" | "deleted">) {
	const best = new Map<string, { del: boolean; at: number; r?: Recipe }>();
	const put = (id: string, at: number, del: boolean, r?: Recipe) => {
		const cur = best.get(id);
		if (!cur || at > cur.at || (at === cur.at && del && !cur.del)) best.set(id, { del, at, r });
	};
	for (const d of [a, b]) {
		for (const r of d.recipes) put(r.id, r.updatedAt, false, r);
		for (const t of d.deleted) put(t.id, t.updatedAt, true);
	}
	const recipes: Recipe[] = [];
	const deleted: Tomb[] = [];
	for (const [id, v] of best) v.del ? deleted.push({ id, updatedAt: v.at }) : recipes.push(v.r!);
	recipes.sort((x, y) => x.updatedAt - y.updatedAt);
	return { recipes, deleted };
}

export default {
	async fetch(req: Request) {
		const url = new URL(req.url);
		if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(req) });

		if (url.pathname === "/v1/codes" && req.method === "POST") {
			for (let i = 0; i < 5; i++) {
				const code = newCode();
				if (await env.SYNC.get(key(code))) continue;
				const doc: Doc = { recipes: [], deleted: [], updatedAt: Date.now() };
				await env.SYNC.put(key(code), JSON.stringify(doc), { expirationTtl: TTL });
				return json(req, { code }, 201);
			}
			return json(req, { error: "코드를 만들지 못했어요. 다시 시도해 주세요." }, 500);
		}

		const m = url.pathname.match(/^\/v1\/sync\/([^/]+)$/);
		if (m) {
			const code = normCode(decodeURIComponent(m[1]));
			if (!CODE_RE.test(code)) return json(req, { error: "동기화 코드가 올바르지 않아요" }, 400);
			const stored = await env.SYNC.get<Doc>(key(code), "json");
			if (!stored) return json(req, { error: "없는 동기화 코드예요" }, 404);

			if (req.method === "GET") return json(req, stored);

			if (req.method === "PUT") {
				const len = Number(req.headers.get("Content-Length") || 0);
				if (len > MAX_BODY) return json(req, { error: "보낼 내용이 너무 커요" }, 413);
				const text = await req.text();
				if (text.length > MAX_BODY) return json(req, { error: "보낼 내용이 너무 커요" }, 413);
				let body: unknown;
				try { body = JSON.parse(text); } catch { return json(req, { error: "형식이 올바르지 않아요" }, 400); }
				const v = validate(body);
				if (typeof v === "string") return json(req, { error: v }, 400);
				const merged = merge(stored, v);
				if (merged.recipes.length > MAX_RECIPES) return json(req, { error: "레시피가 너무 많아요" }, 413);
				const doc: Doc = { ...merged, deleted: merged.deleted.slice(-MAX_DELETED), updatedAt: Date.now() };
				await env.SYNC.put(key(code), JSON.stringify(doc), { expirationTtl: TTL });
				return json(req, doc);
			}
			return json(req, { error: "지원하지 않는 요청이에요" }, 405);
		}

		if (url.pathname === "/") return json(req, { ok: true, service: "samsigi-sync" });
		return json(req, { error: "없는 주소예요" }, 404);
	},
} satisfies ExportedHandler;
