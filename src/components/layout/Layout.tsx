import { loadSiteData } from '../../data'
import { Navigation } from './Navigation'
import { Footer } from './Footer'

export const Layout = ({ children }: { children: any }) => {
  const siteData = loadSiteData()
  const pageTitle = siteData.title

  return (
    <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{pageTitle}</title>
        <meta name="description" content={siteData.description} />
        <link href="/src/style.css" rel="stylesheet" />
      </head>
      <body className="flex flex-col min-h-screen text-neutral-800">
        <Navigation />
        <main className="container mx-auto flex-grow">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}