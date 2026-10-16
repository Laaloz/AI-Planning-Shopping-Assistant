import { BackendStatus } from "@/components/backend-status";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-6 px-6 py-16">
      <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Kehitysversio</p>
      <h1 lang="en" className="text-3xl font-semibold tracking-tight sm:text-4xl">
        AI Planning &amp; Shopping Assistant
      </h1>
      <p className="text-lg leading-8 text-zinc-700 dark:text-zinc-300">
        Kerro, mitä olet hankkimassa tai rakentamassa. Avustaja kysyy olennaiset tarkennukset ja
        kokoaa muokattavan suunnitelman: osat, budjetin ja sopivat tuotteet uutena tai käytettynä.
      </p>
      <BackendStatus />
    </main>
  );
}
