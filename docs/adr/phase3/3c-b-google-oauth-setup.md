# Google OAuth Provider Configuration Sheet

**Status:** Awaiting owner setup in Google Cloud Console & Supabase Dashboard.
**Target Development Project:** `kstxwoitiistmvivwixd` (apip-development, Mumbai region).
**Associated Branch:** `antigravity/apip-auth-google-redesign`

---

## 1. Google Cloud Console Setup

1. Open the [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials).
2. Select or create your APIP project.
3. Configure **OAuth consent screen**:
   - **User Type:** External (for testing with your Google accounts).
   - **App name:** APIP — Agentic Pharma Co-intelligence Platform
   - **User support email:** (your email)
   - **Scopes:** `.../auth/userinfo.email`, `.../auth/userinfo.profile`, `openid` (default minimal sign-in scopes).
   - **Test users:** Add your Google email address(es) used for testing.
4. Create **OAuth Client ID**:
   - **Application type:** Web application
   - **Name:** APIP Supabase Auth Client
   - **Authorized JavaScript origins:**
     - `http://localhost:3000`
     - `http://localhost:3401`
     - `http://localhost:3501`
     - `http://127.0.0.1:3000`
     - `http://127.0.0.1:3401`
     - `http://127.0.0.1:3501`
     - `https://kstxwoitiistmvivwixd.supabase.co`
   - **Authorized redirect URIs:**
     - Exact Supabase Auth callback URL:
       `https://kstxwoitiistmvivwixd.supabase.co/auth/v1/callback`
5. Copy the generated **Client ID** and **Client Secret** (keep them private; never commit them to Git or paste in chat).

---

## 2. Supabase Dashboard Configuration

1. Go to your Supabase Project:
   `https://supabase.com/dashboard/project/kstxwoitiistmvivwixd/auth/providers`
2. Scroll to **Google** under Auth Providers:
   - Toggle **Enable Sign in with Google** to **ON**.
   - Paste your **Client ID** from Step 1.
   - Paste your **Client Secret** from Step 1 into the private secret field.
   - Click **Save**.
3. Under **URL Configuration** (`/auth/url-configuration`):
   - **Site URL:** `http://127.0.0.1:3501` (or your preview origin).
   - **Redirect URLs:** Add:
     - `http://127.0.0.1:3401/*`
     - `http://127.0.0.1:3501/*`
     - `http://localhost:3401/*`
     - `http://localhost:3501/*`
     - `http://127.0.0.1:3401/?apip_auth=1`
     - `http://127.0.0.1:3501/?apip_auth=1`

---

## 3. Verification Procedure

Once enabled in Supabase, `/auth/v1/settings` will automatically return:
```json
{
  "external": {
    "google": true
  }
}
```
The "Continue with Google" button in the APIP authentication UI will instantly activate PKCE sign-in.
The browser will open Google's account selection, authenticate, redirect back to `/?apip_auth=1`, exchange the PKCE code for a secure session token, and seamlessly direct the user to their respective dashboard (`#/patient/home` or `#/specialist`).
