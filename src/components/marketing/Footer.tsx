'use client';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { name: 'About Us', href: '#about' },
    { name: 'Services', href: '#services' },
    { name: 'Testimonials', href: '#testimonials' },
    { name: 'Packages', href: '#packages' },
  ];

  const socialLinks = [
    { name: 'Twitter', href: 'https://twitter.com/crystalfootball', icon: '🐦' },
    { name: 'Telegram', href: 'https://t.me/crystalfootball', icon: '📱' },
    { name: 'YouTube', href: 'https://youtube.com/@crystalfootball', icon: '📺' },
  ];

  const scrollToSection = (id: string) => {
    if (id.startsWith('#')) {
      const element = document.getElementById(id.slice(1));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <footer className="bg-background-alt border-t border-border">
      <div className="container">
        <div className="py-12 md:py-16">
          {/* Main Footer Content */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
            {/* Brand Section */}
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-10 h-10 bg-gradient-cyan rounded-lg flex items-center justify-center">
                  <span className="text-charcoal font-bold text-xl">CF</span>
                </div>
                <span className="text-foreground font-bold text-xl">Crystal Football</span>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6 max-w-md">
                AI-backed football predictions with transparent tracking and disciplined bankroll
                management. Join thousands of successful bettors who trust our proven methodology.
              </p>
              <div className="flex space-x-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-card border border-border hover:border-accent rounded-lg flex items-center justify-center transition-all duration-200 focus-visible-cyan hover:shadow-md hover:shadow-accent/10"
                    aria-label={social.name}
                  >
                    <span className="text-lg">{social.icon}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-foreground font-semibold mb-4 text-lg">Quick Links</h3>
              <ul className="grid grid-cols-2 gap-2 md:flex md:flex-col md:space-y-3">
                {quickLinks.map((link) => (
                  <li key={link.name}>
                    <button
                      onClick={() => scrollToSection(link.href)}
                      className="text-muted-foreground hover:text-accent transition-colors duration-200 text-sm focus-visible-cyan text-left w-full"
                    >
                      {link.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-muted-foreground text-sm">
              © {currentYear} Crystal Football. All rights reserved.
            </div>

            <div className="flex items-center space-x-4 text-xs md:text-sm">
              <span className="text-muted-foreground">Licensed & Regulated</span>
              <div className="w-px h-4 bg-border" />
              <span className="text-muted-foreground">18+ Only</span>
              <div className="w-px h-4 bg-border" />
              <span className="text-muted-foreground">Gamble Responsibly</span>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-muted-foreground text-xs leading-relaxed text-center max-w-4xl mx-auto">
              <strong>Disclaimer:</strong> Gambling involves risk. Past performance does not
              guarantee future results. Only bet what you can afford to lose. Crystal Football
              provides analysis and predictions for entertainment purposes only. Users must be 18+
              and comply with local laws. If you have a gambling problem, seek help at{' '}
              <a href="https://www.begambleaware.org" className="text-accent hover:underline">
                BeGambleAware.org
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
