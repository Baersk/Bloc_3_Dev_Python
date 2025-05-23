'use client';

import { useState, useEffect } from 'react';
import './styles.css';

export default function Employe() {
  const [codeScan, setCodeScan] = useState('');
  const [validationMessage, setValidationMessage] = useState('');
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const roleLocal = localStorage.getItem('role');
    if (roleLocal !== 'employe') {
      alert("Accès non autorisé");
      window.location.href = '/connexion'; // ou autre page
      return;
    }
    setRole(roleLocal);
    setLoading(false);
  }, []);

  const verifierBillet = () => {
    // On envoie le code saisi sous "qr_code" dans le corps de la requête.
    // Pour le test, assure-toi d'entrer la clef_finale (généralement une chaîne UUID)
    fetch(`http://127.0.0.1:5000/verifier-billet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qr_code: codeScan }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.valide) {
          setValidationMessage('✅ Billet Valide : ' + data.message);
        } else {
          setValidationMessage('❌ Billet Non Valide : ' + data.message);
        }
      })
      .catch(() => {
        setValidationMessage('Erreur de vérification.');
      });
  };

  if (loading) return <p>Chargement...</p>;

  if (role !== 'employe') return <p>Accès non autorisé</p>;

  return (
    <div className="page-container">
      <h1>Scanner et Vérification des billets</h1>
      
      {/* Champ de saisie pour scanner */}
      <input
        type="text"
        placeholder="Entrer la clef finale du billet"
        value={codeScan}
        onChange={(e) => setCodeScan(e.target.value)}
        style={{ width: '80%', padding: '10px', fontSize: '1em', marginBottom: '10px' }}
      />
      
      {/* Bouton Vérifier */}
      <button
        onClick={verifierBillet}
        style={{
          padding: '10px 20px',
          backgroundColor: '#3498db',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Vérifier
      </button>
      
      {/* Message de résultat */}
      {validationMessage && (
        <div style={{ marginTop: '20px', fontSize: '1.2em' }}>
          {validationMessage}
        </div>
      )}
    </div>
  );
}