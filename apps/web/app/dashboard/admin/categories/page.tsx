import { ReservedPage } from '../../../../components/reserved-page';
import { ButtonLink } from '../../../../components/ui/button';

export const dynamic = 'force-dynamic';

export default function AdminCategoriesPage() {
  return (
    <ReservedPage
      kicker="Admin"
      title="Categories"
      description="Public categories are seeded and listed through discovery. There is no category create, update, or delete use case in v1.0."
      panelTitle="Category management is not built"
      panelDescription="This Stitch screen stays empty until category CRUD exists. Published topic cards continue to come from ListActiveCategories and public discovery."
      action={
        <ButtonLink href="/categories" variant="secondary">
          View public topics
        </ButtonLink>
      }
    />
  );
}
