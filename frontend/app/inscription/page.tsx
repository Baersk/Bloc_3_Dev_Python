'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import './styles.css';

export default function Inscription() {
  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    email: '',
    mot_de_passe: ''
  });
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    fetch('http://127.0.0.1:5000/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
      .then(res => res.json())
      .then(data => {
        if (data.message) {
          setMessage('Inscription réussie ! Veuillez vous connecter.');
          // Optionnel : redirection vers la page de connexion après quelques secondes
          setTimeout(() => {
            router.push('/connexion');
          }, 2000);
        } else {
          setMessage('Erreur : ' + (data.error || ''));
        }
      })
      .catch(() => setMessage('Erreur de communication avec le serveur.'));
  };

  return (
    <div className="form-container">
      <h2>Créez votre compte</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Nom"
          name="nom"
          value={form.nom}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          placeholder="Prénom"
          name="prenom"
          value={form.prenom}
          onChange={handleChange}
          required
        />
        <input
          type="email"
          placeholder="Email"
          name="email"
          value={form.email}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          placeholder="Mot de passe"
          name="mot_de_passe"
          value={form.mot_de_passe}
          onChange={handleChange}
          required
        />
        <button type="submit">S’inscrire</button>
      </form>
      {message && <div className="message">{message}</div>}
    </div>
  );
}