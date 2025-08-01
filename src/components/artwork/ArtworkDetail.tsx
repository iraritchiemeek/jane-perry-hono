import type { Artwork, PageData } from "../../data";
import { getDimensionDetails, formatPrice } from "../../data";
import { InfoItem } from "../ui/InfoItem";
import { ArtworkListItem } from "./ArtworkListItem";

export const ArtworkDetail = ({
  artwork,
  page,
  allOtherArtworks,
}: {
  artwork: Artwork;
  page: PageData;
  allOtherArtworks: Artwork[];
}) => {
  return (
    <>
      <div className="flex flex-col md:flex-row justify-center align-center md:h-[calc(100vh-95px)] pb-8 px-2 snap-y">
        <div className="relative w-full md:w-2/3 md:pb-0 aspect-[1/1] md:aspect-[16/9]">
          {artwork.image && (
            <img
              src={artwork.image}
              alt={artwork.title}
              className="object-top md:object-center object-contain w-full h-full"
            />
          )}
        </div>
        <div className="w-full h-full md:w-1/3 flex flex-col justify-center md:items-center pt-4 md:pt-0 snap-start">
          <div className="text-center md:text-left">
            <h1 className="text-3xl mb-8">{artwork.title}</h1>
            <InfoItem title="Year" value={artwork.year.toString()} />
            <InfoItem title="Size" value={getDimensionDetails(artwork)} />
            <InfoItem title="Medium" value={artwork.medium} />
            <InfoItem title="Price" value={formatPrice(artwork.price)} />
            <a href="mailto:perryjane@orcon.net.nz" className="w-full underline underline-offset-2 text-lg pt-4">Contact</a>
          </div>
        </div>
      </div>
      <hr className="my-16" />
      <div className="grid md:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-x-24 gap-y-12 items-center px-2 md:px-0 snap-start">
        {allOtherArtworks.map((otherArtwork) => (
          <ArtworkListItem
            key={otherArtwork.id}
            artwork={otherArtwork}
            page={page}
          />
        ))}
      </div>
    </>
  );
};
