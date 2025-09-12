'use client';

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-dark">
        {/* Floating gradient panels */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-royal opacity-20 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute top-3/4 right-1/4 w-96 h-96 bg-gradient-royal opacity-15 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: '2s' }}
        />
        <div
          className="absolute bottom-1/4 left-1/2 w-80 h-80 bg-gradient-royal opacity-10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: '4s' }}
        />

        {/* Cyan glow accents */}
        <div className="absolute top-1/2 left-10 w-2 h-32 bg-cyan opacity-30 blur-sm animate-glow-pulse" />
        <div
          className="absolute top-1/3 right-20 w-2 h-24 bg-cyan opacity-25 blur-sm animate-glow-pulse"
          style={{ animationDelay: '1s' }}
        />
        <div
          className="absolute bottom-1/3 left-1/3 w-1 h-16 bg-cyan opacity-20 blur-sm animate-glow-pulse"
          style={{ animationDelay: '3s' }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 container text-center pt-20 pb-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Main Heading */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight">
            AI-backed betslips, <span className="text-gradient-gold">built for winning</span> with
            discipline
          </h1>

          {/* Supporting Copy */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            At Crystal Football, we redefine football predictions by merging expert human analysis
            with cutting-edge AI. Every pick is backed by our 6-Layer Analytical Framework for
            accuracy, safety, and intelligent risk control.
          </p>

          {/* Value Props */}
          <div className="flex flex-wrap justify-center gap-4 md:gap-8 text-sm md:text-base">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-accent rounded-full glow-cyan" />
              <span className="text-foreground">AI-Powered Analysis</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-accent rounded-full glow-cyan" />
              <span className="text-foreground">Transparent Hit Rates</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-accent rounded-full glow-cyan" />
              <span className="text-foreground">Bankroll Discipline</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8 pb-12 md:pb-4">
            <a
              href="/register"
              className="bg-primary hover:bg-primary-hover text-primary-foreground px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 focus-visible-gold glow-gold hover:glow-gold transform hover:scale-105"
            >
              Get VIP Access
            </a>
            <button
              onClick={() => {
                const element = document.getElementById('packages');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="bg-secondary hover:bg-secondary-hover text-secondary-foreground px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 focus-visible-cyan border-2 border-transparent hover:border-secondary-hover"
            >
              See Packages
            </button>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-6 md:bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-8 h-8 flex items-center justify-center text-accent">
          <svg 
            className="w-6 h-6" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M19 14l-7 7m0 0l-7-7m7 7V3" 
            />
          </svg>
        </div>
      </div>
    </section>
  );
}
