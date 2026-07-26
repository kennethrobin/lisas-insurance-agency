/**
 * Same-origin lead-capture endpoint.
 *
 * The visitor's browser posts here, NOT cross-origin to AgencyBloc: a
 * cross-origin form POST would navigate the whole page to the vendor's response
 * and break both "never leave the site" and the Step 1 -> Step 2 swap. This
 * route validates, forwards to AgencyBloc server-side, and returns small JSON
 * the widget can read.
 *
 * The lead capture is unconditional. This route knows nothing about booking —
 * Step 2 (cal.com) happens entirely client-side AFTER this succeeds, so a
 * failed or skipped booking can never affect the record created here.
 */
import type { APIRoute } from 'astro';
import { crm } from '../../data/leadForm';

// This is the one on-demand route; the rest of the site stays static.
export const prerender = false;

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

/** Digits only, for validation and for what we forward. */
const digits = (value: string) => value.replace(/\D+/g, '');

/** Loose but real structural email check — the CRM does the authoritative one. */
const looksLikeEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export const POST: APIRoute = async ({ request }) => {
  // 1. Method is enforced by exporting only POST; anything else 405s below.
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ ok: false, error: 'Could not read the form.' }, 400);
  }

  const f = crm.fields;
  const get = (name: string) => String(form.get(name) ?? '').trim();

  const firstName = get(f.firstName);
  const lastName = get(f.lastName);
  const email = get(f.email);
  const phoneRaw = get(f.phone);
  const help = get(f.help);
  const honeypot = get(f.honeypot);

  // 2. Honeypot: a filled trap means a bot. Return a success SHAPE so it learns
  //    nothing, but forward nothing.
  if (honeypot !== '') {
    return json({ ok: true });
  }

  // 3. Server-side validation — never trust the browser alone.
  const errors: string[] = [];
  if (!firstName) errors.push('First name is required.');
  if (!lastName) errors.push('Last name is required.');
  if (!email || !looksLikeEmail(email)) errors.push('A valid email is required.');
  if (digits(phoneRaw).length < 10) errors.push('A phone number with at least 10 digits is required.');
  if (errors.length > 0) {
    return json({ ok: false, error: errors.join(' ') }, 422);
  }

  // 4. Build the forwarded body from the field-name contract. The phone is
  //    normalised to digits. Consent version + timestamp ride along under their
  //    config-defined names; if the CRM has no such fields yet they are ignored.
  const upstream = new URLSearchParams();
  upstream.set(f.firstName, firstName);
  upstream.set(f.lastName, lastName);
  upstream.set(f.email, email);
  upstream.set(f.phone, digits(phoneRaw));
  upstream.set(f.help, help);
  upstream.set(f.honeypot, ''); // keep the contract's field, empty
  upstream.set(f.consentVersion, crm.consentTextVersion);
  upstream.set(f.consentTimestamp, new Date().toISOString());

  // 5. Forward server-side with a timeout.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), crm.timeoutMs);
  try {
    const res = await fetch(crm.endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: upstream.toString(),
      signal: controller.signal,
    });

    if (!res.ok) {
      // Log the full payload so a lost lead is recoverable from Vercel logs.
      console.error('[lead] upstream rejected', res.status, Object.fromEntries(upstream));
      return json(
        { ok: false, error: 'Something went wrong sending your details. Please call instead.' },
        502,
      );
    }

    return json({ ok: true });
  } catch (err) {
    // Timeout or network failure — the lead must not just vanish.
    console.error('[lead] upstream failed', String(err), Object.fromEntries(upstream));
    return json(
      { ok: false, error: 'Something went wrong sending your details. Please call instead.' },
      502,
    );
  } finally {
    clearTimeout(timer);
  }
};

/** Anything that isn't POST gets a clean 405. */
export const ALL: APIRoute = () =>
  new Response('Method Not Allowed', { status: 405, headers: { allow: 'POST' } });
