import { loadSiteData } from '../../data'

export const Navigation = () => {
  const siteData = loadSiteData()
  
  return (
    <header className="flex justify-between pt-4 pb-4 sm:pb-8 px-2 sm:px-8 z-10">
      <a href="/"><h1 className="text-xl sm:text-2xl font-bold">{siteData.title}</h1></a>
      <nav className="sm:w-2/3 md:w-3/5 lg:w-1/3 text-lg">
        <ul className="flex w-full justify-between">
          {siteData.navigation.map((item) => (
            <li key={item.name}>
              <a href={item.href} className="align-baseline">{item.name}</a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}