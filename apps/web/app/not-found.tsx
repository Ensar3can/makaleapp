import { ButtonLink } from '../components/ui/button';
import { StatusPage } from '../components/ui/status-page';

export default function NotFoundPage() {
  return (
    <StatusPage
      framed
      code="404"
      title="This page is not available"
      message="Unpublished or unknown routes return a safe not-found page. No scores are calculated here."
      actions={
        <>
          <ButtonLink href="/" variant="primary">
            Back to discovery
          </ButtonLink>
          <ButtonLink href="/articles" variant="secondary">
            Browse articles
          </ButtonLink>
        </>
      }
    />
  );
}
