# Fresh account verification plan — gated on reset completion

Status: **Preparation only. Do not register new hosted accounts while reset is pending.**

## Verified existing configuration

A read-only check of the existing development Auth settings returned `disable_signup=false`, `mailer_autoconfirm=false`, `external.email=true`, `external.phone=false`. Email/password registration is enabled and email confirmation remains required. No provider settings, email delivery, redirect allowlists or Google configuration were changed/tested in this reset work.

After the reset is verified, check the existing same-origin site on port 3602 and internal API on 3601. Confirm the existing PKCE return URL `http://127.0.0.1:3602/?apip_auth=1` is allowlisted before sending confirmation mail. Use owner-approved synthetic inboxes and private browser entry. Send one confirmation per test account; do not loop email-delivery attempts or disable email confirmation to force a pass.

## Patient

Register through Patient Registration. Verify the immutable role row is PATIENT for the verified new Auth UUID, without deriving permissions from the login URL or editable metadata. Confirm email; sign in; test dashboard, refresh, logout and account switching. Patient navigation must omit specialist entries. Direct specialist/admin/review URLs and APIs must fail closed. Valid patient credentials entered through Specialist Sign In must produce the correct-portal notice and clear the partial session.

## Specialist

Register through Specialist Registration, confirm email and verify the immutable SPECIALIST portal binding. First sign-in opens professional profile onboarding. Save draft and submit synthetic details. A submitted profile permits the specialist dashboard and own MedAssist/ADR tools; patient review access remains denied. Verify existing pending, rejected, expired, suspended and revoked semantics without altering genuine historical records. Wrong Patient Portal sign-in must be denied with partial-session cleanup. Registration/profile submission never creates professional approval.

## Independent administrator bootstrap

Deleting the old ten identities removes the sole identity administrator. No new administrator is provisioned automatically. Prepare a separate dedicated confirmed synthetic identity with no specialist application. Current routing requires a compatible SPECIALIST portal binding for administrative routes; that portal type is not professional approval. Do not use the applicant account or an ordinary patient account as an administrator.

Reuse `database/operations/bootstrap-specialist-admin.sql`. Recheck its actual checksum, subject ownership/confirmation, absence of an application and narrow identity-only capability. Privately display the exact selected UUID and obtain a new explicit owner approval of that UUID, bootstrap checksum, target and audit effects. Only an approved operator may run the one-time audited bootstrap. The runtime writer and browser cannot self-provision privileges. No patient-record access or professional review permission follows from administrator capability.

For a minimal demonstration, a Patient, one independently reviewed Specialist and a dedicated identity administrator can use three accounts. Show the Specialist pending first, then approve only with separate exact-subject owner authorization and the audited administrator workflow. Simultaneously displaying separate pending and approved specialists would require another synthetic identity and should be explicitly planned rather than silently created.

## Required evidence after reset

Verify the real role rows, real browser sessions, wrong-portal denial, onboarding, pending review restriction, explicit independent approval, two-user ADR isolation, refresh/logout, 1440px and 375px layouts, and readiness through port 3602. Do not report those tests passed from the earlier fixture results. Auth service recovery and the pending cookie/BFF work remain separately scoped limitations.
