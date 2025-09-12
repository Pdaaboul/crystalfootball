export default function About() {
  return (
    <section id="about" className="py-20 md:py-32 bg-background-alt">
      <div className="container">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Who We Are
            </h2>
            <div className="w-24 h-1 bg-gradient-gold mx-auto rounded-full mb-8" />
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              We are a team of passionate football analysts and data scientists working hand-in-hand
              with advanced AI systems. Our mission is simple: to deliver accurate, safe, and
              profitable betting insights for our community worldwide.
            </p>
          </div>

          {/* Two-column content */}
          <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Column - Mission */}
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl md:text-3xl font-semibold text-foreground mb-4">
                  How We Work
                </h3>
                <div className="w-16 h-1 bg-accent rounded-full mb-6" />
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Our approach combines human expertise with advanced AI technology through our
                  proprietary 6-Layer Analytical Framework. Each prediction undergoes rigorous
                  analysis across multiple dimensions before reaching our members.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  We believe in complete transparency—every result is tracked, every strategy is
                  explained, and every member gets access to the reasoning behind our
                  recommendations.
                </p>
              </div>
            </div>

            {/* Right Column - Approach */}
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl md:text-3xl font-semibold text-foreground mb-4">
                  Our Approach
                </h3>
                <div className="w-16 h-1 bg-accent rounded-full mb-6" />

                <div className="space-y-6">
                  {/* Data Discipline */}
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-royal-blue rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <div className="w-4 h-4 bg-white rounded-sm" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">Data Discipline</h4>
                      <p className="text-muted-foreground text-sm">
                        Every prediction is backed by comprehensive data analysis, removing emotion
                        and bias from decision-making.
                      </p>
                    </div>
                  </div>

                  {/* AI Models */}
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-gold rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <div className="w-4 h-4 bg-charcoal rounded-sm" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">Advanced AI Models</h4>
                      <p className="text-muted-foreground text-sm">
                        Machine learning algorithms continuously evolve, learning from new data to
                        improve prediction accuracy.
                      </p>
                    </div>
                  </div>

                  {/* Transparent Tracking */}
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-cyan rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <div className="w-4 h-4 bg-charcoal rounded-sm" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">Transparent Tracking</h4>
                      <p className="text-muted-foreground text-sm">
                        All predictions are tracked publicly with real-time hit rates, profit/loss,
                        and performance metrics.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
