'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import './styles.css';

export default function Connexion() {
  const [email, setEmail] = useState('');
  const [mot_de_passe, setMotDePasse] = useState('');
  const router = useRouter();

  const handleSubmit = () => {
    fetch('http://127.0.0.1:5000/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, mot_de_passe })
    })
      .then(res => res.json())
      .then(data => {
        if (data.user_id && data.role) {
          // Utilisation de "userId" pour la cohérence
          localStorage.setItem('userId', data.user_id);
          localStorage.setItem('role', data.role);
          // Récupérer le paramètre de redirection, s'il existe, sinon rediriger vers la page d'accueil
          const searchParams = new URLSearchParams(window.location.search);
          const redirect = searchParams.get("redirect") || '/';
          router.push(redirect);
        } else {
          alert('Erreur : ' + (data.error || 'Informations invalides.'));
        }
      })
      .catch(() => alert('Erreur lors de la connexion'));
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: 'auto', marginTop: '100px' }}>
      <h2>Se connecter</h2>
      <div style={{ marginBottom: '10px' }}>
        <input
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: '8px', width: '100%' }}
        />
      </div>
      <div style={{ marginBottom: '10px' }}>
        <input
          placeholder="Mot de passe"
          type="password"
          value={mot_de_passe}
          onChange={(e) => setMotDePasse(e.target.value)}
          style={{ padding: '8px', width: '100%' }}
        />
      </div>
      <button
        onClick={handleSubmit}
        style={{
          width: '100%',
          padding: '10px',
          backgroundColor: '#0077cc',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Se connecter
      </button>
    </div>
  );
}