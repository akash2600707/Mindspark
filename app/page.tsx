import Link from 'next/link';

export default function Home(){
  return <>
    <main className="hero">
      <div>
        <div className="eyebrow">International Service · Live Quiz</div>
        <h1>One World.<br/>One Challenge.<br/>One Winner.</h1>
        <p>Test your knowledge of countries, cultures, history, science, world affairs and global pop culture in a live individual quiz hosted by the Rotaract Club of Madras Millenia.</p>
        <div className="actions"><Link className="btn btn-primary" href="/register">Register Now</Link><Link className="btn btn-secondary" href="/join">Join Quiz</Link></div>
      </div>
      <div className="orb" aria-hidden="true" />
    </main>
    <section className="section"><div className="grid grid-3"><div className="card"><div className="kpi">FORMAT</div><h3>Individual</h3><p className="muted">One participant, one live quiz session.</p></div><div className="card"><div className="kpi">ACCESS</div><h3>No login</h3><p className="muted">Register once and use your generated participant code.</p></div><div className="card"><div className="kpi">LIVE</div><h3>Real-time</h3><p className="muted">Centralized question timing, scoring and event control.</p></div></div></section>
  </>
}
