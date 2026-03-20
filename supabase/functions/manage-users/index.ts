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

    // ── 1. Authenticate caller ──────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const callerClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) throw new Error("Unauthorized");

    // ── 2. Verify caller roles ──────────────────────────
    const { data: callerRoles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id);
    const roles = (callerRoles || []).map((r: any) => r.role);
    const isSuperAdmin = roles.includes("super_admin");
    const isOwner = roles.includes("Owner") || isSuperAdmin;
    const isManager = roles.includes("Manager");
    if (!isOwner && !isManager) {
      throw new Error("Insufficient permissions: requires Owner or Manager role.");
    }

    const body = await req.json();
    const { action, email, full_name, role, branch_id, organization_id } = body;

    // ── 3. Org verification (super_admin bypasses) ──────
    if (!isSuperAdmin) {
      if (!organization_id) throw new Error("organization_id is required");

      const { data: callerProfile } = await supabaseAdmin
        .from("profiles")
        .select("organization_id")
        .eq("user_id", caller.id)
        .maybeSingle();

      if (!callerProfile || callerProfile.organization_id !== organization_id) {
        throw new Error("Access denied: you do not belong to this organization.");
      }
    }

    // ── 4. Verify branch belongs to the organization ────
    if (branch_id && organization_id) {
      const { data: branchCheck } = await supabaseAdmin
        .from("branches")
        .select("id")
        .eq("id", branch_id)
        .eq("organization_id", organization_id)
        .maybeSingle();

      if (!branchCheck) {
        throw new Error("Invalid branch: branch does not belong to this organization.");
      }
    }

    // ═══════════════════════════════════════════════════
    // ACTION: invite
    // ═══════════════════════════════════════════════════
    if (action === "invite") {
      // Validate email format
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error("Invalid email address");
      }
      if (!role || typeof role !== "string") {
        throw new Error("Role is required");
      }

      // Super admin can assign any role including Owner
      if (!isSuperAdmin) {
        if (!organization_id) throw new Error("organization_id is required");

        // Enforce plan-based limits
        const { data: org } = await supabaseAdmin
          .from("organizations")
          .select("subscription_plan")
          .eq("id", organization_id)
          .single();
        const plan = org?.subscription_plan || "basic";
        const maxUsers = PLAN_USER_LIMITS[plan] ?? 2;
        const allowedRoles = PLAN_ALLOWED_ROLES[plan] ?? ["Owner", "Staff"];

        if (!allowedRoles.includes(role)) {
          throw new Error(`Role "${role}" is not available on your current plan.`);
        }
        if (isManager && !isOwner && role !== "Staff") {
          throw new Error("Managers can only add Staff users.");
        }
        if (role === "Owner" || role === "super_admin") {
          throw new Error("Cannot assign Owner or super_admin role via invite.");
        }

        const { count } = await supabaseAdmin
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", organization_id);
        if ((count || 0) >= maxUsers) {
          throw new Error(`User limit reached (${maxUsers}). Upgrade your plan to add more users.`);
        }
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
      await new Promise((r) => setTimeout(r, 500));

      // Update profile
      const profileUpdate: Record<string, any> = {
        full_name: full_name || null,
      };
      if (organization_id) {
        profileUpdate.organization_id = organization_id;
      }
      if (branch_id) {
        profileUpdate.branch_id = branch_id;
      }

      await supabaseAdmin
        .from("profiles")
        .update(profileUpdate)
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

    // ═══════════════════════════════════════════════════
    // ACTION: remove
    // ═══════════════════════════════════════════════════
    if (action === "remove") {
      if (!isSuperAdmin && !isOwner) {
        throw new Error("Only Owners can remove users.");
      }

      const { user_id: targetUserId } = body;
      if (!targetUserId) throw new Error("user_id is required");

      if (targetUserId === caller.id) {
        throw new Error("You cannot remove yourself.");
      }

      // Super admin can delete anyone; org owner restricted to same org
      if (!isSuperAdmin) {
        const { data: targetProfile } = await supabaseAdmin
          .from("profiles")
          .select("organization_id")
          .eq("user_id", targetUserId)
          .maybeSingle();

        if (!targetProfile || targetProfile.organization_id !== organization_id) {
          throw new Error("Cannot remove a user from a different organization.");
        }
      }

      // Prevent deleting other super_admins
      const { data: targetRoles } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", targetUserId);
      const targetIsSuperAdmin = (targetRoles || []).some((r: any) => r.role === "super_admin");
      if (targetIsSuperAdmin) {
        throw new Error("Cannot delete a super admin user.");
      }

      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);
      if (deleteError) throw deleteError;

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ═══════════════════════════════════════════════════
    // ACTION: delete_organization (super_admin only)
    // ═══════════════════════════════════════════════════
    if (action === "delete_organization") {
      if (!isSuperAdmin) {
        throw new Error("Only super admins can delete organizations.");
      }

      const { target_org_id } = body;
      if (!target_org_id) throw new Error("target_org_id is required");

      // Get all users in this org
      const { data: orgProfiles } = await supabaseAdmin
        .from("profiles")
        .select("user_id")
        .eq("organization_id", target_org_id);

      // Delete all non-super-admin users in the org
      for (const profile of (orgProfiles || [])) {
        const { data: uRoles } = await supabaseAdmin
          .from("user_roles")
          .select("role")
          .eq("user_id", profile.user_id);
        const isSA = (uRoles || []).some((r: any) => r.role === "super_admin");
        if (!isSA && profile.user_id !== caller.id) {
          await supabaseAdmin.auth.admin.deleteUser(profile.user_id);
        }
      }

      // Delete branches
      await supabaseAdmin.from("branches").delete().eq("organization_id", target_org_id);

      // Delete the organization
      const { error: orgError } = await supabaseAdmin
        .from("organizations")
        .delete()
        .eq("id", target_org_id);
      if (orgError) throw orgError;

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error("Unknown action");
  } catch (err: any) {
    const status = err.message?.includes("Unauthorized") || err.message?.includes("Access denied")
      ? 403
      : 400;
    return new Response(
      JSON.stringify({ error: err.message }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
