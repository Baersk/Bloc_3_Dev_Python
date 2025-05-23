'use client';

import { useEffect, useState } from 'react';
import './styles.css';

interface Offre {
  id: number;
  nom: string;
  description: string;
  prix: number;
  capacite: number;
}

export default function Admin() {
  // gestion offres
  const [offres, setOffres] = useState<Offre[]>([]);
  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');
  const [prix, setPrix] = useState(0);
  const [capacite, setCapacite] = useState(1);
  const [message, setMessage] = useState('');

  // gestion utilisateurs (employés)
  const [utilisateurs, setUtilisateurs] = useState<any[]>([]);
  const [nomEmploye, setNomEmploye] = useState('');
  const [prenomEmploye, setPrenomEmploye] = useState('');
  const [emailEmploye, setEmailEmploye] = useState('');
  const [passwordEmploye, setPasswordEmploye] = useState('');
  const [msgEmploye, setMsgEmploye] = useState('');

  // Charger offres
  const fetchOffres = () => {
    fetch('http://127.0.0.1:5000/offres')
      .then(res => res.json())
      .then((data: Offre[]) => setOffres(data))
      .catch(err => console.error('Erreur fetching offres:', err));
  };

  // Charger utilisateurs
  const fetchUtilisateurs = () => {
    fetch('http://127.0.0.1:5000/utilisateurs')
      .then(res => res.json())
      .then(data => {
        const employes = data.filter((u: any) => u.role === 'employe');
        setUtilisateurs(employes);
      })
      .catch(e => console.error('Erreur fetch utilisateurs:', e));
  };

  // Effet initial
  useEffect(() => {
    const role = localStorage.getItem('role');
    if (role !== 'admin') {
      alert('Accès non autorisé');
      window.location.href = '/';
      return;
    }
    fetchOffres();
    fetchUtilisateurs();
  }, []);

  // Gérer la suppression d'une offre
  const handleSupprimerOffre = (id: number) => {
    fetch(`http://127.0.0.1:5000/offres/${id}`, { method: 'DELETE' })
      .then(res => {
        if (res.ok) {
          setMessage('🔴 Offre supprimée');
          fetchOffres();
        } else {
          setMessage('🔴 Erreur lors de la suppression');
        }
      })
      .catch(() => setMessage('🔴 Erreur réseau'));
  };

  // Ajouter une offre
  const handleAjouterOffre = () => {
    fetch('http://127.0.0.1:5000/offres', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nom, description, prix, capacite }),
    })
      .then(res => res.json())
      .then(data => {
        setMessage('🟢 Offre ajoutée avec succès');
        fetchOffres();
        setNom('');
        setDescription('');
        setPrix(0);
        setCapacite(1);
      })
      .catch(() => setMessage('🔴 Erreur lors de l\'ajout'));
  };

  // Gestion des employés
  const handleSupprimerUtilisateur = (userId: number) => {
    fetch(`http://127.0.0.1:5000/utilisateur/${userId}`, { method: 'DELETE' })
      .then(res => {
        if (res.ok) {
          setMsgEmploye(`Utilisateur ${userId} supprimé`);
          fetchUtilisateurs();
        } else {
          setMsgEmploye('Erreur lors de la suppression');
        }
      })
      .catch(() => setMsgEmploye('Erreur réseau'));
  };

  const handleAjoutEmploye = () => {
    fetch('http://127.0.0.1:5000/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
        nom: nomEmploye,
        prenom: prenomEmploye,
        email: emailEmploye,
        mot_de_passe: passwordEmploye,
        role: 'employe'
      }),
    })
    .then(res => res.json())
    .then(data => {
      if (data.user_id) {
        setMsgEmploye('Employé ajouté avec succès');
        fetchUtilisateurs();
        setNomEmploye('');
        setPrenomEmploye('');
        setEmailEmploye('');
        setPasswordEmploye('');
      } else {
        setMsgEmploye('Erreur : ' + (data.error || ''));
      }
    })
    .catch(() => setMsgEmploye('Erreur réseau'));
  };

  return (
    <div className="page-container">

      {/* Gestion Offres */}
      <h1 className="page-header">🛠️ Gestion Admin des Offres</h1>
      
      <section className="section">
        <h2>Liste des offres</h2>
        {offres.length === 0 ? (
          <p>Aucune offre disponible.</p>
        ) : (
          offres.map((offre) => (
            <div key={offre.id} className="offre-item">
              <div className="offre-details">
                <h3 className="offre-title">{offre.nom}</h3>
                <p className="offre-desc">{offre.description}</p>
                <small className="offre-info">
                  Prix : {offre.prix} € | Capacité : {offre.capacite}
                </small>
              </div>
              <button
                className="btn btn-delete"
                onClick={() => handleSupprimerOffre(offre.id)}
              >
                Supprimer
              </button>
            </div>
          ))
        )}
      </section>

      {/* Formulaire ajout offre */}
      <section className="section">
        <h2>📝 Ajouter une nouvelle offre</h2>
        <div className="form-container">
          <input
            className="input-field"
            placeholder="Nom"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
          />
          <textarea
            className="input-field"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <input
            className="input-field"
            type="number"
            placeholder="Prix (€)"
            value={prix}
            onChange={(e) => setPrix(parseFloat(e.target.value))}
          />
          <input
            className="input-field"
            type="number"
            placeholder="Capacité"
            value={capacite}
            onChange={(e) => setCapacite(parseInt(e.target.value))}
          />
          <button className="btn btn-add" onClick={handleAjouterOffre}>
            Ajouter Offre
          </button>
          {message && (
            <p className={`message ${message.startsWith('🟢') ? 'message-success' : 'message-error'}`}>
              {message}
            </p>
          )}
        </div>
      </section>

      {/* Liste des employés */}
      <h2>Liste des Employés</h2>
      {utilisateurs.length === 0 ? (
        <p>Aucun employé.</p>
      ) : (
        utilisateurs.map((u) => (
          <div key={u.id} className="user-item">
            <p>
              {u.nom} {u.prenom} - {u.email}
            </p>
            <button
              className="btn btn-delete"
              onClick={() => handleSupprimerUtilisateur(u.id)}
            >
              Supprimer
            </button>
          </div>
        ))
      )}

      {/* Formulaire ajout employé */}
      <h2>📝 Ajouter un Employé</h2>
      <div className="form-container">
        <input
          className="input-field"
          placeholder="Nom"
          value={nomEmploye}
          onChange={(e) => setNomEmploye(e.target.value)}
        />
        <input
          className="input-field"
          placeholder="Prénom"
          value={prenomEmploye}
          onChange={(e) => setPrenomEmploye(e.target.value)}
        />
        <input
          className="input-field"
          placeholder="Email"
          type="email"
          value={emailEmploye}
          onChange={(e) => setEmailEmploye(e.target.value)}
        />
        <input
          className="input-field"
          placeholder="Mot de passe"
          type="password"
          value={passwordEmploye}
          onChange={(e) => setPasswordEmploye(e.target.value)}
        />
        <button className="btn btn-add" onClick={handleAjoutEmploye}>
          Ajouter Employé
        </button>
        {msgEmploye && <p className="message">{msgEmploye}</p>}
      </div>
    </div>
 );
}