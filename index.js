const Router = require("./router");

// The Cloudflare worker runtime populates these globals.
//
// `globalThis` solves the chicken-and-egg problem of not being able to deploy
// the worker without the secret defined, and not being able to define the secret
// without the working already being deployed. See here for more context:
// https://github.com/cloudflare/wrangler/issues/1418


export default {
  async fetch(request, env,ctx) {
    return handleRequest(request,env,ctx);
  }
}

async function handleRequest(request,env,event) {
  try {
    let response = await caches.default.match(request.url);

    if (!response) {
      const r = new Router();
      r.get("/(personal|global)/.*", (request) => handleTileProxyRequest(request,env));
      r.post("/setcookies", (request) => handleSetCookies(request));
      r.get("/", (request) => handleIndexRequest(env));

      response = await r.route(request);

      if (env.TILE_CACHE_SECS > 0 && response.status === 200) {
        response = new Response(response.body, response);
        response.headers.append("Access-Control-Allow-Origin", "*");
        response.headers.append("Cache-Control", `s-maxage=${env.TILE_CACHE_SECS}`);        
        event.waitUntil(caches.default.put(request.url, response.clone()));
      }
    }

    return response;
  } catch (err) {
    return new Response(`err in request handler: ${err}`, { status: 500 });
  }
}

function handleIndexRequest(env) {

  return new Response(`\
Global Heatmap
  for 512px tiles (default) : /global/:color/:activity/{z}/{x}/{y}.png
  for 256px tiles : /global/:color/:activity/{z}/{x}/{y}&px=256.png
  for 1024px tiles : /global/:color/:activity/{z}/{x}/{y}@2x.png
  
  color choices: mobileblue, orange, hot, blue, bluered, purple, gray
  activity choices : all, ride, winter, run, water
  
Personal Heatmap
  for 512px tiles (default) : /personal/:color/:activity/{z}/{x}/{y}.png
  for 256px tiles : /personal/:color/:activity/{z}/{x}/{y}&px=256.png
  for 1024px tiles : /personal/:color/:activity/{z}/{x}/{y}@2x.png

  color choices: orange, hot, blue, bluered, purple, gray
  activity choices : all, ride, winter, run, water
` + env.STRAVA_COOKIES + "done");
}

const PERSONAL_MAP_URL =
  "https://personal-heatmaps-external.strava.com/" +
  "tiles/{strava_id}/{color}/{z}/{x}/{y}{res}.png" +
  "?filter_type={activity}&include_everyone=true" +
  "&include_followers_only=true&respect_privacy_zones=true{res256}";

//https://content-a.strava.com/identified/globalheat/sport_TrailRun/mobileblue/10/520/352.png?v=19
const GLOBAL_MAP_URL =
  "https://content-a.strava.com/identified/globalheat/" +
      "{activity}/{color}/{z}/{x}/{y}{res}.png?v=19{res256}";
  // "tiles-auth/{activity}/{color}/{z}/{x}/{y}{res}.png?v=19";

async function handleTileProxyRequest(request,env) {
  const url = new URL(request.url);
  
  const match = url.pathname.match(
    new RegExp("(personal|global)/(\\w+)/(\\w+)/(\\d+)/(\\d+)/(\\d+)(@2x)?(&px=256)?.png")
  );
  if (match === null) {
    return new Response("!!! invalid URL "+url.pathname + " expected: /kind/color/activity/z/x/y.png", {
      status: 400,
    });
  }

  const [_, kind, color, activity, z, x, y, res, res256] = match;
  const data = {
    strava_id: 1,
    color,
    activity,
    x,
    y,
    z,
    res: res || "",
    res256: res256 || "",
  };

  const baseUrl = kind === "personal" ? PERSONAL_MAP_URL : GLOBAL_MAP_URL;
  // replace templated data in base URL
  const proxyUrl = baseUrl.replace(/\{(\w+)\}/g, (_, key) => data[key]);

  const proxiedRequest = new Request("https://content-a.strava.com/anon/globalheat/all/blue/10/167/396.png?v=19", {
    method: "GET",
    headers: new Headers({ Cookie: env.STRAVA_COOKIES }),
  });

  return await fetch(proxiedRequest);
}

async function handleSetCookies(request) {
    const authHeader = request.headers.get('Authorization');
//    if (!authHeader || authHeader !== `Bearer ${AUTH_TOKEN}`) {
  //    return new Response('Accès non autorisé', { status: 403 });
   // }

    const { cookies } = await request.json();
    await STRAVA_COOKIES.put('cookies', cookies);


    return new Response('Cookies sauvegardés avec succès', { status: 200 });
}

async function handleSetCookies1(request) {
      return new Response('Bonjour', { status: 200 });
}
