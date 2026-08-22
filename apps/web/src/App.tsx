import { Button } from '@/components/ui/button';

export default function App() {
  return (
    <main className="app">
      <header className="app__header flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dataroom</h1>
          <p className="text-muted-foreground">
            Vite + NestJS on Turborepo, sharing one set of types.
          </p>
        </div>
        <Button onClick={() => alert('Tailwind and shadcn are working!')}>Click Me</Button>
      </header>
    </main>
  );
}
