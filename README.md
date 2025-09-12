# Crystal Football

AI-backed betslips through subscriptions platform built with Next.js, TypeScript, and Tailwind CSS.

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4 with shadcn/ui
- **UI Components**: Radix UI primitives
- **Charts**: Recharts
- **Code Quality**: ESLint + Prettier

## Prerequisites

- Node.js 18.18.0 or higher (recommended: Node.js 20+)
- npm (comes with Node.js)

## Getting Started

1. **Clone and Navigate**

   ```bash
   cd crystalfootball
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**

   ```bash
   cp .env.example .env.local
   ```

   Then fill in your environment variables in `.env.local`.

4. **Start Development Server**

   ```bash
   npm run dev
   ```

5. **Open Application**
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production with Turbopack
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout with responsive container
│   ├── page.tsx           # Homepage
│   └── globals.css        # Global styles with Tailwind and brand tokens
├── components/            # React components (future)
└── lib/                   # Utilities and configurations
    └── utils.ts           # shadcn/ui utilities
```

## Configuration Files

- `components.json` - shadcn/ui configuration
- `tailwind.config.ts` - Tailwind CSS configuration (v4)
- `tsconfig.json` - TypeScript configuration (strict mode)
- `.prettierrc` - Prettier code formatting rules
- `eslint.config.mjs` - ESLint configuration

## Responsive Design

The project includes a fully responsive container system:

- **Mobile**: 320px+ with 1rem padding
- **Small** (`sm: 640px`): Max-width 640px, 1.5rem padding
- **Medium** (`md: 768px`): Max-width 768px, 2rem padding
- **Large** (`lg: 1024px`): Max-width 1024px
- **Extra Large** (`xl: 1280px`): Max-width 1280px
- **2XL** (`2xl: 1400px`): Max-width 1400px

## Testing Responsiveness

To test the responsive container:

1. Run `npm run dev`
2. Open browser dev tools
3. Test at various widths including 320px minimum
4. Verify no horizontal scroll at any breakpoint

## Environment Variables

See `.env.example` for required environment variables:

- Supabase configuration (for future database integration)
- Telegram bot configuration (for future notifications)

## Development Notes

- Uses Tailwind CSS v4 with CSS-based configuration
- shadcn/ui is initialized but no components generated yet
- Strict TypeScript configuration enabled
- Mobile-first responsive design approach
- Prevents horizontal scroll with `overflow-x: hidden`

## Next Steps

This scaffold is ready for implementing:

- User authentication and subscriptions
- Admin panel with analytics
- VIP betslip feed
- Payment processing
- Referral system

---

_Project scaffold completed - ready for feature development._
