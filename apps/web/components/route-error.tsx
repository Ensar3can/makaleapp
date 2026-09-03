import { StatusHomeLink, StatusPage, StatusRetryButton } from './ui/status-page';

export function RouteError({
  title,
  message,
  onRetry,
  code = 'Error',
}: {
  title: string;
  message: string;
  onRetry?: () => void;
  code?: string;
}) {
  return (
    <StatusPage
      framed
      code={code}
      title={title}
      message={message}
      actions={
        <>
          {onRetry ? <StatusRetryButton onRetry={onRetry} /> : null}
          <StatusHomeLink />
        </>
      }
    />
  );
}
