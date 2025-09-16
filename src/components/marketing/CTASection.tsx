export default function CTASection() {
  return (
    <section className="py-20 md:py-32 bg-background">
      <div className="container">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main CTA */}
          <div className="mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Ready to Start Winning?
            </h2>
            <div className="w-24 h-1 bg-gradient-cyan mx-auto rounded-full mb-8" />
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join over 1,500 successful bettors who trust Crystal Football for consistent,
              profitable predictions backed by advanced AI analysis.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a
                href="/register"
                className="bg-primary hover:bg-primary-hover text-primary-foreground px-12 py-4 rounded-lg font-bold text-xl transition-all duration-200 focus-visible-cyan glow-cyan hover:glow-cyan-strong transform hover:scale-105"
              >
                Start Now - $50/month
              </a>
              <a
                href="/packages"
                className="bg-secondary hover:bg-secondary-hover text-secondary-foreground px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 focus-visible-cyan"
              >
                View All Plans
              </a>
            </div>
          </div>

          {/* Contact Section */}
          <div className="border-t border-border pt-16">
            <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
              Questions? Get in Touch
            </h3>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Our team is available 24/7 to help you get started or answer any questions about our
              services and predictions.
            </p>

            {/* Contact Options */}
            <div className="flex justify-center max-w-md mx-auto">
              {/* Telegram */}
              <a
                href="https://t.me/crystalfootball"
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-card border border-border hover:border-accent rounded-xl p-6 transition-all duration-300 hover:shadow-lg hover:shadow-accent/20 focus-visible-cyan w-full"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-cyan rounded-lg flex items-center justify-center text-2xl">
                    📱
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-foreground group-hover:text-accent transition-colors">
                      Telegram
                    </div>
                    <div className="text-muted-foreground text-sm">@crystalfootball</div>
                    <div className="text-accent text-sm mt-1">Instant support & community</div>
                  </div>
                </div>
              </a>
            </div>

            {/* Additional Support Info */}
            <div className="mt-12 grid md:grid-cols-3 gap-6 text-center">
              <div className="space-y-2">
                <div className="text-2xl">⚡</div>
                <div className="font-semibold text-foreground">Fast Response</div>
                <div className="text-muted-foreground text-sm">Typically under 15 minutes</div>
              </div>
              <div className="space-y-2">
                <div className="text-2xl">🏆</div>
                <div className="font-semibold text-foreground">Expert Team</div>
                <div className="text-muted-foreground text-sm">Professional betting analysts</div>
              </div>
              <div className="space-y-2">
                <div className="text-2xl">🔒</div>
                <div className="font-semibold text-foreground">Confidential</div>
                <div className="text-muted-foreground text-sm">Your privacy is guaranteed</div>
              </div>
            </div>
          </div>

          {/* Final CTA */}
          <div className="mt-16 bg-gradient-dark rounded-2xl p-8 md:p-12">
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Don&apos;t Miss Out on Today&apos;s Predictions
            </h3>
            <p className="text-white/90 mb-6 max-w-2xl mx-auto">
              Our AI models have already identified today&apos;s high-value opportunities. Join now
              and start your winning streak immediately.
            </p>
            <a
              href="/register"
              className="inline-flex items-center justify-center bg-primary hover:bg-primary-hover text-primary-foreground px-8 py-4 rounded-lg font-bold text-lg transition-all duration-200 focus-visible-cyan glow-cyan hover:glow-cyan-strong"
            >
              Get Instant Access
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
