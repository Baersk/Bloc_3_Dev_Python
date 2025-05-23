'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
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
      // 🔎 Récupérer l'utilisateur et le mot de passe hashé
      const { data, error } = await supabase
        .from('utilisateurs')
        .select('id, role, mot_de_passe')
        .eq('email', email)
        .single();

      if (!data || error) {
        alert('❌ Identifiants invalides');
        return;
      }

      // ✅ Comparer le mot de passe entré avec le hash en base
      const passwordMatch = await bcrypt.compare(password, data.mot_de_passe);
      if (!passwordMatch) {
        alert('❌ Mot de passe incorrect');
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