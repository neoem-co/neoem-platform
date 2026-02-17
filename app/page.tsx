import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HeroSearch } from "@/components/home/HeroSearch";
import { FactoryCard } from "@/components/home/FactoryCard";
import { TrustBanners } from "@/components/home/TrustBanners";
import factoriesData from "@/data/factories.json";
import Link from "next/link";

export default function Home() {
  const topFactories = factoriesData.factories.slice(0, 4);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="/assets/factory-hero.jpg"
            alt="Manufacturing"
            className="w-full h-full object-cover opacity-5"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
        </div>

        <div className="container relative z-10">
          <HeroSearch />
        </div>
      </section>

      {/* Trust Banners */}
      <TrustBanners />

      {/* Verified Top Picks */}
      <section className="py-16">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Verified Top Picks</h2>
              <p className="text-muted-foreground mt-1">
                Handpicked factories with proven track records
              </p>
            </div>
            <Link
              href="/factories"
              className="text-sm font-medium text-primary hover:underline"
            >
              View all →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {topFactories.map((factory) => (
              <FactoryCard key={factory.id} factory={factory} />
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-secondary/30">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary">500+</div>
              <div className="text-muted-foreground mt-1">Verified Factories</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary">98%</div>
              <div className="text-muted-foreground mt-1">On-time Delivery</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary">10K+</div>
              <div className="text-muted-foreground mt-1">Products Launched</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary">24/7</div>
              <div className="text-muted-foreground mt-1">AI Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 flex-1">
        <div className="container">
          <div className="bg-card border rounded-2xl p-8 md:p-12 text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Ready to start manufacturing?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Join thousands of brands who trust NEOEM to connect them with the right factories.
              Get started with AI-powered matching today.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link
                href="/factories"
                className="inline-flex items-center justify-center h-12 px-8 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Find Your Factory
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center h-12 px-8 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors"
              >
                List Your Factory
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
