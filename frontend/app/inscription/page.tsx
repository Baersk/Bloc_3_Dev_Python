'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import './styles.css';

// Configuration Supabase : assurez-vous que NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY sont définis
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
      return;
    }

    if (data.user) {
      // Insertion dans la table utilisateurs en utilisant l'ID généré par Supabase Auth.
      // Les colonnes 'nom', 'prenom' et 'clef_utilisateur' sont ici renseignées avec une valeur par défaut.
      const { error: utilisateurError } = await supabase.from('utilisateurs').insert([
        {
          id: data.user.id,               // L’identifiant de Supabase Auth
          email: email.trim(),            // L'email inscrit
          nom: '',                        // Par défaut vide, à compléter selon vos besoins
          prenom: '',                     // Par défaut vide
          clef_utilisateur: '',           // Par défaut vide (vous pouvez générer une clé unique si souhaité)
          role: 'client',                 // Rôle par défaut
        },
      ]);

      if (utilisateurError) {
        setErrorMsg(utilisateurError.message);
        return;
      }

      // Redirection vers la page de connexion après une inscription réussie
      router.push('/connexion');
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