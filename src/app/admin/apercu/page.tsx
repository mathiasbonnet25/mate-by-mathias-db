import { AdminHeader } from "@/components/admin/ui";
import { ResponsivePreview } from "@/components/admin/responsive-preview";

export const dynamic = "force-dynamic";

export const metadata = { title: "Aperçu responsive" };

export default function AdminPreviewPage() {
  return (
    <>
      <AdminHeader
        title="Aperçu responsive"
        description="Vérifiez le rendu du site sur ordinateur, tablette et téléphone avant de publier vos modifications."
      />
      <ResponsivePreview />
    </>
  );
}
