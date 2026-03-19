import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.2";
import { corsHeaders } from "../_shared/cors.ts";

/** Plan-based user limits */
const PLAN_USER_LIMITS: Record<string, number> = {
  basic: 2,
  professional: 3,
  premium: Infinity,
};

/** Roles allowed per plan */
const PLAN_ALLOWED_ROLES: Record<string, string[]> = {
  basic: ["Owner", "Staff"],
  professional: ["Owner", "Manager", "Staff"],
  premium: ["Owner", "Manager", "QA", "Staff", "Auditor"],
};

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
    const isOwner = roles.includes("Owner") || roles.includes("super_admin");
    const isManager = roles.includes("Manager");
    if (!isOwner && !isManager) {
      throw new Error("Insufficient permissions");
    }

    const body = await req.json();
    const { action, email, full_name, role, branch_id, organization_id } = body;

    if (action === "invite") {
      // ── Enforce plan-based limits ──────────────────────
      // Get organization's plan
      const { data: org } = await supabaseAdmin
        .from("organizations")
        .select("subscription_plan")
        .eq("id", organization_id)
        .single();
      const plan = org?.subscription_plan || "basic";
      const maxUsers = PLAN_USER_LIMITS[plan] ?? 2;
      const allowedRoles = PLAN_ALLOWED_ROLES[plan] ?? ["Owner", "Staff"];

      // Check role is allowed for this plan
      if (!allowedRoles.includes(role)) {
        throw new Error(`Role "${role}" is not available on your current plan.`);
      }

      // Manager can only add Staff
      if (isManager && !isOwner && role !== "Staff") {
        throw new Error("Managers can only add Staff users.");
      }

      // Check current user count
      const { count } = await supabaseAdmin
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organization_id);
      if ((count || 0) >= maxUsers) {
        throw new Error(`User limit reached (${maxUsers}). Upgrade your plan to add more users.`);
      }

      // ── Create user ───────────────────────────────────
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

    if (action === "remove") {
      // Only Owner can remove users
      if (!isOwner) {
        throw new Error("Only Owners can remove users.");
      }

      const { user_id: targetUserId } = body;
      if (!targetUserId) throw new Error("user_id is required");

      // Prevent removing yourself
      if (targetUserId === caller.id) {
        throw new Error("You cannot remove yourself.");
      }

      // Delete from auth (cascades to profiles and user_roles via FK)
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);
      if (deleteError) throw deleteError;

      return new Response(
        JSON.stringify({ success: true }),
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
