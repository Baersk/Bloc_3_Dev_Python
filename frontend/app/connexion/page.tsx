'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import './styles.css';

// Configuration de Supabase : assurez-vous que NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY sont définis
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

    // Utilisation de la méthode signInWithPassword de Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password,
    });

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    if (data.session) {
      // On stocke la session (optionnel)
      localStorage.setItem('supabase.auth.token', JSON.stringify(data.session));

      // Récupération de l'ID de l'utilisateur provenant de Supabase Auth
      const userId = data.session.user.id;
      localStorage.setItem('userId', userId);

      // On interroge désormais la table 'utilisateurs' pour obtenir le rôle, etc.
      const { data: utilisateurData, error: utilisateurError } = await supabase
        .from('utilisateurs')
        .select('role')
        .eq('id', userId)
        .single();

      if (utilisateurError) {
        setErrorMsg(utilisateurError.message);
        return;
      } else {
        localStorage.setItem('role', utilisateurData.role);
      }

      // Redirection vers la page d'accueil ou un dashboard
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