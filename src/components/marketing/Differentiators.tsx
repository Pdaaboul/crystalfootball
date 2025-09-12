export default function Differentiators() {
  const sixLayerFramework = [
    {
      icon: '📈',
      title: '1) Performance Metrics',
      description: 'GF/GA, xG, form trends',
    },
    {
      icon: '⚔️',
      title: '2) Tactical Style',
      description: 'attacking/defensive patterns and matchups',
    },
    {
      icon: '🧠',
      title: '3) Match Intelligence',
      description: 'competition type, motivation, schedule',
    },
    {
      icon: '🤝',
      title: '4) Head-to-Head & Psychology',
      description: 'history and mentality effects',
    },
    {
      icon: '🎯',
      title: '5) Market Selection',
      description: 'safe markets only, disciplined edges',
    },
    {
      icon: '🛡️',
      title: '6) Risk Control',
      description: 'confidence scoring and volatility checks',
    },
  ];

  return (
    <section className="py-20 md:py-32 bg-background-alt">
      <div className="container">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Our 6-Layer AI Engine
            </h2>
            <div className="w-24 h-1 bg-gradient-gold mx-auto rounded-full mb-8" />
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              Every prediction is processed through our comprehensive 6-Layer Analytical Framework,
              ensuring accuracy, safety, and intelligent risk control before reaching our members.
            </p>
          </div>

          {/* 6-Layer Framework Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sixLayerFramework.map((layer) => (
              <div
                key={layer.title}
                className="group bg-card border border-border rounded-xl p-6 hover:border-accent transition-all duration-300 hover:shadow-lg hover:shadow-accent/20"
              >
                {/* Icon */}
                <div className="text-3xl mb-4 transform group-hover:scale-110 transition-transform duration-300">
                  {layer.icon}
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold text-foreground mb-3 group-hover:text-accent transition-colors duration-300">
                  {layer.title}
                </h3>

                {/* Description */}
                <p className="text-muted-foreground text-sm leading-relaxed">{layer.description}</p>

                {/* Cyan Accent Divider */}
                <div className="mt-4 w-0 h-1 bg-accent rounded-full group-hover:w-full transition-all duration-500" />
              </div>
            ))}
          </div>

          {/* Why Choose Crystal Football Section */}
          <div className="mt-20 bg-gradient-royal rounded-2xl p-8 md:p-12">
            <h3 className="text-2xl md:text-3xl font-bold text-white text-center mb-8">
              Why Choose Crystal Football?
            </h3>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-cyan rounded-full mt-3 flex-shrink-0 glow-cyan" />
                <span className="text-white/90">Advanced AI-driven accuracy + human insight</span>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-cyan rounded-full mt-3 flex-shrink-0 glow-cyan" />
                <span className="text-white/90">
                  Transparent and honest reporting of wins & losses
                </span>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-cyan rounded-full mt-3 flex-shrink-0 glow-cyan" />
                <span className="text-white/90">
                  Exclusive strategies: Black Bet Protocol, Smart Multi-Way Systems
                </span>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-cyan rounded-full mt-3 flex-shrink-0 glow-cyan" />
                <span className="text-white/90">
                  A supportive community built on trust and results
                </span>
              </div>
            </div>

            <div className="text-center">
              <p className="text-white/90 text-lg mb-6 italic">
                We don&apos;t just predict — we analyze, strategize, and deliver.
              </p>
              <a
                href="/register"
                className="inline-flex items-center justify-center bg-gold hover:bg-deep-gold text-charcoal px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 focus-visible-gold glow-gold hover:glow-gold"
              >
                Join Our Community
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
