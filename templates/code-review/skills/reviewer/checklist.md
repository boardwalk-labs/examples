# Security review checklist

Apply each item to the diff. Flag a finding with its `file:line` and a concrete fix.

- Untrusted input flows into a SQL query, shell command, file path, or outbound URL without
  validation or parameterization.
- A secret (API key, token, password) is hard-coded, logged, or returned in a response body.
- An authorization check is missing on a state-changing or data-reading path.
- User-controlled data is rendered without escaping (XSS) or deserialized unsafely.
- A server-side request uses a user-supplied host with no allowlist (SSRF).
- A new dependency is added from an untrusted source or pinned to a mutable tag.
- An error message leaks internal details (stack traces, file paths, raw query text) to the caller.
- Authentication, crypto, or session logic is hand-rolled where a vetted library exists.
