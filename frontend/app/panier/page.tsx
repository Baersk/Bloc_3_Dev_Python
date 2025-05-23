'use client';

import { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import './styles.css';

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
    const storedArticles = localStorage.getItem("panier");
    if (storedArticles) {
      const parsed: Article[] = JSON.parse(storedArticles);
      setArticles(parsed);
      const sum = parsed.reduce((acc, curr) => acc + Number(curr.prix), 0);
      setTotal(sum);
    }
    const uid = localStorage.getItem("userId");
    setUserId(uid);
  }, []);

  const retirerArticle = (id: number) => {
    const nouvelleListe = articles.filter((a) => a.id !== id);
    setArticles(nouvelleListe);
    localStorage.setItem("panier", JSON.stringify(nouvelleListe));
    const article = articles.find((a) => a.id === id);
    if (article) {
      setTotal((prev) => prev - Number(article.prix));
    }
  };

  const formattedTotal = Number(total).toFixed(2) + " €";

  const createPDF = (reservationsResults: ReservationResult[]) => {
    const doc = new jsPDF();
    let yPosition = 10;
    doc.setFontSize(16);
    doc.text("Vos E-tickets pour les Jeux Olympiques", 10, yPosition);
    yPosition += 10;

    reservationsResults.forEach((reservation, index) => {
      doc.setFontSize(14);
      doc.text(`Réservation ${index + 1} - ID: ${reservation.reservation_id}`, 10, yPosition);
      yPosition += 8;
      doc.setFontSize(12);
      doc.text(reservation.message, 10, yPosition);
      yPosition += 8;
      reservation.billets.forEach((billet) => {
        const qrImg = "data:image/png;base64," + billet.qr_code_base64;
        doc.addImage(qrImg, "PNG", 10, yPosition, 50, 50);
        yPosition += 60;
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 10;
        }
      });
      yPosition += 10;
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 10;
      }
    });

    doc.save("etickets.pdf");
  };

  const validerReservation = async () => {
    if (articles.length === 0) {
      alert("Votre panier est vide.");
      return;
    }
    if (!userId) {
      if (confirm("Vous devez être connecté pour réserver. Voulez-vous vous connecter ?")) {
        window.location.href = '/connexion';
      }
      return;
    }
    try {
      const reservationsResults: ReservationResult[] = [];

      for (const article of articles) {
        const data = {
          utilisateur_id: userId,
          offre_id: article.id,
          date_heure_event: article.date_heure,
          nombre_billets: 1
        };
        const res = await fetch("http://127.0.0.1:5000/reserver", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        });
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || "Erreur lors de la réservation");
        }
        reservationsResults.push(json);
      }

      createPDF(reservationsResults);
      alert("Réservation confirmée ! Retrouvez vos billets dans votre profil.");

      setArticles([]);
      localStorage.removeItem("panier");
      setTotal(0);

      window.location.href = '/profil';

    } catch (err: any) {
      alert("Erreur lors de la validation de la réservation: " + err.message);
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

          <h2 style={{
            fontSize: '2.5em',
            fontWeight: 'bold',
            color: '#0077cc',
            textAlign: 'center',
            margin: '20px 0'
          }}>
            Total : {formattedTotal}
          </h2>

          <button className="btn-valid" onClick={validerReservation}>Valider la réservation</button>
        </>
      )}
    </div>
  );
}