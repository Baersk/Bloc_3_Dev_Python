'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import './styles.css';

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function Connexion() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleSubmit = async () => {
    try {
      // 🔎 Vérification des identifiants dans la table `utilisateurs`
      const { data, error } = await supabase
        .from('utilisateurs')
        .select('id, role')
        .eq('email', email)
        .eq('mot_de_passe', password) // ⚠️ DOIT ÊTRE HASHÉ en base de données !
        .single();

      if (error || !data) {
        alert('❌ Identifiants invalides');
        return;
      }

      // 📌 Stocker l’utilisateur en local
      localStorage.setItem('userId', data.id);
      localStorage.setItem('role', data.role);

      // 🔄 Redirection après connexion
      const searchParams = new URLSearchParams(window.location.search);
      const redirect = searchParams.get('redirect') || '/';
      router.push(redirect);
    } catch (err) {
      alert('❌ Erreur lors de la connexion');
      console.error(err);
    }
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
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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