import { loadSiteData } from '../../data'

export const Footer = () => {
  const siteData = loadSiteData()
  
  return (
    <footer className="container px-2 sm:mx-auto sm:px-0 flex-wrap-reverse pt-20 pb-8 flex justify-between">
      <p className="text-sm w-full md:w-auto">© {new Date().getFullYear()} Jane Perry. All rights reserved.</p>
      <div className='flex gap-6'>
        <a href={`mailto:${siteData.footer.email}`}>{siteData.footer.email}</a>
        <a href={siteData.footer.instagram.url} target="_blank" rel="noopener noreferrer">Instagram</a>
      </div>
    </footer>
  )
}