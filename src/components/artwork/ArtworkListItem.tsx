import type { Artwork, PageData } from "../../data";
import { ResponsiveImage } from "../ui/ResponsiveImage";

export const ArtworkListItem = ({
  artwork,
  page,
}: {
  artwork: Artwork;
  page: PageData;
}) => {
  const href = `/${page.slug}/${page.period}/${artwork.id}`;

  return (
    <div className="group">
      <a href={href}>
        <div>
          {artwork.image && (
            <ResponsiveImage
              fileName={artwork.image.file_name}
              alt={artwork.image.alt || artwork.title}
              className="w-full mx-auto"
              variant="thumbnail"
            />
          )}
        </div>
        <div className="md:opacity-0 group-hover:opacity-100 transition-opacity pt-2">
          <h2 className="font-poppins text-center">{artwork.title}</h2>
        </div>
      </a>
    </div>
  );
};
