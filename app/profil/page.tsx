'use client';

import { useEffect, useState } from 'react';
import { jsPDF } from "jspdf"; // Import de jsPDF pour la génération du PDF
import './styles.css';

export default function Profil() {
  const [user, setUser] = useState<{ id: number; nom: string; email: string } | null>(null);
  const [reservations, setReservations] = useState<any[]>([]);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('role');

    if (!userId || !userRole) {
      alert("Vous n'êtes pas connecté !");
      window.location.href = '/connexion';
      return;
    }

    setRole(userRole);

    // Récupérer les infos utilisateur
    fetch(`http://127.0.0.1:5000/utilisateur/${userId}`)
      .then(res => res.json())
      .then(data => {
        setUser(data);
        setLoading(false);
      })
      .catch(() => {
        alert("Erreur de chargement du profil");
        setLoading(false);
      });

    // Récupérer les réservations de l'utilisateur
    fetch(`http://127.0.0.1:5000/utilisateur/${userId}/reservations`)
      .then(res => res.json())
      .then(data => setReservations(data))
      .catch(() => {
        alert("Erreur de chargement des réservations");
      });
  }, []);

  const handleDeconnexion = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('role');
    // Suppression d'autres clés éventuellement utilisées, par exemple 'tickets'
    window.location.href = '/';
  };

  // Fonction qui génère un PDF rassemblant les e-tickets à partir des réservations
  const downloadPDF = () => {
    if (reservations.length === 0) {
      alert("Aucune réservation disponible pour générer le PDF.");
      return;
    }
    const doc = new jsPDF();
    let yPos = 10;

    doc.setFontSize(16);
    doc.text("Vos e-tickets", 10, yPos);
    yPos += 10;

    reservations.forEach((reservation, index) => {
      doc.setFontSize(14);
      doc.text(`Réservation #${reservation.id}`, 10, yPos);
      yPos += 8;
      doc.setFontSize(12);
      doc.text(`Date d'achat : ${reservation.date_achat}`, 10, yPos);
      yPos += 8;
      doc.text(`Statut : ${reservation.statut}`, 10, yPos);
      yPos += 8;
      doc.text(`Offre : ${reservation.offre}`, 10, yPos);
      yPos += 8;

      if (reservation.billets && reservation.billets.length > 0) {
        reservation.billets.forEach((billet: any) => {
          // S'assurer que le QR code soit au format "data:image/png;base64,..."
          let imgData = billet.qr_code;
          if (!imgData.startsWith("data:image/png;base64,")) {
            imgData = "data:image/png;base64," + imgData;
          }
          // Ajout du QR code dans le PDF (dimensions 50x50)
          doc.addImage(imgData, "PNG", 10, yPos, 50, 50);
          yPos += 60;
          if (yPos > 250) {
            doc.addPage();
            yPos = 10;
          }
        });
      }
      yPos += 10;
      if (yPos > 250) {
        doc.addPage();
        yPos = 10;
      }
    });
    doc.save("etickets.pdf");
  };

  if (loading) return <p>Chargement...</p>;

  if (!role || (role !== 'client' && role !== 'employe' && role !== 'admin')) {
    return <p>Accès non autorisé</p>;
  }

  return (
    <div className="page-container">
      <div style={{ paddingTop: '80px' }}>
        <h1 className="pageTitle">Mon profil</h1>

        {/* Infos utilisateur */}
        {user && (
          <>
            <p><strong>Nom : </strong>{user.nom}</p>
            <p><strong>Email : </strong>{user.email}</p>
          </>
        )}

        {/* Message en fonction du rôle */}
        {role === 'client' && <p>Bienvenue, Client !</p>}
        {role === 'employe' && <p>Vous êtes Employé, gestion des réservations</p>}
        {role === 'admin' && <p>Administrateur, accès complet</p>}

        {/* Affichage des réservations */}
        <h2>Réservations</h2>
        {reservations.length === 0 ? (
          <p style={{ textAlign: 'center', marginTop: '20px' }}>Aucune réservation</p>
        ) : (
          <p style={{ textAlign: 'center', marginTop: '20px' }}>
            Vous avez {reservations.length} réservation(s).
          </p>
        )}

        {/* Bouton pour télécharger les e-tickets en un PDF (uniquement pour les clients) */}
        {role === 'client' && (
          <div style={{ marginTop: '30px', textAlign: 'center' }}>
            <button className="button" onClick={downloadPDF}>
              Télécharger vos e-tickets (PDF)
            </button>
          </div>
        )}

        {role === 'employe' && (
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <button className="button" onClick={() => window.location.href = '/employe'}>
              Scanner
            </button>
          </div>
        )}

        {role === 'admin' && (
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <button className="button" onClick={() => window.location.href = '/admin'}>
              Gérer
            </button>
          </div>
        )}

        <p style={{ textAlign: 'center', marginTop: '20px' }}>Olympique 2024</p>

        {/* Bouton de déconnexion */}
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button className="button" onClick={handleDeconnexion}>
            Déconnexion
          </button>
        </div>
      </div>
    </div>
  );
}