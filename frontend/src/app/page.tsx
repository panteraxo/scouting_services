import Link from "next/link";

export default function HomePage() {
  return (
    <main className="page">
      <section className="welcome">
        <p className="eyebrow">SCOUTING.PE</p>
        <h1>Plataforma de scouting de fútbol</h1>
        <p>Base inicial del sistema web para descubrir, evaluar y dar seguimiento al talento futbolístico.</p>
        <Link className="primaryButton" href="/inicio">Entrar al dashboard de prueba</Link>
      </section>
    </main>
  );
}
