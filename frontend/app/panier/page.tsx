'use client';

import { useEffect, useState } from 'react';
import { jsPDF } from 'jspdf';
import { createClient } from '@supabase/supabase-js';
import './styles.css';

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Article {
  id: number;
  nom: string;
  prix: number;
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

export default function Panier() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const storedArticles = localStorage.getItem('panier');
    if (storedArticles) {
      const parsed: Article[] = JSON.parse(storedArticles);
      setArticles(parsed);
      const sum = parsed.reduce((acc, curr) => acc + Number(curr.prix), 0);
      setTotal(sum);
    }
    const uid = localStorage.getItem('userId');
    setUserId(uid);
  }, []);

  const retirerArticle = (id: number) => {
    const nouvelleListe = articles.filter((a) => a.id !== id);
    setArticles(nouvelleListe);
    localStorage.setItem('panier', JSON.stringify(nouvelleListe));
    const article = articles.find((a) => a.id === id);
    if (article) {
      setTotal((prev) => prev - Number(article.prix));
    }
  };

  const validerReservation = async () => {
    if (articles.length === 0) {
      alert('Votre panier est vide.');
      return;
    }
    if (!userId) {
      if (confirm('Vous devez être connecté pour réserver. Voulez-vous vous connecter ?')) {
        window.location.href = '/connexion';
      }
      return;
    }
    try {
      const reservationsResults: ReservationResult[] = [];

      for (const article of articles) {
        const { data, error } = await supabase.from('reservations').insert([
          { utilisateur_id: userId, offre_id: article.id, date_heure_event: article.date_heure, nombre_billets: 1 },
        ]).select('*').single();

        if (error) {
          throw new Error(error.message);
        }

        reservationsResults.push(data);
      }

      alert('Réservation confirmée ! Retrouvez vos billets dans votre profil.');
      setArticles([]);
      localStorage.removeItem('panier');
      setTotal(0);
      window.location.href = '/profil';

    } catch (err: any) {
      alert('Erreur lors de la validation de la réservation: ' + err.message);
    }
  };

  return (
    <div className="page-container">
      <h1>Votre Panier</h1>
      {articles.length === 0 ? (
        <p>Votre panier est vide.</p>
      ) : (
        <>
          <ul>
            {articles.map((a) => (
              <li key={a.id} className="panier-item">
                <div>
                  <strong>{a.nom}</strong> — {Number(a.prix).toFixed(2)} €
                </div>
                <button onClick={() => retirerArticle(a.id)}>Retirer</button>
              </li>
            ))}
          </ul>

          <h2 className="total-price">Total : {Number(total).toFixed(2)} €</h2>
          <button className="btn-valid" onClick={validerReservation}>Valider la réservation</button>
        </>
      )}
    </div>
  );
}