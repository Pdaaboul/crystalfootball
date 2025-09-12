'use client';

export default function ServicesGrid() {
  const services = [
    {
      title: 'VIP Tips',
      description:
        'Curated, risk-screened selections with confidence ratings. Premium AI-backed predictions with detailed analysis and reasoning.',
      features: ['Daily predictions', 'Confidence ratings', 'Risk assessment', 'VIP support'],
      icon: '⭐',
      accent: 'gold',
    },
    {
      title: 'Correct Score',
      description:
        'Scenario-tested outcomes with smart staking notes. Specialized predictions using advanced statistical models.',
      features: ['High-value picks', 'Scenario testing', 'Smart staking', 'Goal patterns'],
      icon: '🎯',
      accent: 'cyan',
    },
    {
      title: 'Acca',
      description:
        'Structured, volatility-aware accumulators. Carefully curated bets with balanced risk-reward ratios.',
      features: ['Volatility checks', 'Risk balancing', 'Profit optimization', 'Disciplined edges'],
      icon: '🔗',
      accent: 'royal-blue',
    },
    {
      title: 'Competitions',
      description:
        'Community challenges with transparent scoring. Tournament-specific predictions covering major leagues.',
      features: [
        'Transparent scoring',
        'Community challenges',
        'League coverage',
        'Performance tracking',
      ],
      icon: '🏆',
      accent: 'light-blue',
    },
  ];

  return (
    <section id="services" className="py-20 md:py-32 bg-background">
      <div className="container">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Our Services
            </h2>
            <div className="w-24 h-1 bg-gradient-gold mx-auto rounded-full mb-8" />
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              From VIP tips to specialized markets, we offer comprehensive betting solutions
              tailored to different strategies and risk appetites.
            </p>
          </div>

          {/* Services Grid */}
          <div className="grid md:grid-cols-2 gap-8">
            {services.map((service) => (
              <div
                key={service.title}
                className="group bg-royal-blue hover:bg-light-blue rounded-xl p-8 transition-colors duration-300 hover:shadow-xl hover:shadow-light-blue/10"
              >
                {/* Service Icon */}
                <div className="text-4xl mb-6">{service.icon}</div>

                {/* Service Title */}
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">{service.title}</h3>

                {/* Cyan Accent Divider */}
                <div className="w-16 h-1 bg-cyan rounded-full mb-6 group-hover:w-24 transition-all duration-300" />

                {/* Service Description */}
                <p className="text-white/90 leading-relaxed mb-6">{service.description}</p>

                {/* Features List */}
                <div className="space-y-3">
                  {service.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-cyan rounded-full flex-shrink-0 glow-cyan" />
                      <span className="text-white/80 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Our Promise Section */}
          <div className="mt-20 bg-gradient-royal rounded-2xl p-8 md:p-12 text-center">
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-6">Our Promise</h3>
            <p className="text-white/90 text-lg leading-relaxed max-w-4xl mx-auto mb-8">
              We are fully transparent — every week we share results, winning ratios, and clear
              performance reports. Members get VIP strategies, exclusive accumulators, and real-time
              notifications to act fast and smart.
            </p>
          </div>

          {/* Bottom CTA */}
          <div className="text-center mt-16">
            <p className="text-muted-foreground mb-6">
              Ready to get started with professional betting insights?
            </p>
            <button
              onClick={() => {
                const element = document.getElementById('packages');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="inline-flex items-center justify-center bg-primary hover:bg-primary-hover text-primary-foreground px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 focus-visible-gold glow-gold hover:glow-gold"
            >
              View All Packages
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
