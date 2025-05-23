'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import './styles.css';

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function Employe() {
  const [codeScan, setCodeScan] = useState('');
  const [validationMessage, setValidationMessage] = useState('');
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkUserRole() {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        alert('Accès non autorisé');
        window.location.href = '/connexion';
        return;
      }

      const { data: userData, error } = await supabase
        .from('utilisateurs')
        .select('role')
        .eq('email', data.session.user.email)
        .single();

      if (error || userData?.role !== 'employe') {
        alert('Accès non autorisé');
        window.location.href = '/connexion';
        return;
      }

      setRole(userData.role);
      setLoading(false);
    }

    checkUserRole();
  }, []);

  const verifierBillet = async () => {
    if (!codeScan.trim()) {
      setValidationMessage('❌ Veuillez entrer un QR Code.');
      return;
    }

    const { data, error } = await supabase
      .from('billets')
      .select('valide, message')
      .eq('qr_code_base64', codeScan)
      .single();

    if (error) {
      setValidationMessage('❌ Erreur lors de la vérification.');
      return;
    }

    if (data?.valide) {
      setValidationMessage(`✅ Billet Valide : ${data.message}`);
    } else {
      setValidationMessage(`❌ Billet Non Valide : ${data?.message || 'Billet inconnu'}`);
    }
  };

  if (loading) return <p>Chargement...</p>;
  if (role !== 'employe') return <p>Accès non autorisé</p>;

  return (
    <div className="page-container">
      <h1>Scanner et Vérification des billets</h1>

      <input
        type="text"
        placeholder="Entrer le QR Code du billet"
        value={codeScan}
        onChange={(e) => setCodeScan(e.target.value)}
        className="input-field"
      />

      <button onClick={verifierBillet} className="btn">
        Vérifier
      </button>

      {validationMessage && (
        <div className={`message ${validationMessage.includes('✅') ? 'message-success' : 'message-error'}`}>
          {validationMessage}
        </div>
      )}
    </div>
  );
}