'use client';

import { useEffect, useState } from 'react';
import { jsPDF } from 'jspdf';
import styles from './styles.module.css';
import Navbar from '../components/Navbar';

interface Offre {
  id: number;
  nom: string;
  description: string;
  prix: number;
  capacite: number;
  date_heure: string;
}

interface Billet {
  billet_id: number;
  qr_code_base64: string;
}

interface ReservationResult {
  reservation_id: number;
  message: string;
  billets: Billet[];
}

export default function Offres() {
  const [offres, setOffres] = useState<Offre[]>([]);
  const [panier, setPanier] = useState<Offre[]>([]);
  const [total, setTotal] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    fetch('http://127.0.0.1:5000/offres')
      .then(res => res.json())
      .then((data: Offre[]) => setOffres(data))
      .catch(err => console.error('Erreur :', err));

    const savedPanier = localStorage.getItem('panier');
    if (savedPanier) {
      const parsedPanier: Offre[] = JSON.parse(savedPanier);
      setPanier(parsedPanier);
      const somme = parsedPanier.reduce((sum, item) => sum + Number(item.prix), 0);
      setTotal(somme);
    }

    const uid = localStorage.getItem('userId');
    const urole = localStorage.getItem('role');
    setUserId(uid);
    setRole(urole);
  }, []);

  const ajouterAuPanier = (offre: Offre) => {
    if (!panier.some(i => i.id === offre.id)) {
      const nouvelPanier = [...panier, offre];
      setPanier(nouvelPanier);
      localStorage.setItem('panier', JSON.stringify(nouvelPanier));
      setTotal(prev => prev + Number(offre.prix));

      // ✅ Affichage d'un message de confirmation
      alert("✅ L'offre a été ajoutée à votre panier !");
    } else {
      alert("⚠️ Cette offre est déjà dans votre panier.");
    }
  };

  const retirerDuPanier = (id: number) => {
    const nouvelleListe = panier.filter(a => a.id !== id);
    setPanier(nouvelleListe);
    localStorage.setItem('panier', JSON.stringify(nouvelleListe));
    const article = panier.find(a => a.id === id);
    if (article) {
      setTotal(prev => prev - Number(article.prix));
    }
  };

  return (
    <>
      <Navbar />

      <h1 className={styles.pageTitle}>Achetez vos E-tickets pour les Jeux Olympiques</h1>

      <section className={styles.offreGrid}>
        {offres.map((offre) => (
          <div key={offre.id} className={styles.offreCard}>
            <h2 className={styles.offreNom}>{offre.nom}</h2>
            <p className={styles.offreDesc}>{offre.description}</p>
            <p className={styles.offreDate}>Date : {offre.date_heure}</p>
            <p className={styles.offrePrice}>Prix : {offre.prix} €</p>
            <p className={styles.offreCapacite}>Capacité : {offre.capacite}</p>
            <button
              className={`${styles.btn} ${styles['btn-primary']}`}
              onClick={() => {
                const roleActuel = localStorage.getItem('role');
                if (!roleActuel || roleActuel !== 'client') {
                  if (confirm("Vous devez être connecté en tant que client pour réserver. Connectez-vous ou inscrivez-vous.")) {
                    window.location.href = '/connexion';
                  }
                  return;
                }
                ajouterAuPanier(offre);
              }}
            >
              Acheter Ticket
            </button>
          </div>
        ))}
      </section>

      <section className={styles.panierSection} style={{ marginTop: '100px' }}>
        <h2 className={styles.sectionTitle}>Votre Panier</h2>
        {panier.length === 0 ? (
          <p className={styles.emptyMessage}>Votre panier est vide.</p>
        ) : (
          <>
            <ul className={styles.panierList}>
              {panier.map((article) => (
                <li key={article.id} className={styles.panierItem}>
                  <div>
                    <strong>{article.nom}</strong> — {Number(article.prix).toFixed(2)} €
                  </div>
                  <button
                    className={styles.btnRetirer}
                    onClick={() => retirerDuPanier(article.id)}
                  >
                    Retirer
                  </button>
                </li>
              ))}
            </ul>
            <div className={styles.total}>Total : {Number(total).toFixed(2)} €</div>
            <button className={styles.btnValider}>Valider la Réservation</button>
          </>
        )}
      </section>
    </>
  );
}