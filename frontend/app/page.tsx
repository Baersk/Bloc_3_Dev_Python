'use client';

import Navbar from './components/Navbar';

export default function Home() {
  return (
    <div>
      <Navbar />
      <section
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '80vh',
          background: 'linear-gradient(135deg, #0070f3, #00aaff)',
          color: '#fff',
          textAlign: 'center',
          padding: '0 20px'
        }}
      >
        <h1 style={{ fontSize: '3em', margin: '0.5em 0' }}>
          Bienvenue sur le site des Jeux Olympiques 2024
        </h1>
        <p style={{ fontSize: '1.5em', margin: '0.5em 0' }}>
          Réservez vos billets en toute sécurité
        </p>
        <a
          href="/offres"
          style={{
            display: 'inline-block',
            marginTop: '1em',
            padding: '15px 30px',
            backgroundColor: '#ff4081',
            color: '#fff',
            borderRadius: '30px',
            textDecoration: 'none',
            fontSize: '1.2em',
            boxShadow: '0px 4px 10px rgba(0,0,0,0.2)',
            transition: 'background-color 0.3s ease'
          }}
          onMouseOver={e => e.currentTarget.style.backgroundColor = '#e73370'}
          onMouseOut={e => e.currentTarget.style.backgroundColor = '#ff4081'}
        >
          Voir nos offres
        </a>
      </section>
    </div>
  );
}