import { MAIN_CONTENT_ID } from '../lib/focus';

export function SkipLink() {
  return (
    <a href={`#${MAIN_CONTENT_ID}`} className="skip-link">
      Skip to main content
    </a>
  );
}
