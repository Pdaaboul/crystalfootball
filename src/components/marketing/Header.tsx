'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMobileMenuOpen(false);
    }
  };



  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-background/95 backdrop-blur-md border-b border-border' : 'bg-background/90 backdrop-blur-sm'
      }`}
    >
      <div className="container">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <div className="flex items-center">
            <a 
              href="#top"
              className="flex items-center space-x-2 focus-visible-cyan hover:opacity-80 transition-opacity duration-200 cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                const topElement = document.getElementById('top');
                if (topElement) {
                  topElement.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                  });
                } else {
                  // Fallback to window scroll
                  window.scrollTo({
                    top: 0,
                    left: 0,
                    behavior: 'smooth'
                  });
                }
                setIsMobileMenuOpen(false);
              }}
            >
              <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-gold rounded-lg flex items-center justify-center">
                <span className="text-charcoal font-bold text-lg md:text-xl">CF</span>
              </div>
              <span className="text-foreground font-bold text-lg md:text-xl">Crystal Football</span>
            </a>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => scrollToSection('about')}
              className="text-foreground hover:text-accent transition-colors duration-200 focus-visible-cyan"
            >
              About
            </button>
            <button
              onClick={() => scrollToSection('services')}
              className="text-foreground hover:text-accent transition-colors duration-200 focus-visible-cyan"
            >
              Services
            </button>
            <button
              onClick={() => scrollToSection('testimonials')}
              className="text-foreground hover:text-accent transition-colors duration-200 focus-visible-cyan"
            >
              Reviews
            </button>
            <button
              onClick={() => scrollToSection('packages')}
              className="text-foreground hover:text-accent transition-colors duration-200 focus-visible-cyan"
            >
              Packages
            </button>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center space-x-4">
            <a
              href="/login"
              className="text-foreground hover:text-accent transition-colors duration-200 focus-visible-cyan"
            >
              Login
            </a>
            <a
              href="/register"
              className="bg-primary hover:bg-primary-hover text-primary-foreground px-6 py-2 rounded-lg font-medium transition-all duration-200 focus-visible-gold glow-gold hover:glow-gold"
            >
              Get Started
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden w-10 h-10 flex items-center justify-center text-foreground focus-visible-cyan"
            aria-label="Toggle mobile menu"
          >
            <div className="space-y-1.5">
              <div
                className={`w-6 h-0.5 bg-current transition-transform duration-300 ${
                  isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''
                }`}
              />
              <div
                className={`w-6 h-0.5 bg-current transition-opacity duration-300 ${
                  isMobileMenuOpen ? 'opacity-0' : ''
                }`}
              />
              <div
                className={`w-6 h-0.5 bg-current transition-transform duration-300 ${
                  isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''
                }`}
              />
            </div>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-background/95 backdrop-blur-md border-b border-border">
            <nav className="flex flex-col space-y-4 p-6">
              <button
                onClick={() => scrollToSection('about')}
                className="text-left text-foreground hover:text-accent transition-colors duration-200 focus-visible-cyan"
              >
                About
              </button>
              <button
                onClick={() => scrollToSection('services')}
                className="text-left text-foreground hover:text-accent transition-colors duration-200 focus-visible-cyan"
              >
                Services
              </button>
              <button
                onClick={() => scrollToSection('testimonials')}
                className="text-left text-foreground hover:text-accent transition-colors duration-200 focus-visible-cyan"
              >
                Reviews
              </button>
              <button
                onClick={() => scrollToSection('packages')}
                className="text-left text-foreground hover:text-accent transition-colors duration-200 focus-visible-cyan"
              >
                Packages
              </button>
              <div className="pt-4 border-t border-border space-y-3">
                <a
                  href="/login"
                  className="block text-foreground hover:text-accent transition-colors duration-200 focus-visible-cyan"
                >
                  Login
                </a>
                <a
                  href="/register"
                  className="block bg-primary hover:bg-primary-hover text-primary-foreground px-6 py-3 rounded-lg font-medium transition-all duration-200 focus-visible-gold text-center"
                >
                  Get Started
                </a>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
