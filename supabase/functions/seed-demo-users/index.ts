import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEMO_USERS = [
  { email: "demo_basic@foodpilot.com", plan: "basic", orgName: "Basic Demo Co" },
  { email: "demo_haccp@foodpilot.com", plan: "professional", orgName: "HACCP Demo Co" },
  { email: "demo_compliance@foodpilot.com", plan: "premium", orgName: "Compliance Demo Co" },
  { email: "demo_full@foodpilot.com", plan: "demo", orgName: "Full Demo Co" },
];

const PASSWORD = "123456";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Verify caller is super_admin
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
      const { data: { user } } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
      if (user) {
        const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", user.id);
        if (!roles?.some((r: any) => r.role === "super_admin")) {
          return new Response(JSON.stringify({ error: "Not authorized" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    const results: any[] = [];

    for (const demo of DEMO_USERS) {
      // Check if user already exists
      const { data: existingUsers } = await admin.auth.admin.listUsers();
      const existing = existingUsers?.users?.find((u: any) => u.email === demo.email);

      let userId: string;

      if (existing) {
        userId = existing.id;
        results.push({ email: demo.email, status: "already_exists", userId });
      } else {
        // Create auth user
        const { data: newUser, error: createError } = await admin.auth.admin.createUser({
          email: demo.email,
          password: PASSWORD,
          email_confirm: true,
          user_metadata: { full_name: `Demo ${demo.plan}` },
        });

        if (createError) {
          results.push({ email: demo.email, status: "error", error: createError.message });
          continue;
        }
        userId = newUser.user.id;
        results.push({ email: demo.email, status: "created", userId });
      }

      // Ensure profile exists
      const { data: profile } = await admin.from("profiles").select("id, organization_id").eq("user_id", userId).maybeSingle();

      let orgId = profile?.organization_id;

      if (!orgId) {
        // Create organization
        const { data: org } = await admin.from("organizations").insert({
          name: demo.orgName,
          owner_id: userId,
          subscription_plan: demo.plan,
        }).select("id").single();

        orgId = org?.id;

        if (orgId) {
          // Get the auto-created branch
          const { data: branch } = await admin.from("branches").select("id").eq("organization_id", orgId).limit(1).single();

          // Update profile
          await admin.from("profiles").update({
            organization_id: orgId,
            branch_id: branch?.id,
            full_name: `Demo ${demo.plan.charAt(0).toUpperCase() + demo.plan.slice(1)}`,
            email: demo.email,
          }).eq("user_id", userId);
        }
      } else {
        // Update plan on existing org
        await admin.from("organizations").update({ subscription_plan: demo.plan }).eq("id", orgId);
      }

      // Ensure Owner role
      await admin.from("user_roles").upsert(
        { user_id: userId, role: "Owner" },
        { onConflict: "user_id,role" }
      );
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
