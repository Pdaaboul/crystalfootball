import Header from '@/components/marketing/Header';
import Hero from '@/components/marketing/Hero';
import About from '@/components/marketing/About';
import ServicesGrid from '@/components/marketing/ServicesGrid';
import Differentiators from '@/components/marketing/Differentiators';
import Testimonials from '@/components/marketing/Testimonials';
import PackagesPreview from '@/components/marketing/PackagesPreview';
import CTASection from '@/components/marketing/CTASection';
import Footer from '@/components/marketing/Footer';

export default function LandingPage() {
  return (
    <>
      {/* Anchor for scroll to top */}
      <div id="top"></div>
      <Header />
      <main>
        <Hero />
        <About />
        <ServicesGrid />
        <Differentiators />
        <Testimonials />
        <PackagesPreview />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
