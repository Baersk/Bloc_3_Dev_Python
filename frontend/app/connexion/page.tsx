'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import './styles.css';

// Configuration de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function Connexion() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Utilisation de la méthode signInWithPassword (nouvelle API Supabase)
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password,
    });

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    if (data.session) {
      // Stockage de la session en option
      localStorage.setItem('supabase.auth.token', JSON.stringify(data.session));

      // Récupérer l'identifiant de l'utilisateur depuis la session
      const userId = data.session.user.id;
      localStorage.setItem('userId', userId);

      // Récupérer la ligne de profile correspondant à cet utilisateur pour obtenir le rôle
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (profileError) {
        setErrorMsg(profileError.message);
        return;
      } else {
        localStorage.setItem('role', profile.role);
      }

      // Redirection vers la page d'accueil ou dashboard
      router.push('/');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: 'auto', marginTop: '100px' }}>
      <h2>Se connecter</h2>
      <form onSubmit={handleLogin}>
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
      {errorMsg && <p style={{ color: 'red' }}>{errorMsg}</p>}
    </div>
  );
}