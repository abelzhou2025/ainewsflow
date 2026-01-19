import { onRequest as __api_extract_ts_onRequest } from "/Users/abelzhou/Desktop/ai-news-flow/functions/api/extract.ts"
import { onRequest as __api_library_ts_onRequest } from "/Users/abelzhou/Desktop/ai-news-flow/functions/api/library.ts"
import { onRequest as __api_push_ts_onRequest } from "/Users/abelzhou/Desktop/ai-news-flow/functions/api/push.ts"

export const routes = [
    {
      routePath: "/api/extract",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_extract_ts_onRequest],
    },
  {
      routePath: "/api/library",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_library_ts_onRequest],
    },
  {
      routePath: "/api/push",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_push_ts_onRequest],
    },
  ]