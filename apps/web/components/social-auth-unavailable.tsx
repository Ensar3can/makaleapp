import { Button } from './ui/button';

export function SocialAuthUnavailable() {
  return (
    <div className="mt-6 space-y-3">
      <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
        <span className="h-px flex-1 bg-line" />
        or
        <span className="h-px flex-1 bg-line" />
      </div>
      <p className="text-center text-xs leading-5 text-muted">
        Google and ORCID sign-in are not connected. Use email and password.
      </p>
      <Button type="button" variant="ghost" disabled className="w-full">
        Continue with Google
      </Button>
      <Button type="button" variant="ghost" disabled className="w-full">
        Continue with ORCID
      </Button>
    </div>
  );
}
