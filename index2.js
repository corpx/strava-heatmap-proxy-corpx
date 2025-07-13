 async fetch(request, env, ctx) {
    return new Response(`API host: ${env.STRAVA_COOKIES}`);
  },
