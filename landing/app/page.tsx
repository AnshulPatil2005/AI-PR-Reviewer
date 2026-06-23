import AnnouncementBar from '@/components/AnnouncementBar'
import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import TrustBar from '@/components/TrustBar'
import HowItWorks from '@/components/HowItWorks'
import FeatureGrid from '@/components/FeatureGrid'
import DemoSection from '@/components/DemoSection'
import Integrations from '@/components/Integrations'
import Testimonials from '@/components/Testimonials'
import FAQ from '@/components/FAQ'
import CTABanner from '@/components/CTABanner'
import Footer from '@/components/Footer'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg text-fog">
      <AnnouncementBar />
      <Navbar />
      <main>
        <Hero />
        <TrustBar />
        <HowItWorks />
        <FeatureGrid />
        <DemoSection />
        <Integrations />
        <Testimonials />
        <FAQ />
        <CTABanner />
      </main>
      <Footer />
    </div>
  )
}
