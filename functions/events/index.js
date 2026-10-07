import { handleEvents } from "../../event-server/handler.mjs";
export const onRequest = (context) =>
  handleEvents(context.request, { cache: caches.default });
