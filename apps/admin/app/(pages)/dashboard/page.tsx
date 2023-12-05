import { trpc } from "@admin/app/(utils)/trpc";

export default async function Dashboard() {
  const response = await trpc.by.query({});
  return (
    <main>
      <div className="text-slate-700 dark:text-slate-200">{response}</div>
    </main>
  );
}
