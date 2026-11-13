# Shared portal layout

All APIP Patient and Specialist pages must place Back navigation directly beneath the shared header, left-aligned within the page gutter. Back navigation must never create an asymmetric sidebar or shift the main content from its intended horizontal alignment.

Reuse PageNavigation in the existing shared shell or the existing ADR/MedAssist navigation slot. It occupies a full-width normal-flow row with 24px separation. Keep content maximum widths and symmetric gutters; do not add page-specific horizontal offsets. Public landing and authentication retain their existing navigation behavior. Preserve guarded Back callbacks and role-authorized fallbacks.
