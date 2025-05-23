'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

const linkStyle: React.CSSProperties = {
  color: 'white',
  textDecoration: 'none',
  fontWeight: 'bold',
  padding: '8px 12px',
  borderRadius: '4px',
  transition: 'background-color 0.3s',
  cursor: 'pointer',
};

const Navbar: React.FC = () => {
  const [isAuth, setIsAuth] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [panierCount, setPanierCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Fonction pour vérifier et mettre à jour l'état d'authentification selon le localStorage
  const updateAuthState = () => {
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('role');
    if (userId && userRole) {
      setIsAuth(true);
      setRole(userRole);
    } else {
      setIsAuth(false);
      setRole(null);
    }

    const storedPanier = localStorage.getItem('panier');
    if (storedPanier) {
      const items = JSON.parse(storedPanier);
      setPanierCount(items.length);
    } else {
      setPanierCount(0);
    }
    setLoading(false);
  };

  useEffect(() => {
    // Mise à jour initiale de l'état
    updateAuthState();

    // Optionnel : écoute des modifications du localStorage (utile si plusieurs onglets changent l'état)
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'userId' || event.key === 'role' || event.key === 'panier') {
        updateAuthState();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('role');
    localStorage.removeItem('panier');
    updateAuthState();
  };

  if (loading) return null;

  return (
    <nav
      style={{
        padding: '10px',
        backgroundColor: '#333',
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
      }}
    >
      {/* Liens principaux interactifs */}
      <Link
        href="/"
        style={linkStyle}
        onMouseOver={(e) =>
          (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)')
        }
        onMouseOut={(e) =>
          (e.currentTarget.style.backgroundColor = 'transparent')
        }
      >
        Accueil
      </Link>
      <Link
        href="/offres"
        style={linkStyle}
        onMouseOver={(e) =>
          (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)')
        }
        onMouseOut={(e) =>
          (e.currentTarget.style.backgroundColor = 'transparent')
        }
      >
        Nos Offres
      </Link>
      {isAuth && (
        <Link
          href="/profil"
          style={linkStyle}
          onMouseOver={(e) =>
            (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)')
          }
          onMouseOut={(e) =>
            (e.currentTarget.style.backgroundColor = 'transparent')
          }
        >
          Profil
        </Link>
      )}

      {/* Lien Panier avec badge */}
      <Link
        href="/panier"
        style={{
          marginLeft: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          ...linkStyle,
        }}
        onMouseOver={(e) =>
          (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)')
        }
        onMouseOut={(e) =>
          (e.currentTarget.style.backgroundColor = 'transparent')
        }
      >
        <span>Panier</span>
        <span
          style={{
            background: 'red',
            color: 'white',
            borderRadius: '50%',
            padding: '2px 8px',
            fontSize: '0.8em',
          }}
        >
          {panierCount}
        </span>
      </Link>

      {/* Zone d'authentification */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {isAuth ? (
          <>
            <span style={{ color: '#fff' }}>Connecté : {role}</span>
            <button
              style={{
                padding: '6px 12px',
                backgroundColor: '#cc0000',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
              onClick={handleLogout}
            >
              Déconnexion
            </button>
          </>
        ) : (
          <>
            <button
              style={{
                padding: '6px 12px',
                backgroundColor: '#0077cc',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
              onClick={() => {
                window.location.href = '/connexion';
              }}
            >
              Connexion
            </button>
            <Link href="/inscription">
              <button
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#28a745',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Inscription
              </button>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;