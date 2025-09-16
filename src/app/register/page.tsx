import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="container max-w-md">
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-4">Register</h1>
          <p className="text-muted-foreground mb-6">
            User registration system will be implemented in a future step.
          </p>
          <Link
            href="/"
            className="w-full bg-primary hover:bg-primary-hover text-primary-foreground py-3 px-4 rounded-lg font-medium transition-all duration-200 focus-visible-cyan"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
