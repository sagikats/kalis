# CLAUDE.md - Instructions for Claude Code

See comprehensive agent instructions and project guidelines in [AGENTS.md](./AGENTS.md).

## Quick Reference
- **Project**: Kalis (Israeli Academic Admission Planning & Optimization)
- **Supported Universities (8)**: Technion, TAU, HUJI, BGU, Haifa, Ariel, Bar-Ilan, Reichman
- **Dev Server**: `npm run dev` (http://localhost:3000)
- **Run Tests**: `npx tsx --test src/modules/*/__tests__/*.test.ts` (all 26 tests must pass)
- **Typecheck**: `npx tsc --noEmit`
- **Build**: `npm run build`
- **UI Language**: Hebrew, RTL (`dir="rtl"`)
- **Key Modules**:
  - `src/modules/calculators/` - Pure math calculators for 8 universities
  - `src/modules/db/` - Academic data and repository
  - `src/modules/optimizer/` - Recommendation tracks and solver
  - `src/components/flow/` - Flow wizard, What-If simulator, university grid
