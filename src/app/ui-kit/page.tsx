export default function UIKitPage() {
  return (
    <div className="min-h-screen py-8 space-y-12">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold text-gradient-gold">
          Crystal Football UI Kit
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Complete component library showcasing the Crystal Football branding and design system
        </p>
      </div>

      {/* Typography Section */}
      <section className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground mb-2">Typography</h2>
          <div className="h-1 w-24 bg-gradient-gold mx-auto rounded-full"></div>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-1">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-foreground">Heading 1 - Main Title</h1>
            <h2 className="text-3xl font-semibold text-foreground">Heading 2 - Section Title</h2>
            <h3 className="text-2xl font-medium text-foreground">Heading 3 - Subsection</h3>
            <h4 className="text-xl font-medium text-foreground">Heading 4 - Component Title</h4>
            <h5 className="text-lg font-medium text-foreground">Heading 5 - Small Title</h5>
            <h6 className="text-base font-medium text-foreground">Heading 6 - Micro Title</h6>
          </div>

          <div className="space-y-4">
            <p className="text-base text-foreground leading-relaxed">
              Body text paragraph with regular weight. This demonstrates the standard text
              appearance across the Crystal Football platform with proper line spacing and
              readability.
            </p>
            <p className="text-sm text-muted-foreground">
              Small text example for captions, metadata, and secondary information.
            </p>
            <p className="text-xs text-muted-foreground">
              Extra small text for fine print and technical details.
            </p>
            <code className="text-sm bg-charcoal text-cyan px-2 py-1 rounded font-mono">
              Code snippet example
            </code>
          </div>
        </div>
      </section>

      {/* Buttons Section */}
      <section className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground mb-2">Buttons</h2>
          <div className="h-1 w-24 bg-gradient-gold mx-auto rounded-full"></div>
        </div>

        <div className="space-y-8">
          {/* Primary Buttons */}
          <div>
            <h3 className="text-xl font-semibold text-foreground mb-4">Primary Actions (Gold)</h3>
            <div className="flex flex-wrap gap-4">
              <button className="bg-primary hover:bg-primary-hover text-primary-foreground px-6 py-3 rounded-lg font-medium transition-all duration-200 focus-visible-gold glow-gold hover:glow-gold">
                Primary Button
              </button>
              <button className="bg-primary hover:bg-primary-hover text-primary-foreground px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 focus-visible-gold">
                Small Primary
              </button>
              <button className="bg-primary hover:bg-primary-hover text-primary-foreground px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-200 focus-visible-gold glow-gold">
                Large Primary
              </button>
              <button
                disabled
                className="bg-muted text-muted-foreground px-6 py-3 rounded-lg font-medium cursor-not-allowed"
              >
                Disabled
              </button>
            </div>
          </div>

          {/* Secondary Buttons */}
          <div>
            <h3 className="text-xl font-semibold text-foreground mb-4">
              Secondary Actions (Royal Blue)
            </h3>
            <div className="flex flex-wrap gap-4">
              <button className="bg-secondary hover:bg-secondary-hover text-secondary-foreground px-6 py-3 rounded-lg font-medium transition-all duration-200 focus-visible-cyan">
                Secondary Button
              </button>
              <button className="border-2 border-secondary hover:border-secondary-hover hover:bg-secondary-hover text-secondary hover:text-secondary-foreground px-6 py-3 rounded-lg font-medium transition-all duration-200 focus-visible-cyan">
                Outline Secondary
              </button>
              <button className="text-secondary hover:text-secondary-hover px-6 py-3 rounded-lg font-medium transition-all duration-200 focus-visible-cyan">
                Text Secondary
              </button>
            </div>
          </div>

          {/* Accent Buttons */}
          <div>
            <h3 className="text-xl font-semibold text-foreground mb-4">Accent Actions (Cyan)</h3>
            <div className="flex flex-wrap gap-4">
              <button className="bg-accent hover:bg-accent/80 text-accent-foreground px-6 py-3 rounded-lg font-medium transition-all duration-200 focus-visible-cyan glow-cyan">
                Accent Button
              </button>
              <button className="border-2 border-accent hover:border-accent/80 hover:bg-accent text-accent hover:text-accent-foreground px-6 py-3 rounded-lg font-medium transition-all duration-200 focus-visible-cyan">
                Outline Accent
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Cards Section */}
      <section className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground mb-2">Cards</h2>
          <div className="h-1 w-24 bg-gradient-gold mx-auto rounded-full"></div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="bg-card border border-border rounded-lg p-6 space-y-4 glow-cyan hover:glow-cyan transition-all duration-300">
            <h3 className="text-xl font-semibold text-card-foreground">Basic Card</h3>
            <p className="text-muted-foreground">
              A simple card with border and subtle glow effect for content organization.
            </p>
            <button className="bg-primary hover:bg-primary-hover text-primary-foreground px-4 py-2 rounded-md text-sm font-medium transition-all duration-200">
              Action
            </button>
          </div>

          <div className="bg-gradient-royal rounded-lg p-6 space-y-4 text-white">
            <h3 className="text-xl font-semibold">Gradient Card</h3>
            <p className="text-white/90">
              Card with royal blue gradient background for highlighted content.
            </p>
            <button className="bg-white text-royal-blue hover:bg-white/90 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200">
              Action
            </button>
          </div>

          <div className="bg-charcoal border border-cyan rounded-lg p-6 space-y-4">
            <h3 className="text-xl font-semibold text-white">Dark Card</h3>
            <p className="text-white/80">Charcoal background card with cyan border for emphasis.</p>
            <button className="bg-accent hover:bg-accent/80 text-accent-foreground px-4 py-2 rounded-md text-sm font-medium transition-all duration-200">
              Action
            </button>
          </div>
        </div>
      </section>

      {/* Badges Section */}
      <section className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground mb-2">Badges</h2>
          <div className="h-1 w-24 bg-gradient-gold mx-auto rounded-full"></div>
        </div>

        <div className="flex flex-wrap gap-4 justify-center">
          <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
            Primary
          </span>
          <span className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm font-medium">
            Secondary
          </span>
          <span className="bg-accent text-accent-foreground px-3 py-1 rounded-full text-sm font-medium">
            Accent
          </span>
          <span className="bg-success text-success-foreground px-3 py-1 rounded-full text-sm font-medium">
            Success
          </span>
          <span className="bg-warning text-warning-foreground px-3 py-1 rounded-full text-sm font-medium">
            Warning
          </span>
          <span className="bg-destructive text-destructive-foreground px-3 py-1 rounded-full text-sm font-medium">
            Error
          </span>
          <span className="border border-border text-foreground px-3 py-1 rounded-full text-sm font-medium">
            Outline
          </span>
        </div>
      </section>

      {/* Alerts Section */}
      <section className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground mb-2">Alerts</h2>
          <div className="h-1 w-24 bg-gradient-gold mx-auto rounded-full"></div>
        </div>

        <div className="space-y-4">
          <div className="border border-accent bg-accent/10 text-foreground p-4 rounded-lg">
            <div className="flex">
              <div className="flex-1">
                <h4 className="font-semibold text-accent">Information</h4>
                <p className="text-sm mt-1">
                  This is an informational alert with cyan accent styling.
                </p>
              </div>
            </div>
          </div>

          <div className="border border-success bg-success/10 text-foreground p-4 rounded-lg">
            <div className="flex">
              <div className="flex-1">
                <h4 className="font-semibold text-success">Success</h4>
                <p className="text-sm mt-1">Operation completed successfully!</p>
              </div>
            </div>
          </div>

          <div className="border border-warning bg-warning/10 text-foreground p-4 rounded-lg">
            <div className="flex">
              <div className="flex-1">
                <h4 className="font-semibold text-warning">Warning</h4>
                <p className="text-sm mt-1">Please review the following information carefully.</p>
              </div>
            </div>
          </div>

          <div className="border border-destructive bg-destructive/10 text-foreground p-4 rounded-lg">
            <div className="flex">
              <div className="flex-1">
                <h4 className="font-semibold text-destructive">Error</h4>
                <p className="text-sm mt-1">An error occurred. Please try again.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Forms Section */}
      <section className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground mb-2">Form Elements</h2>
          <div className="h-1 w-24 bg-gradient-gold mx-auto rounded-full"></div>
        </div>

        <div className="max-w-2xl mx-auto space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Text Input</label>
              <input
                type="text"
                placeholder="Enter text..."
                className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground placeholder-muted-foreground focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all duration-200"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email Input</label>
              <input
                type="email"
                placeholder="email@example.com"
                className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground placeholder-muted-foreground focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all duration-200"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Select Dropdown</label>
            <select className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all duration-200">
              <option>Choose an option...</option>
              <option>Option 1</option>
              <option>Option 2</option>
              <option>Option 3</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Textarea</label>
            <textarea
              rows={4}
              placeholder="Enter your message..."
              className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground placeholder-muted-foreground focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all duration-200 resize-vertical"
            ></textarea>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="checkbox"
              className="w-5 h-5 text-accent bg-input border-border rounded focus:ring-accent"
            />
            <label htmlFor="checkbox" className="text-sm text-foreground">
              I agree to the terms and conditions
            </label>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="radio"
              id="radio1"
              name="radio"
              className="w-4 h-4 text-accent bg-input border-border"
            />
            <label htmlFor="radio1" className="text-sm text-foreground">
              Radio option 1
            </label>
          </div>
        </div>
      </section>

      {/* Table Section */}
      <section className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground mb-2">Data Table</h2>
          <div className="h-1 w-24 bg-gradient-gold mx-auto rounded-full"></div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full bg-card border border-border rounded-lg overflow-hidden">
            <thead className="bg-muted">
              <tr>
                <th className="text-left px-6 py-4 font-semibold text-foreground">Name</th>
                <th className="text-left px-6 py-4 font-semibold text-foreground">Status</th>
                <th className="text-left px-6 py-4 font-semibold text-foreground">Amount</th>
                <th className="text-left px-6 py-4 font-semibold text-foreground">Date</th>
                <th className="text-left px-6 py-4 font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr className="hover:bg-muted/50 transition-colors">
                <td className="px-6 py-4 text-foreground">John Doe</td>
                <td className="px-6 py-4">
                  <span className="bg-success text-success-foreground px-2 py-1 rounded-full text-xs font-medium">
                    Active
                  </span>
                </td>
                <td className="px-6 py-4 text-foreground font-mono">$1,234.56</td>
                <td className="px-6 py-4 text-muted-foreground">2024-01-15</td>
                <td className="px-6 py-4">
                  <button className="text-accent hover:text-accent/80 text-sm font-medium">
                    View
                  </button>
                </td>
              </tr>
              <tr className="hover:bg-muted/50 transition-colors">
                <td className="px-6 py-4 text-foreground">Jane Smith</td>
                <td className="px-6 py-4">
                  <span className="bg-warning text-warning-foreground px-2 py-1 rounded-full text-xs font-medium">
                    Pending
                  </span>
                </td>
                <td className="px-6 py-4 text-foreground font-mono">$987.65</td>
                <td className="px-6 py-4 text-muted-foreground">2024-01-14</td>
                <td className="px-6 py-4">
                  <button className="text-accent hover:text-accent/80 text-sm font-medium">
                    View
                  </button>
                </td>
              </tr>
              <tr className="hover:bg-muted/50 transition-colors">
                <td className="px-6 py-4 text-foreground">Bob Wilson</td>
                <td className="px-6 py-4">
                  <span className="bg-destructive text-destructive-foreground px-2 py-1 rounded-full text-xs font-medium">
                    Inactive
                  </span>
                </td>
                <td className="px-6 py-4 text-foreground font-mono">$543.21</td>
                <td className="px-6 py-4 text-muted-foreground">2024-01-13</td>
                <td className="px-6 py-4">
                  <button className="text-accent hover:text-accent/80 text-sm font-medium">
                    View
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Color Palette Section */}
      <section className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground mb-2">Color Palette</h2>
          <div className="h-1 w-24 bg-gradient-gold mx-auto rounded-full"></div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3">
            <div className="bg-royal-blue h-20 rounded-lg flex items-center justify-center">
              <span className="text-white font-medium">Royal Blue</span>
            </div>
            <p className="text-sm text-muted-foreground text-center">#1E66A9</p>
          </div>

          <div className="space-y-3">
            <div className="bg-dark-navy h-20 rounded-lg flex items-center justify-center">
              <span className="text-white font-medium">Dark Navy</span>
            </div>
            <p className="text-sm text-muted-foreground text-center">#0C2F57</p>
          </div>

          <div className="space-y-3">
            <div className="bg-light-blue h-20 rounded-lg flex items-center justify-center">
              <span className="text-charcoal font-medium">Light Blue</span>
            </div>
            <p className="text-sm text-muted-foreground text-center">#3FA9F5</p>
          </div>

          <div className="space-y-3">
            <div className="bg-gold h-20 rounded-lg flex items-center justify-center">
              <span className="text-charcoal font-medium">Gold</span>
            </div>
            <p className="text-sm text-muted-foreground text-center">#FFD700</p>
          </div>

          <div className="space-y-3">
            <div className="bg-deep-gold h-20 rounded-lg flex items-center justify-center">
              <span className="text-white font-medium">Deep Gold</span>
            </div>
            <p className="text-sm text-muted-foreground text-center">#D4AF37</p>
          </div>

          <div className="space-y-3">
            <div className="bg-cyan h-20 rounded-lg flex items-center justify-center">
              <span className="text-charcoal font-medium">Light Cyan</span>
            </div>
            <p className="text-sm text-muted-foreground text-center">#A3DFFF</p>
          </div>

          <div className="space-y-3">
            <div className="bg-charcoal h-20 rounded-lg flex items-center justify-center border border-border">
              <span className="text-white font-medium">Charcoal</span>
            </div>
            <p className="text-sm text-muted-foreground text-center">#0B0E15</p>
          </div>

          <div className="space-y-3">
            <div className="bg-white-text h-20 rounded-lg flex items-center justify-center border border-border">
              <span className="text-charcoal font-medium">White</span>
            </div>
            <p className="text-sm text-muted-foreground text-center">#FFFFFF</p>
          </div>
        </div>
      </section>
    </div>
  );
}
