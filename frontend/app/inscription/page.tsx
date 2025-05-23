'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import './styles.css';

// Configuration de Supabase (assure-toi que NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY sont définis)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function Inscription() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Création de l'utilisateur via Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: password,
    });

    if (error) {
      setErrorMsg(error.message);
    } else if (data.user) {
      // Insertion dans la table profiles avec le rôle par défaut "client"
      const { error: profileError } = await supabase.from('profiles').insert([
        {
          id: data.user.id,
          role: 'client',
        },
      ]);

      if (profileError) {
        setErrorMsg(profileError.message);
      } else {
        // Redirection vers la page de connexion après inscription réussie
        router.push('/connexion');
      }
    }
  };

  return (
    <div className="form-container">
      <h2>Créez votre compte</h2>
      <form onSubmit={handleSignup}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">S’inscrire</button>
      </form>
      {errorMsg && (
        <div className="message" style={{ color: 'red' }}>
          {errorMsg}
        </div>
      )}
    </div>
  );
}