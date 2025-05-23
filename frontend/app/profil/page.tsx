'use client';

import { useEffect, useState } from 'react';
import { jsPDF } from "jspdf";
import { createClient } from '@supabase/supabase-js';
import './styles.css';

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function Profil() {
  const [user, setUser] = useState<{ id: number; nom: string; email: string } | null>(null);
  const [reservations, setReservations] = useState<any[]>([]);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserData() {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        alert("Vous n'êtes pas connecté !");
        window.location.href = '/connexion';
        return;
      }

      const userEmail = sessionData.session.user.email;
      
      const { data: userData } = await supabase
        .from('utilisateurs')
        .select('id, nom, email, role')
        .eq('email', userEmail)
        .single();

      if (userData) {
        setUser(userData);
        setRole(userData.role);
      } else {
        alert("Erreur de chargement du profil");
      }
      
      const { data: reservationsData } = await supabase
        .from('reservations')
        .select('*')
        .eq('utilisateur_id', userData?.id);

      if (reservationsData) {
        setReservations(reservationsData);
      }

      setLoading(false);
    }

    fetchUserData();
  }, []);

  const handleDeconnexion = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('userId');
    localStorage.removeItem('role');
    window.location.href = '/';
  };

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
    });

    doc.save("etickets.pdf");
  };

  if (loading) return <p>Chargement...</p>;
  if (!role) return <p>Accès non autorisé</p>;

  return (
    <div className="page-container">
      <h1>Mon profil</h1>
      {user && (
        <>
          <p><strong>Nom : </strong>{user.nom}</p>
          <p><strong>Email : </strong>{user.email}</p>
        </>
      )}
      <h2>Réservations</h2>
      {reservations.length === 0 ? <p>Aucune réservation</p> : <p>{reservations.length} réservation(s).</p>}
      {role === 'client' && <button className="button" onClick={downloadPDF}>Télécharger vos e-tickets (PDF)</button>}
      <button className="button" onClick={handleDeconnexion}>Déconnexion</button>
    </div>
  );
}