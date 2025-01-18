import Link from "next/link";

export default function Home() {
  return (
    <main>
      <div>
        <h1>Ethereum Transactions and Pattern Visualisation</h1>
      </div>
      <div>
        <Link href="/visualise"> Visualise </Link>
      </div>
    </main>
  );
}
