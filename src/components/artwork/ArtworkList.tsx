import type { PageData } from '../../data'
import { ArtworkListItem } from './ArtworkListItem'

export const ArtworkList = ({ page }: { page: PageData }) => {
  return (
    <>
      <h1 className="text-center text-3xl md:text-[4rem] my-8 md:my-16">{page.title}</h1>
      <div className="flex justify-center mb-8 px-2 md:px-0 divide-x divide-slate-300">
        <a className={`${page.period == 'current' ? 'underline' : ''} hover:underline px-4`} href={`/${page.slug}/current`}>Recent works</a>
        <a className={`${page.period == 'early' ? 'underline' : ''} hover:underline px-4`} href={`/${page.slug}/early`}>Earlier works</a>
      </div>
      <div className="grid md:grid-cols-3 sm:grid-cols-1 gap-x-24 gap-y-12 items-center px-2 md:px-0">
        {page.artworks.map((artwork) => (
          <ArtworkListItem key={artwork.id} artwork={artwork} page={page} />
        ))}
      </div>
    </>
  )
}