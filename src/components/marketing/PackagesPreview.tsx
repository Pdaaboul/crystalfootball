export default function PackagesPreview() {
  const packages = [
    {
      name: 'Monthly Plan',
      duration: 'One month (30 days)',
      price: '$50',
      period: '',
      description:
        'Perfect for short-term experience and discovering the strength of our exclusive systems.',
      features: [
        'Full access to daily recommendations and professional analyses',
        'Instant notifications for new recommendations',
        'Access to the statistics page (winning & losing slips)',
        'Weekly performance tracking of the group',
        'Exclusive access to the Three-Way System and Black Bet Protocol',
      ],
      popular: false,
      tier: 'baseline',
      cta: 'Start Monthly Plan',
    },
    {
      name: 'Half-Season Plan',
      duration: '5 months',
      price: '$225',
      period: '',
      originalPrice: '$250',
      discount: '10% discount',
      description:
        'Ideal for serious members who want to benefit from exclusive systems for a longer period at a discounted price.',
      features: [
        'All benefits of the Monthly Plan',
        'One Cyan Ticket to enter an exclusive draw',
        'Priority customer support & faster responses',
        'Detailed monthly performance reports',
        'Exclusive access to the Three-Way System and Black Bet Protocol',
      ],
      popular: false,
      tier: 'mid-tier',
      cta: 'Choose Half-Season',
      badge: 'Popular Choice',
    },
    {
      name: 'Full Season Plan',
      duration: '10 months',
      price: '$400',
      period: '',
      originalPrice: '$500',
      discount: '20% discount',
      description:
        'Best choice for loyal members: full-season coverage with our strongest exclusive systems and maximum privileges.',
      features: [
        'All benefits of the previous plans',
        '2 Cyan Tickets with special rewards',
        'Early access to recommendations before everyone else (Priority Access)',
        'Comprehensive seasonal reports & in-depth analyses',
        'Special membership in the VIP Referral Program with higher commission',
        'Exclusive access to the Three-Way System and Black Bet Protocol',
      ],
      popular: true,
      tier: 'vip',
      cta: 'Go Full Season VIP',
      badge: 'Best Value',
    },
  ];

  return (
    <section id="packages" className="py-20 md:py-32 bg-background-alt">
      <div className="container">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Choose Your Plan
            </h2>
            <div className="w-24 h-1 bg-gradient-cyan mx-auto rounded-full mb-8" />
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              Start your profitable betting journey today. All plans include our core AI predictions
              with transparent tracking and money-back guarantee.
            </p>
          </div>

          {/* Packages Grid */}
          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {packages.map((pkg) => {
              const getCardStyling = (tier: string) => {
                switch (tier) {
                  case 'vip':
                    return 'border-cyan-blue bg-gradient-cyan text-pure-black shadow-2xl shadow-cyan-blue/20 glow-cyan';
                  case 'mid-tier':
                    return 'border-accent bg-card hover:border-accent hover:shadow-lg hover:shadow-accent/20 glow-cyan';
                  default:
                    return 'border-border bg-card hover:border-accent hover:shadow-lg hover:shadow-accent/20';
                }
              };

              const getBadgeStyling = (tier: string) => {
                switch (tier) {
                  case 'vip':
                    return 'bg-deep-charcoal text-cyan-blue';
                  case 'mid-tier':
                    return 'bg-accent text-charcoal';
                  default:
                    return 'bg-muted text-muted-foreground';
                }
              };

              return (
                <div
                  key={pkg.name}
                  className={`relative rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 flex flex-col h-full ${getCardStyling(pkg.tier)}`}
                >
                  {/* Badge */}
                  {pkg.badge && (
                    <div
                      className={`absolute -top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-full text-sm font-semibold ${getBadgeStyling(pkg.tier)}`}
                    >
                      {pkg.badge}
                    </div>
                  )}

                  <div className="p-8 flex flex-col h-full">
                    {/* Package Name */}
                    <h3
                      className={`text-2xl font-bold mb-2 ${
                        pkg.tier === 'vip' ? 'text-charcoal' : 'text-foreground'
                      }`}
                    >
                      {pkg.name}
                    </h3>

                    {/* Duration */}
                    <p
                      className={`text-sm font-medium mb-4 ${
                        pkg.tier === 'vip' ? 'text-charcoal/70' : 'text-muted-foreground'
                      }`}
                    >
                      Duration: {pkg.duration}
                    </p>

                    {/* Package Description */}
                    <p
                      className={`text-sm mb-6 leading-relaxed ${
                        pkg.tier === 'vip' ? 'text-charcoal/80' : 'text-muted-foreground'
                      }`}
                    >
                      {pkg.description}
                    </p>

                    {/* Pricing */}
                    <div className="mb-6">
                      <div className="flex items-baseline space-x-2">
                        <span
                          className={`text-4xl font-bold ${
                            pkg.tier === 'vip' ? 'text-charcoal' : 'text-foreground'
                          }`}
                        >
                          {pkg.price}
                        </span>
                        {pkg.period && (
                          <span
                            className={`text-lg ${
                              pkg.tier === 'vip' ? 'text-charcoal/70' : 'text-muted-foreground'
                            }`}
                          >
                            {pkg.period}
                          </span>
                        )}
                      </div>
                      {pkg.originalPrice && (
                        <div className="flex items-center space-x-2 mt-2">
                          <span
                            className={`text-sm line-through ${
                              pkg.tier === 'vip' ? 'text-charcoal/50' : 'text-muted-foreground/50'
                            }`}
                          >
                            {pkg.originalPrice}
                          </span>
                          <span
                            className={`text-sm font-semibold ${
                              pkg.tier === 'vip' ? 'text-charcoal' : 'text-accent'
                            }`}
                          >
                            {pkg.discount}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Features List */}
                    <ul className="space-y-3 mb-8 flex-grow">
                      {pkg.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start space-x-3">
                          <div
                            className={`w-2 h-2 rounded-full flex-shrink-0 mt-2 ${
                              pkg.tier === 'vip' ? 'bg-charcoal' : 'bg-accent glow-cyan'
                            }`}
                          />
                          <span
                            className={`text-sm leading-relaxed ${
                              pkg.tier === 'vip' ? 'text-charcoal/90' : 'text-foreground'
                            }`}
                          >
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA Button */}
                    <div className="mt-auto">
                      <a
                        href="/packages"
                        className={`block w-full text-center font-semibold py-4 px-6 rounded-lg transition-all duration-200 focus-visible-cyan ${
                          pkg.tier === 'vip'
                            ? 'bg-deep-charcoal hover:bg-deep-charcoal/90 text-cyan-blue'
                            : 'bg-primary hover:bg-primary-hover text-primary-foreground glow-cyan hover:glow-cyan-strong'
                        }`}
                      >
                        {pkg.cta}
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Money Back Guarantee */}
          <div className="text-center mt-16">
            <div className="inline-flex items-center space-x-3 bg-card border border-border rounded-xl px-6 py-4">
              <div className="text-2xl">🛡️</div>
              <div>
                <div className="font-semibold text-foreground">30-Day Money-Back Guarantee</div>
                <div className="text-muted-foreground text-sm">
                  Not satisfied? Get a full refund, no questions asked.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
