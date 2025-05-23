'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import './styles.css';

export default function Connexion() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('https://bloc-3-dev-python.onrender.com/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Envoie l'email et le mot_de_passe au backend
        body: JSON.stringify({ email: email.trim(), mot_de_passe: password })
      });
      const data = await response.json();

      if (response.ok) {
        // Stocke le token et d'autres informations (ID, rôle, etc.) localement
        localStorage.setItem('token', data.token);
        localStorage.setItem('userId', data.user_id);
        localStorage.setItem('role', data.role);
        // Redirection vers la page d'accueil ou le dashboard
        router.push('/');
      } else {
        setErrorMessage(data.error || 'Erreur lors de la connexion');
      }
    } catch (err) {
      console.error('Erreur côté client:', err);
      setErrorMessage('Erreur de communication avec le serveur.');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: 'auto', marginTop: '100px' }}>
      <h2>Se connecter</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '10px' }}>
          <input
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ padding: '8px', width: '100%' }}
            required
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <input
            placeholder="Mot de passe"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ padding: '8px', width: '100%' }}
            required
          />
        </div>
        <button
          type="submit"
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
      </form>
      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
    </div>
  );
}