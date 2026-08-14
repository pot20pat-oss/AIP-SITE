const CLIENT_ID = "OV231i0okhxBEag2bsYS";
const CLIENT_SECRET = "df68d1c48d472290a64fef0702efc7c6dbbb9c32";
const ADMIN_URL = "https://atelierpotvin.ca/admin/";

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;

    const p = url.pathname.replace(/\/$/, "");
    // Demarre l'OAuth GitHub
    if (p === "/auth") {
      const gh = new URL("https://github.com/login/oauth/authorize");
      gh.searchParams.set("client_id", CLIENT_ID);
      gh.searchParams.set("redirect_uri", url.origin + "/callback");
      gh.searchParams.set("scope", "repo");
      gh.searchParams.set("state", ADMIN_URL);
      return Response.redirect(gh.toString(), 302);
    }

    // GitHub redirige ici avec le code
    if (p === "/callback") {
      const code = url.searchParams.get("code");
      if (!code) return new Response("Code manquant", { status: 400 });

      const resp = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, code }),
      });
      const data = await resp.json();
      if (!data.access_token) {
        return new Response("Echec echange token: " + JSON.stringify(data), { status: 400 });
      }
      // Renvoie le token a Decap via le hash (comme Netlify)
      return Response.redirect(ADMIN_URL + "#access_token=" + data.access_token, 302);
    }

    return new Response("AIP CMS Auth Worker — va sur /admin et clique Login with GitHub", { status: 200 });
  },
};
