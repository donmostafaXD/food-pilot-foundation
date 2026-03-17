import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.2";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Verify caller is authenticated
    const authHeader = req.headers.get("Authorization")!;
    const callerClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) throw new Error("Unauthorized");

    // Check caller has Owner or Manager role
    const { data: callerRoles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id);
    const roles = (callerRoles || []).map((r: any) => r.role);
    if (!roles.includes("Owner") && !roles.includes("Manager")) {
      throw new Error("Insufficient permissions");
    }

    const body = await req.json();
    const { action, email, full_name, role, branch_id, organization_id } = body;

    if (action === "invite") {
      // Create auth user with a temporary password
      const tempPassword = crypto.randomUUID().slice(0, 16) + "A1!";
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
      });
      if (createError) throw createError;

      const userId = newUser.user.id;

      // Update profile (auto-created by trigger)
      // Wait briefly for trigger
      await new Promise((r) => setTimeout(r, 500));

      await supabaseAdmin
        .from("profiles")
        .update({
          full_name,
          organization_id,
          branch_id,
        })
        .eq("user_id", userId);

      // Assign role
      await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: userId, role });

      return new Response(
        JSON.stringify({ success: true, user_id: userId, temp_password: tempPassword }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error("Unknown action");
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
