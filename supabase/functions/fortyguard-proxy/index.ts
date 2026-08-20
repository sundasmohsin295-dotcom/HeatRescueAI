import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const FORTYGUARD_API_KEY = Deno.env.get("FORTYGUARD_API_KEY");
const FORTYGUARD_API_URL = "https://api.fortyguard.com/v1/heatmap";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (!FORTYGUARD_API_KEY) {
      return new Response(
        JSON.stringify({ error: "FORTYGUARD_API_KEY is not configured on the server." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = await req.json();
    const { action, request, activityId } = body;

    if (action === "submit") {
      const res = await fetch(FORTYGUARD_API_URL, {
        method: "POST",
        headers: {
          "api-key": FORTYGUARD_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      const data = await res.json();

      if (!res.ok) {
        return new Response(
          JSON.stringify({ error: data.message || data.error || `FortyGuard returned HTTP ${res.status}` }),
          { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      return new Response(
        JSON.stringify({ activity_id: data.data?.activity_id || data.activity_id }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (action === "status") {
      const statusUrl = `${FORTYGUARD_API_URL}/${activityId}`;
      const res = await fetch(statusUrl, {
        method: "GET",
        headers: {
          "api-key": FORTYGUARD_API_KEY,
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();

      if (!res.ok) {
        return new Response(
          JSON.stringify({ status: "FAILED", error: data.message || data.error || `HTTP ${res.status}` }),
          { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const status = data.data?.status || data.status || "PROCESSING";

      if (status === "COMPLETED") {
        return new Response(
          JSON.stringify({
            status: "COMPLETED",
            mapData: data.data?.map_data || data.map_data,
            statsData: data.data?.stats_data || data.stats_data,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      return new Response(
        JSON.stringify({ status: status === "FAILED" ? "FAILED" : "PROCESSING" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ error: "Unknown action. Use 'submit' or 'status'." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error.";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
