/**
 * CF Pages Function -- CPSC recall proxy
 *
 * Proxies the public CPSC SaferProducts API to avoid browser CORS issues.
 * No auth required. Zero external dependencies.
 *
 * GET /api/recall-check?brand=Samsung&model=RF28R7351SR
 * Returns: raw CPSC recall array (client-side filtering in recallChecker.ts)
 */

const CPSC_BASE = "https://www.saferproducts.gov/RestWebServices/Recall"

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
}
const JSON_HEADERS = { "Content-Type": "application/json", ...CORS }

export const onRequest = async (context: any) => {
  if (context.request.method === "OPTIONS") {
    return new Response(null, { headers: CORS })
  }

  const url = new URL(context.request.url)
  const brand = (url.searchParams.get("brand") || "").trim()
  const model = (url.searchParams.get("model") || "").trim()

  if (!brand && !model) {
    return new Response("[]", { headers: JSON_HEADERS })
  }

  try {
    const params = new URLSearchParams({ format: "json" })
    if (brand) params.set("Manufacturer", brand)
    if (model) params.set("ProductName", model)

    const cpscRes = await fetch(`${CPSC_BASE}?${params}`, {
      headers: { Accept: "application/json" },
    })

    if (!cpscRes.ok) {
      return new Response("[]", { headers: JSON_HEADERS })
    }

    const data = await cpscRes.json()
    return new Response(
      JSON.stringify(Array.isArray(data) ? data : []),
      { headers: JSON_HEADERS }
    )
  } catch {
    return new Response("[]", { headers: JSON_HEADERS })
  }
}