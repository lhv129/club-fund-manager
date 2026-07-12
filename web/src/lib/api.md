Server Component / Route Handler
        │
        ▼
  clubService.ts (extends BaseService)
        │
        ▼
  lib/baseService.ts (BaseService)
        │
        ▼
  lib/apiClient.ts  ──cookies()──▶  Backend API thật


Client Component ("use client")
        │
        ▼
  clubService.client.ts (extends BaseServiceClient)
        │
        ▼
  lib/baseService.client.ts (BaseServiceClient)
        │
        ▼
  lib/api.ts (apiClientBrowser) ──fetch──▶ /api/proxy/[...path] (Route Handler)
                                                    │
                                                    ▼
                                            lib/apiClient.ts ──▶ Backend API thật