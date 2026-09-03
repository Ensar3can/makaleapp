import { PageSkeleton } from '../../components/page-skeleton';

export default function AuthLoading() {
  return <PageSkeleton inset={false} variant="form" label="Loading sign-in" />;
}
