const REPO = "pot20pat-oss/AIP-SITE";
const BRANCH = "main";
const FILES = ["hero", "footer", "tarifs", "avis", "services"];

async function ghGet(env, path) {
  const r = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}?ref=${BRANCH}`, {
    headers: { Authorization: `token ${env.GITHUB_TOKEN}`, Accept: "application/vnd.github.v3+json" }
  });
  return r.json();
}

async function ghPut(env, path, content, sha) {
  const r = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, {
    method: "PUT",
    headers: { Authorization: `token ${env.GITHUB_TOKEN}`, "Content-Type": "application/json", Accept: "application/vnd.github.v3+json" },
    body: JSON.stringify({ message: "CMS update " + path, content, sha, branch: BRANCH })
  });
  return r;
}

function htmlLogin() {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><title>CMS AIP</title>
  <style>body{font-family:Segoe UI,sans-serif;background:#0f172a;color:#e2e8f0;display:flex;height:100vh;align-items:center;justify-content:center}
  form{background:#1e293b;padding:30px;border-radius:12px}input{padding:10px;margin:8px 0;width:200px;border-radius:6px;border:1px solid #334155}
  button{background:#6366f1;color:#fff;border:0;padding:10px 20px;border-radius:6px;cursor:pointer}</style></head>
  <body><form method="post" action="/cms/login"><h2>CMS AIP</h2>
  <input type="password" name="password" placeholder="Mot de passe" required><br>
  <button>Entrer</button></form></body></html>`;
}

async function htmlEdit(env) {
  let forms = "";
  for (const f of FILES) {
    const data = await ghGet(env, `content/${f}.json`);
    let text = "";
    if (data.content) text = decodeURIComponent(escape(atob(data.content.replace(/\n/g, ""))));
    forms += `<div style="background:#1e293b;padding:16px;border-radius:10px;margin:12px 0">
      <h3>${f}.json</h3>
      <form method="post" action="/cms/save">
        <input type="hidden" name="file" value="${f}">
        <textarea name="content" rows="10" style="width:100%;font-family:monospace">${text.replace(/</g,"&lt;")}</textarea><br>
        <button style="background:#6366f1;color:#fff;border:0;padding:8px 16px;border-radius:6px;cursor:pointer">Sauver ${f}</button>
      </form></div>`;
  }
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><title>CMS AIP — Édition</title>
  <style>body{font-family:Segoe UI,sans-serif;background:#0f172a;color:#e2e8f0;padding:20px}
  textarea{background:#0f172a;color:#e2e8f0;border:1px solid #334155}</style></head>
  <body><h1>CMS AIP — Contenu</h1>${forms}<p><a href="/cms/logout" style="color:#94a3b8">Quitter</a></p></body></html>`;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const p = url.pathname;

    if (p === "/cms" || p === "/cms/") return new Response(htmlLogin(), { headers: { "Content-Type": "text/html" } });

    if (p === "/cms/login" && request.method === "POST") {
      const form = await request.formData();
      if (form.get("password") === env.CMS_PASSWORD) {
        return new Response(null, { status: 302, headers: { "Location": "/cms/edit", "Set-Cookie": `cms_auth=${env.CMS_PASSWORD}; Path=/cms; HttpOnly` } });
      }
      return new Response("Incorrect", { status: 401 });
    }

    if (p === "/cms/logout") {
      return new Response(null, { status: 302, headers: { "Location": "/cms", "Set-Cookie": "cms_auth=; Path=/cms; Max-Age=0" } });
    }

    const cookie = request.headers.get("Cookie") || "";
    if (!cookie.includes(`cms_auth=${env.CMS_PASSWORD}`)) return new Response(null, { status: 302, headers: { "Location": "/cms" } });

    if (p === "/cms/edit") return new Response(await htmlEdit(env), { headers: { "Content-Type": "text/html" } });

    if (p === "/cms/save" && request.method === "POST") {
      const form = await request.formData();
      const file = form.get("file");
      const content = form.get("content");
      const cur = await ghGet(env, `content/${file}.json`);
      const encoded = btoa(unescape(encodeURIComponent(content)));
      await ghPut(env, `content/${file}.json`, encoded, cur.sha);
      return new Response(null, { status: 302, headers: { "Location": "/cms/edit?saved=" + file } });
    }

    return new Response("404", { status: 404 });
  }
};
