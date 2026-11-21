import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AUTH_PROVIDERS } from "../constants";

function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 .5A11.5 11.5 0 0 0 .5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2.17c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.56-.29-5.25-1.28-5.25-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.7 5.4-5.27 5.69.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5Z"
      />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        fill="currentColor"
        d="M21.35 12.2c0-.64-.06-1.25-.16-1.84H12v3.48h5.24a4.48 4.48 0 0 1-1.94 2.94v2.44h3.14c1.84-1.7 2.91-4.2 2.91-7.02Z"
      />
      <path
        fill="currentColor"
        d="M12 21.75c2.63 0 4.83-.87 6.44-2.35l-3.14-2.44c-.87.58-1.98.93-3.3.93-2.53 0-4.68-1.71-5.45-4.01H3.3v2.52A9.75 9.75 0 0 0 12 21.75Z"
      />
      <path
        fill="currentColor"
        d="M6.55 13.88a5.86 5.86 0 0 1 0-3.76V7.6H3.3a9.76 9.76 0 0 0 0 8.8l3.25-2.52Z"
      />
      <path
        fill="currentColor"
        d="M12 6.11c1.43 0 2.72.49 3.73 1.45l2.8-2.8A9.39 9.39 0 0 0 12 2.25 9.75 9.75 0 0 0 3.3 7.6l3.25 2.52C7.32 7.82 9.47 6.11 12 6.11Z"
      />
    </svg>
  );
}

export function SocialAuthButtons({ onProvider, disabled, pendingProvider }) {
  const isGooglePending = pendingProvider === AUTH_PROVIDERS.GOOGLE;
  const isGithubPending = pendingProvider === AUTH_PROVIDERS.GITHUB;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-line" />
        <span className="text-xs font-medium tracking-wide text-muted uppercase">
          or continue with
        </span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={disabled}
          onClick={() => onProvider(AUTH_PROVIDERS.GOOGLE)}
        >
          {isGooglePending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <GoogleIcon />
          )}
          Google
        </Button>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={disabled}
          onClick={() => onProvider(AUTH_PROVIDERS.GITHUB)}
        >
          {isGithubPending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <GithubIcon />
          )}
          GitHub
        </Button>
      </div>
    </div>
  );
}
