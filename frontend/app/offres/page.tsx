'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import styles from './styles.module.css';
import Navbar from '../components/Navbar';

interface Offre {
  id: number;
  nom: string;
  description: string;
  prix: number;
  capacite: number;
  calendrier_evenements: { date_heure_event: string }[]; // ✅ Récupération des événements liés
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function Offres() {
  const [offres, setOffres] = useState<Offre[]>([]);
  const [panier, setPanier] = useState<Offre[]>([]);
  const [total, setTotal] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOffres() {
      const { data, error } = await supabase
        .from("offres")
        .select("id, nom, description, prix, capacite, calendrier_evenements (date_heure_event)");

      if (error) {
        console.error("❌ Erreur lors de la récupération des offres:", error);
        return;
      }

      console.log("✅ Offres récupérées :", data);
      setOffres(data);
    }

    fetchOffres();
  }, []);

  return (
    <>
      <Navbar />

      <h1 className={styles.pageTitle}>Achetez vos E-tickets pour les Jeux Olympiques</h1>

      <section className={styles.offreGrid}>
        {offres.map((offre) => (
          <div key={offre.id} className={styles.offreCard}>
            <h2 className={styles.offreNom}>{offre.nom}</h2>
            <p className={styles.offreDesc}>{offre.description}</p>
            <p className={styles.offreDate}>
              📅 Date : {offre.calendrier_evenements?.[0]?.date_heure_event || "À venir"}
            </p>
            <p className={styles.offrePrice}>💰 Prix : {offre.prix} €</p>
            <p className={styles.offreCapacite}>👥 Capacité : {offre.capacite}</p>
          </div>
        ))}
      </section>
    </>
  );
}