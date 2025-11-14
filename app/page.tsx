import { Nav } from "@/components/assetguard/nav"
import { Hero } from "@/components/assetguard/hero"
import { Stats } from "@/components/assetguard/stats"
import { Features } from "@/components/assetguard/features"
import { Process } from "@/components/assetguard/process"
import { PropertyCarousel } from "@/components/assetguard/property-carousel"
import { Footer } from "@/components/assetguard/footer"
import { CTASection } from "@/components/assetguard/cta"

export default function Page() {
  return (
    <main>
      <Nav />
      <Hero />
      <div id="about">
        <Stats />
        <Features />
      </div>
      <Process />
      <PropertyCarousel />
      <CTASection />
      <Footer />
    </main>
  )
}
