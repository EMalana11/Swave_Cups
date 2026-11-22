import { GalleryArchive } from "@/components/public/gallery-archive";
import { Async } from "@/components/ui/async";
import { PageSkeleton } from "@/components/ui/skeletons";
import { usePublishedGallery } from "@/hooks/queries";
import { usePageTitle } from "@/hooks/use-page-title";

export default function GalleryPage() {
  usePageTitle("Gallery");
  const query = usePublishedGallery();
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-4xl font-extrabold text-navy">Gallery</h1>
      <p className="font-hand text-2xl text-orange">little moments, album by album</p>
      <div className="mt-6">
        <Async query={query} skeleton={<PageSkeleton />} errorMessage="The gallery is temporarily unavailable. Please try again later.">
          {(images) => <GalleryArchive images={images} />}
        </Async>
      </div>
    </div>
  );
}
