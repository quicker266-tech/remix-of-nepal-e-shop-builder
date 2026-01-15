/**
 * ============================================================================
 * STORE CUSTOMER AUTHENTICATION EDGE FUNCTION
 * ============================================================================
 * 
 * Handles store-specific customer authentication with secure password hashing.
 * Each store has its own independent customer accounts.
 * 
 * Endpoints:
 * - POST /register - Create new store customer account
 * - POST /login - Login and get session token
 * - POST /logout - Invalidate session
 * - POST /validate - Validate session and get customer data
 * - POST /update-profile - Update customer profile
 * - GET /orders - Get customer orders
 * 
 * ============================================================================
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple password hashing using Web Crypto API (PBKDF2)
async function hashPassword(password: string, salt?: string): Promise<{ hash: string; salt: string }> {
  const encoder = new TextEncoder();
  const actualSalt = salt || crypto.randomUUID();
  
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: encoder.encode(actualSalt),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );
  
  const hashArray = new Uint8Array(derivedBits);
  const hashHex = Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('');
  
  return { hash: `${actualSalt}:${hashHex}`, salt: actualSalt };
}

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [salt] = storedHash.split(':');
  if (!salt) return false;
  
  const { hash } = await hashPassword(password, salt);
  return hash === storedHash;
}

function generateSessionToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  // Convert to hex string instead of base64
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = new Uint8Array(hashBuffer);
  return Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Use service role client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const action = url.pathname.split('/').pop();

    // POST /register
    if (action === "register" && req.method === "POST") {
      const { store_id, email, password, full_name, phone } = await req.json();

      if (!store_id || !email || !password) {
        return new Response(
          JSON.stringify({ success: false, error: "Missing required fields" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (password.length < 6) {
        return new Response(
          JSON.stringify({ success: false, error: "Password must be at least 6 characters" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Hash the password
      const { hash: passwordHash } = await hashPassword(password);

      // Call the database function
      const { data, error } = await supabase.rpc("store_customer_register", {
        p_store_id: store_id,
        p_email: email,
        p_password_hash: passwordHash,
        p_full_name: full_name || null,
        p_phone: phone || null,
      });

      if (error) {
        console.error("Register error:", error);
        return new Response(
          JSON.stringify({ success: false, error: error.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify(data),
        { status: data.success ? 200 : 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // POST /login
    if (action === "login" && req.method === "POST") {
      const { store_id, email, password } = await req.json();

      if (!store_id || !email || !password) {
        return new Response(
          JSON.stringify({ success: false, error: "Missing required fields" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // First, get the stored password hash
      const { data: accountData, error: accountError } = await supabase
        .from("store_customer_accounts")
        .select("password_hash")
        .eq("store_id", store_id)
        .eq("email", email.toLowerCase().trim())
        .single();

      if (accountError || !accountData) {
        return new Response(
          JSON.stringify({ success: false, error: "Invalid email or password" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify password
      const isValid = await verifyPassword(password, accountData.password_hash);
      if (!isValid) {
        return new Response(
          JSON.stringify({ success: false, error: "Invalid email or password" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Generate session token
      const sessionToken = generateSessionToken();
      const tokenHash = await hashToken(sessionToken);

      // Call the database function to create session
      const { data, error } = await supabase.rpc("store_customer_login", {
        p_store_id: store_id,
        p_email: email,
        p_password_hash: accountData.password_hash,
        p_token_hash: tokenHash,
      });

      if (error) {
        console.error("Login error:", error);
        return new Response(
          JSON.stringify({ success: false, error: error.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!data.success) {
        return new Response(
          JSON.stringify(data),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Return session token (not the hash - client stores the token, we store hash)
      return new Response(
        JSON.stringify({
          success: true,
          token: sessionToken,
          customer_id: data.customer_id,
          email: data.email,
          full_name: data.full_name,
          expires_at: data.expires_at,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // POST /validate
    if (action === "validate" && req.method === "POST") {
      const { store_id, token } = await req.json();

      if (!store_id || !token) {
        return new Response(
          JSON.stringify({ success: false, error: "Missing required fields" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const tokenHash = await hashToken(token);

      const { data, error } = await supabase.rpc("store_customer_validate_session", {
        p_store_id: store_id,
        p_token_hash: tokenHash,
      });

      if (error) {
        console.error("Validate error:", error);
        return new Response(
          JSON.stringify({ success: false, error: error.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify(data),
        { status: data.success ? 200 : 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // POST /logout
    if (action === "logout" && req.method === "POST") {
      const { store_id, token } = await req.json();

      if (!store_id || !token) {
        return new Response(
          JSON.stringify({ success: false, error: "Missing required fields" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const tokenHash = await hashToken(token);

      const { data, error } = await supabase.rpc("store_customer_logout", {
        p_store_id: store_id,
        p_token_hash: tokenHash,
      });

      if (error) {
        console.error("Logout error:", error);
        return new Response(
          JSON.stringify({ success: false, error: error.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify(data),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // POST /update-profile
    if (action === "update-profile" && req.method === "POST") {
      const { store_id, token, full_name, phone, address, city } = await req.json();

      if (!store_id || !token) {
        return new Response(
          JSON.stringify({ success: false, error: "Missing required fields" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const tokenHash = await hashToken(token);

      const { data, error } = await supabase.rpc("store_customer_update_profile", {
        p_store_id: store_id,
        p_token_hash: tokenHash,
        p_full_name: full_name || null,
        p_phone: phone || null,
        p_address: address || null,
        p_city: city || null,
      });

      if (error) {
        console.error("Update profile error:", error);
        return new Response(
          JSON.stringify({ success: false, error: error.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify(data),
        { status: data.success ? 200 : 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // POST /orders (using POST for consistency with token in body)
    if (action === "orders" && req.method === "POST") {
      const { store_id, token } = await req.json();

      if (!store_id || !token) {
        return new Response(
          JSON.stringify({ success: false, error: "Missing required fields" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const tokenHash = await hashToken(token);

      const { data, error } = await supabase.rpc("store_customer_get_orders", {
        p_store_id: store_id,
        p_token_hash: tokenHash,
      });

      if (error) {
        console.error("Get orders error:", error);
        return new Response(
          JSON.stringify({ success: false, error: error.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify(data),
        { status: data.success ? 200 : 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: "Unknown action" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
