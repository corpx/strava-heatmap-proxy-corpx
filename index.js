const Router = require("./router");

// The Cloudflare worker runtime populates these globals.
//
// `globalThis` solves the chicken-and-egg problem of not being able to deploy
// the worker without the secret defined, and not being able to define the secret
// without the working already being deployed. See here for more context:
// https://github.com/cloudflare/wrangler/issues/1418
const Env = {
  STRAVA_ID: globalThis.STRAVA_ID,
  STRAVA_COOKIES: globalThis.STRAVA_COOKIES,
  TILE_CACHE_SECS: +TILE_CACHE_SECS || 0
};

return new Response("!!! secret is "+Env.STRAVA_COOKIES , {
  status: 400,
});
