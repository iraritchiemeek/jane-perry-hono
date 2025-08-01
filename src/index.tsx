import { Hono } from 'hono'
import { jsxRenderer } from 'hono/jsx-renderer'
import { Layout } from './components/layout/Layout'
import { ArtworkList } from './components/artwork/ArtworkList'
import { ArtworkDetail } from './components/artwork/ArtworkDetail'
import { AboutPage } from './pages/AboutPage'
import { ContactPage } from './pages/ContactPage'
import { 
  loadPageData, 
  loadArtwork, 
  loadAboutData, 
  loadContactData,
  isValidSlugPeriod,
 
} from './data'

interface Env {
  IMAGES: any
  R2_IMAGES: R2Bucket
}

const app = new Hono<{ Bindings: Env }>()


app.use(jsxRenderer(({ children }) => {
  return <Layout>{children}</Layout>
}))

// Homepage - defaults to paintings/current
app.get('/', (c) => {
  const page = loadPageData('paintings', 'current')
  if (!page) {
    return c.notFound()
  }
  return c.render(<ArtworkList page={page} />)
})

// About page
app.get('/about', (c) => {
  const about = loadAboutData()
  return c.render(<AboutPage about={about} />)
})

// Contact page
app.get('/contact', (c) => {
  const contact = loadContactData()
  return c.render(<ContactPage contact={contact} />)
})

// Collection pages: /drawings/current, /drawings/early, /paintings/early
app.get('/:slug{(drawings|paintings)}/:period{(current|early)}', (c) => {
  const { slug, period } = c.req.param()
  
  if (!isValidSlugPeriod(slug, period)) {
    return c.notFound()
  }
  
  const page = loadPageData(slug, period)
  if (!page) {
    return c.notFound()
  }
  
  return c.render(<ArtworkList page={page} />)
})

// Individual artwork pages: /paintings/current/123
app.get('/:slug{(drawings|paintings)}/:period{(current|early)}/:artworkId{[0-9]+}', (c) => {
  const { slug, period, artworkId } = c.req.param()
  
  if (!isValidSlugPeriod(slug, period)) {
    return c.notFound()
  }
  
  const page = loadPageData(slug, period)
  if (!page) {
    return c.notFound()
  }
  
  const artwork = loadArtwork(artworkId)
  if (!artwork) {
    return c.notFound()
  }
  
  // Check if artwork exists in this page's collection
  const artworkInPage = page.artworks.find(a => a.id === artwork.id)
  if (!artworkInPage) {
    return c.notFound()
  }
  
  // Create list of other artworks (excluding current one)
  const allOtherArtworks = page.artworks.filter(a => a.id !== artwork.id)
  
  return c.render(
    <ArtworkDetail 
      artwork={artwork} 
      page={page} 
      allOtherArtworks={allOtherArtworks} 
    />
  )
})

// 404 handler
app.notFound((c) => {
  return c.render(
    <div class="text-center p-8">
      <h1 class="text-3xl font-bold underline mb-4">Page Not Found</h1>
      <p class="text-lg mb-4">The page you're looking for doesn't exist.</p>
      <a href="/" class="text-blue-500 hover:text-blue-700 underline">Return Home</a>
    </div>
  )
})

export default app
