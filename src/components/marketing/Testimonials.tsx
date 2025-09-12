'use client';

import { useState, useEffect } from 'react';

export default function Testimonials() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const testimonials = [
    {
      name: 'Mohamad Ak',
      role: 'Beirut',
      avatar: '👨‍💼',
      quote:
        'Good group for football betting, they share clear tips and regular updates. Worth subscribing if you like betting on matches.',
      rating: 5,
    },
    {
      name: 'Rami K.',
      role: 'Beirut',
      avatar: '👨‍💻',
      quote:
        "Crystal Football completely changed the way I bet. The AI analysis is incredibly accurate and the 4-Way system gives me real confidence. I've seen consistent profits and less stress.",
      rating: 5,
    },
    {
      name: 'Nour H.',
      role: 'Tripoli',
      avatar: '👩‍💼',
      quote:
        'I used to rely on random tips, but here every pick comes with deep data and clear reasoning. The daily VIP slips are professional and easy to follow. Highly recommended!',
      rating: 5,
    },
    {
      name: 'Jad M.',
      role: 'Saida',
      avatar: '👨‍🎓',
      quote:
        'What I love is transparency. Every bet, win or loss, is recorded and explained. The AI predictions are on another level—this is the smartest football service I have tried.',
      rating: 5,
    },
    {
      name: 'Hiba A.',
      role: 'Zahle',
      avatar: '👩‍💻',
      quote:
        'Crystal Football makes betting simple and exciting. Notifications come instantly, and I never miss a match. The correct-score strategies are brilliant and well calculated.',
      rating: 5,
    },
    {
      name: 'Elie S.',
      role: 'Jounieh',
      avatar: '👨‍💼',
      quote:
        'From the first week I felt the difference. The mix of AI analysis and human insight is unique. My bankroll management has improved thanks to their detailed reports.',
      rating: 5,
    },
  ];

  // Auto-advance carousel
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, testimonials.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % testimonials.length);
    setIsAutoPlaying(false);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    setIsAutoPlaying(false);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setCurrentSlide((prev) => (prev - 1 + testimonials.length) % testimonials.length);
        setIsAutoPlaying(false);
      }
      if (e.key === 'ArrowRight') {
        setCurrentSlide((prev) => (prev + 1) % testimonials.length);
        setIsAutoPlaying(false);
      }
      if (e.key === ' ') {
        e.preventDefault();
        setIsAutoPlaying(!isAutoPlaying);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAutoPlaying, testimonials.length]);

  return (
    <section id="testimonials" className="py-20 md:py-32 bg-background">
      <div className="container">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
              What Our Members Say
            </h2>
            <div className="w-24 h-1 bg-gradient-gold mx-auto rounded-full mb-8" />
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              Join thousands of successful bettors who trust Crystal Football for their daily
              predictions.
            </p>
          </div>

          {/* Mobile Carousel */}
          <div className="md:hidden relative">
            <div className="overflow-hidden rounded-xl">
              <div
                className="flex transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {testimonials.map((testimonial, index) => (
                  <div key={index} className="w-full flex-shrink-0 px-4">
                    <div className="bg-card border border-border rounded-xl p-6 text-center h-80 flex flex-col justify-between">
                      {/* Avatar */}
                      <div className="text-5xl mb-4">{testimonial.avatar}</div>

                      {/* Quote */}
                      <blockquote className="text-foreground mb-6 leading-relaxed flex-grow flex items-center">
                        &ldquo;{testimonial.quote}&rdquo;
                      </blockquote>

                      {/* Rating */}
                      <div className="flex justify-center mb-4">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <span key={i} className="text-gold text-xl">
                            ⭐
                          </span>
                        ))}
                      </div>

                      {/* Author */}
                      <div className="space-y-1">
                        <div className="font-semibold text-foreground">{testimonial.name}</div>
                        <div className="text-muted-foreground text-sm">{testimonial.role}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile Carousel Controls */}
            <div className="flex items-center justify-center mt-6 space-x-4">
              <button
                onClick={prevSlide}
                className="w-10 h-10 bg-card border border-border rounded-full flex items-center justify-center text-foreground hover:border-accent transition-colors focus-visible-cyan"
                aria-label="Previous testimonial"
              >
                ←
              </button>

              <div className="flex space-x-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`w-2 h-2 rounded-full transition-colors focus-visible-cyan ${
                      index === currentSlide ? 'bg-accent' : 'bg-muted'
                    }`}
                    aria-label={`Go to testimonial ${index + 1}`}
                  />
                ))}
              </div>

              <button
                onClick={nextSlide}
                className="w-10 h-10 bg-card border border-border rounded-full flex items-center justify-center text-foreground hover:border-accent transition-colors focus-visible-cyan"
                aria-label="Next testimonial"
              >
                →
              </button>
            </div>
          </div>

          {/* Desktop Grid */}
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-card border border-border rounded-xl p-6 text-center hover:border-accent transition-all duration-300 hover:shadow-lg hover:shadow-accent/20 min-h-96 flex flex-col"
              >
                {/* Avatar */}
                <div className="text-4xl mb-4">{testimonial.avatar}</div>

                {/* Quote */}
                <blockquote className="text-foreground mb-6 leading-relaxed text-sm flex-grow flex items-center justify-center">
                  &ldquo;{testimonial.quote}&rdquo;
                </blockquote>

                {/* Rating and Author - Fixed at bottom */}
                <div className="mt-auto">
                  {/* Rating */}
                  <div className="flex justify-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <span key={i} className="text-gold text-lg">
                        ⭐
                      </span>
                    ))}
                  </div>

                  {/* Author */}
                  <div className="space-y-1">
                    <div className="font-semibold text-foreground">{testimonial.name}</div>
                    <div className="text-muted-foreground text-xs">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="text-center mt-16">
            <p className="text-muted-foreground mb-6">Ready to start your own success story?</p>
            <a
              href="/register"
              className="inline-flex items-center justify-center bg-primary hover:bg-primary-hover text-primary-foreground px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 focus-visible-gold glow-gold hover:glow-gold"
            >
              Join 1,500+ Members
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
