import { bindings, defineConfig } from "cf/config";
import * as entrypoint from "./src/index.ts" with { type: "cf-worker" };

// 건강한 세 끼: 직접 만든 레시피를 동기화 코드로 여러 기기에서 맞추는 서버
export default defineConfig({
	worker: {
		name: "samsigi-sync",
		compatibilityDate: "2026-10-23",
		entrypoint,
		env: {
			SYNC: bindings.kv({ id: "27f9a413438c4f7ca74d0c5c193cb7bd" }),
			ALLOWED_ORIGINS: bindings.text("https://iamsunghanetrikorea.github.io,http://localhost:5173,http://localhost:5179,http://127.0.0.1:5173"),
		},
	},
});
