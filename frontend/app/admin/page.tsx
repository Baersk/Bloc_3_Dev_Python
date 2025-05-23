'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import './styles.css';

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Offre {
  id: number;
  nom: string;
  description: string;
  prix: number;
  capacite: number;
}

interface Utilisateur {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: string;
}

export default function Admin() {
  // Gestion des offres
  const [offres, setOffres] = useState<Offre[]>([]);
  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');
  const [prix, setPrix] = useState(0);
  const [capacite, setCapacite] = useState(1);
  const [message, setMessage] = useState('');

  // Gestion des utilisateurs (employés)
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([]);
  const [nomEmploye, setNomEmploye] = useState('');
  const [prenomEmploye, setPrenomEmploye] = useState('');
  const [emailEmploye, setEmailEmploye] = useState('');
  const [passwordEmploye, setPasswordEmploye] = useState('');
  const [msgEmploye, setMsgEmploye] = useState('');

  // Charger les offres
  const fetchOffres = async () => {
    const { data, error } = await supabase.from('offres').select('*');
    if (error) {
      console.error('Erreur fetching offres:', error);
    } else {
      setOffres(data);
    }
  };

  // Charger les utilisateurs (employés)
  const fetchUtilisateurs = async () => {
    const { data, error } = await supabase.from('utilisateurs').select('*');
    if (error) {
      console.error('Erreur fetching utilisateurs:', error);
    } else {
      const employes = data.filter((u: any) => u.role === 'employe');
      setUtilisateurs(employes);
    }
  };

  // Effet initial : vérification de l'accès admin
  useEffect(() => {
    const storedRole = localStorage.getItem('role') || '';
    console.log('Role from localStorage:', storedRole); // Vérifie le rôle dans la console

    if (storedRole.trim().toLowerCase() !== 'admin') {
      alert('Accès non autorisé');
      window.location.href = '/';
      return;
    }
    fetchOffres();
    fetchUtilisateurs();
  }, []);

  // Gérer la suppression d'une offre
  const handleSupprimerOffre = async (id: number) => {
    const { error } = await supabase.from('offres').delete().match({ id });
    if (!error) {
      setMessage('🔴 Offre supprimée');
      fetchOffres();
    } else {
      setMessage('🔴 Erreur lors de la suppression');
    }
  };

  // Ajouter une offre
  const handleAjouterOffre = async () => {
    const { error } = await supabase.from('offres').insert([
      { nom, description, prix, capacite },
    ]);
    if (!error) {
      setMessage('🟢 Offre ajoutée avec succès');
      fetchOffres();
      setNom('');
      setDescription('');
      setPrix(0);
      setCapacite(1);
    } else {
      setMessage("🔴 Erreur lors de l'ajout");
    }
  };

  // Gérer la suppression d'un utilisateur
  const handleSupprimerUtilisateur = async (userId: number) => {
    const { error } = await supabase.from('utilisateurs').delete().match({ id: userId });
    if (!error) {
      setMsgEmploye(`Utilisateur ${userId} supprimé`);
      fetchUtilisateurs();
    } else {
      setMsgEmploye('Erreur lors de la suppression');
    }
  };

  // Ajouter un employé
  const handleAjoutEmploye = async () => {
    const { error } = await supabase.from('utilisateurs').insert([
      { nom: nomEmploye, prenom: prenomEmploye, email: emailEmploye, role: 'employe' },
    ]);
    if (!error) {
      setMsgEmploye('Employé ajouté avec succès');
      fetchUtilisateurs();
      setNomEmploye('');
      setPrenomEmploye('');
      setEmailEmploye('');
      setPasswordEmploye('');
    } else {
      setMsgEmploye("🔴 Erreur lors de l'ajout");
    }
  };

  return (
    <div className="page-container">
      <h1 className="page-header">🛠️ Gestion Admin des Offres</h1>

      {/* Gestion des offres */}
      <section className="section">
        <h2>Liste des offres</h2>
        {offres.length === 0 ? (
          <p>Aucune offre disponible.</p>
        ) : (
          offres.map((offre) => (
            <div key={offre.id} className="offre-item">
              <h3 className="offre-title">{offre.nom}</h3>
              <p className="offre-desc">{offre.description}</p>
              <small className="offre-info">
                Prix : {offre.prix} € | Capacité : {offre.capacite}
              </small>
              <button className="btn btn-delete" onClick={() => handleSupprimerOffre(offre.id)}>
                Supprimer
              </button>
            </div>
          ))
        )}
      </section>

      {/* Formulaire ajout offre */}
      <section className="section">
        <h2>📝 Ajouter une offre</h2>
        <input className="input-field" placeholder="Nom" value={nom} onChange={(e) => setNom(e.target.value)} />
        <textarea className="input-field" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
        <input className="input-field" type="number" placeholder="Prix (€)" value={prix} onChange={(e) => setPrix(parseFloat(e.target.value))} />
        <input className="input-field" type="number" placeholder="Capacité" value={capacite} onChange={(e) => setCapacite(parseInt(e.target.value))} />
        <button className="btn btn-add" onClick={handleAjouterOffre}>
          Ajouter Offre
        </button>
        {message && <p className="message">{message}</p>}
      </section>

      {/* Gestion des employés */}
      <h2>Liste des Employés</h2>
      {utilisateurs.map((u) => (
        <div key={u.id} className="user-item">
          <p>
            {u.nom} {u.prenom} - {u.email}
          </p>
          <button className="btn btn-delete" onClick={() => handleSupprimerUtilisateur(u.id)}>
            Supprimer
          </button>
        </div>
      ))}

      <h2>📝 Ajouter un Employé</h2>
      <input className="input-field" placeholder="Nom" value={nomEmploye} onChange={(e) => setNomEmploye(e.target.value)} />
      <input className="input-field" placeholder="Prénom" value={prenomEmploye} onChange={(e) => setPrenomEmploye(e.target.value)} />
      <input className="input-field" placeholder="Email" value={emailEmploye} onChange={(e) => setEmailEmploye(e.target.value)} />
      <button className="btn btn-add" onClick={handleAjoutEmploye}>
        Ajouter Employé
      </button>
      {msgEmploye && <p className="message">{msgEmploye}</p>}
    </div>
  );
}