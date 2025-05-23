from flask import Flask, request, jsonify, make_response
import psycopg2
import os
from dotenv import load_dotenv
import qrcode
import io
import base64
import bcrypt
from flask_cors import CORS
import uuid

load_dotenv()

app = Flask(__name__)
CORS(app)

def get_connexion():
    database_url = os.getenv("DATABASE_URL")
    print("DATABASE_URL =", database_url) 
    if database_url:
        return psycopg2.connect(database_url)
    else:
        return psycopg2.connect(
            dbname=os.getenv("DB_NAME"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            host=os.getenv("DB_HOST"),
            port=os.getenv("DB_PORT")
        )

@app.route('/offres', methods=['GET'])
def get_offres():
    conn = get_connexion()
    cur = conn.cursor()
    # Exécute la jointure pour récupérer offres + date_event
    cur.execute("""
        SELECT o.id, o.nom, o.description, o.prix, o.capacite, c.date_heure
        FROM offres o
        JOIN calendrier_evenements c ON o.id = c.offre_id;
    """)
    rows = cur.fetchall()
    offres = []
    for row in rows:
        # Vérification de la présence de la date pour éviter un AttributeError
        date_heure = row[5].strftime('%Y-%m-%d %H:%M:%S') if row[5] is not None else None
        offres.append({
            "id": row[0],
            "nom": row[1],
            "description": row[2],
            "prix": row[3],
            "capacite": row[4],
            "date_heure": date_heure
        })
    cur.close()
    conn.close()
    return jsonify(offres)

@app.route('/offres', methods=['POST'])
def add_offre():
    data = request.json
    nom = data.get('nom')
    description = data.get('description')
    prix = data.get('prix')
    capacite = data.get('capacite')
    date_heure_str = data.get('date_heure')  #/date_event au format 'YYYY-MM-DD HH:MM:SS'

    if not all([nom, description, prix, capacite, date_heure_str]):
        return jsonify({"error": "Tous les champs sont requis."}), 400

    try:
        # Ajout dans offres
        conn = get_connexion()
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO offres (nom, description, prix, capacite) VALUES (%s, %s, %s, %s) RETURNING id",
            (nom, description, prix, capacite)
        )
        offre_id = cur.fetchone()[0]

        # Ajout dans calendrier_evenements
        from datetime import datetime
        date_heure = datetime.strptime(date_heure_str, '%Y-%m-%d %H:%M:%S')
        cur.execute(
            "INSERT INTO calendrier_evenements (offre_id, date_heure) VALUES (%s, %s)",
            (offre_id, date_heure)
        )

        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"message": "Offre ajoutée", "offre_id": offre_id})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/evenements', methods=['GET'])
def get_evenements():
    conn = get_connexion()
    cur = conn.cursor()
    cur.execute("SELECT * FROM calendrier_evenements;")
    rows = cur.fetchall()
    evenements = []
    for row in rows:
        evenements.append({
            "id": row[0],
            "offre_id": row[1],
            "date_heure": row[2].strftime('%Y-%m-%d %H:%M:%S')
        })
    cur.close()
    conn.close()
    return jsonify(evenements)

@app.route('/reserver', methods=['POST'])
def reserver_billet():
    data = request.json
    utilisateur_id = data['utilisateur_id']
    offre_id = data['offre_id']
    date_event = data['date_heure_event']  # Format : 'YYYY-MM-DD HH:MM:SS'
    nb_billets = data['nombre_billets']

    try:
        conn = get_connexion()
        cur = conn.cursor()

        # Génération des clés pour la réservation
        clef1 = str(uuid.uuid4())
        clef_finale = str(uuid.uuid4())

        # Créer la réservation avec les champs supplémentaires et statut 'validée'
        cur.execute(
            """
            INSERT INTO reservations (utilisateur_id, date_achat, statut, clef1, clef_finale)
            VALUES (%s, NOW(), 'validée', %s, %s) RETURNING id;
            """,
            (utilisateur_id, clef1, clef_finale)
        )
        reservation_id = cur.fetchone()[0]

        billets_info = []

        for _ in range(nb_billets):
            # Insertion initiale du billet avec un champ qr_code vide.
            # On attribue "date_validite" ici identique à date_event (adaptable selon ton besoin).
            cur.execute(
                """
                INSERT INTO billets (reservation_id, offre_id, date_heure_event, date_validite, qr_code)
                VALUES (%s, %s, %s, %s, '') RETURNING id;
                """,
                (reservation_id, offre_id, date_event, date_event)
            )
            billet_id = cur.fetchone()[0]

            # Génération du QR code avec les informations du billet
            qr_content = f"BilletID:{billet_id}|RES:{reservation_id}|EVENT:{date_event}"
            img = qrcode.make(qr_content)
            buf = io.BytesIO()
            img.save(buf)
            buf.seek(0)
            qr_b64 = base64.b64encode(buf.read()).decode()

            # Mise à jour du billet avec le QR code généré
            cur.execute(
                "UPDATE billets SET qr_code = %s WHERE id = %s;",
                (qr_b64, billet_id)
            )

            billets_info.append({'billet_id': billet_id, 'qr_code_base64': qr_b64})

        conn.commit()
        cur.close()
        conn.close()

        return jsonify({
            'reservation_id': reservation_id,
            'clef1': clef1,
            'clef_finale': clef_finale,
            'message': 'Réservation créée avec succès',
            'billets': billets_info
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()

    nom = data.get('nom')
    prenom = data.get('prenom')
    email = data.get('email')
    mot_de_passe_clair = data.get('mot_de_passe')
    role = data.get('role', 'client')  # Si pas fourni, par défaut 'client'

    if not all([nom, prenom, email, mot_de_passe_clair]):
        return jsonify({"error": "Tous les champs sont requis"}), 400

    import bcrypt
    mot_de_passe_hash = bcrypt.hashpw(mot_de_passe_clair.encode('utf-8'), bcrypt.gensalt())

    try:
        conn = get_connexion()
        cur = conn.cursor()

        # Vérifier si l'email existe déjà
        cur.execute("SELECT id FROM utilisateurs WHERE email = %s", (email,))
        if cur.fetchone():
            return jsonify({"error": "Email déjà utilisé"}), 409

        # Insérer l'utilisateur avec le rôle passé (par défaut 'client')
        cur.execute(
            "INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, role) VALUES (%s, %s, %s, %s, %s) RETURNING id",
            (nom, prenom, email, mot_de_passe_hash.decode(), role)
        )
        user_id = cur.fetchone()[0]

        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"message": "Inscription réussie", "user_id": user_id, "role": role})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    mot_de_passe_clair = data.get('mot_de_passe')

    # Vérification de la présence
    if not email or not mot_de_passe_clair:
        return jsonify({"error": "Email et mot de passe requis"}), 400

    conn = get_connexion()
    cur = conn.cursor()
    cur.execute("SELECT id, mot_de_passe, role FROM utilisateurs WHERE email = %s", (email,))
    user = cur.fetchone()
    cur.close()
    conn.close()

    if not user:
        return jsonify({"error": "Email non trouvé"}), 404

    user_id, hash_mdp, role = user

    # Vérification mot de passe hashé
    if bcrypt.checkpw(mot_de_passe_clair.encode('utf-8'), hash_mdp.encode('utf-8')):
        # Connexion réussie
        response = make_response(jsonify({"message": "Connexion réussie", "user_id": user_id, "role": role}))
        # Ajouter le cookie role (non sécurisé si en clair)
        response.set_cookie('role', role, path='/', httponly=False)  # httponly=False pour accès côté JS
        return response
    else:
        return jsonify({"error": "Mot de passe incorrect"}), 401

@app.route('/utilisateurs', methods=['GET'])
def get_utilisateurs():
    try:
        conn = get_connexion()
        cur = conn.cursor()
        cur.execute("SELECT id, nom, prenom, email, role FROM utilisateurs")
        users = cur.fetchall()
        cur.close()
        conn.close()
        return jsonify([{'id': u[0], 'nom': u[1], 'prenom': u[2], 'email': u[3], 'role': u[4]} for u in users])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/utilisateur/<int:user_id>', methods=['GET'])
def get_utilisateur(user_id):
    conn = get_connexion()
    cur = conn.cursor()
    cur.execute("SELECT id, nom, prenom, email FROM utilisateurs WHERE id = %s", (user_id,))
    user = cur.fetchone()
    cur.close()
    conn.close()
    if user:
        return jsonify({"id": user[0], "nom": user[1], "prenom": user[2], "email": user[3]})
    else:
        return jsonify({"error": "Utilisateur non trouvé"}), 404

@app.route('/utilisateur/<int:user_id>/reservations', methods=['GET'])
def get_reservations(user_id):
    conn = get_connexion()
    cur = conn.cursor()
    # Récupérer toutes les réservations de l'utilisateur
    cur.execute(
        """
        SELECT r.id, r.date_achat, r.statut, o.nom, b.date_heure_event, b.qr_code
        FROM reservations r
        JOIN billets b ON r.id = b.reservation_id
        JOIN offres o ON o.id = b.offre_id
        WHERE r.utilisateur_id = %s
        """,
        (user_id,)
    )
    reservations = cur.fetchall()
    cur.close()
    conn.close()

    # Formatage des données
    res_list = {}
    for row in reservations:
        res_id = row[0]
        if res_id not in res_list:
            res_list[res_id] = {
                "id": res_id,
                "date_achat": row[1],
                "statut": row[2],
                "offre": row[3],
                "billets": []
            }
        res_list[res_id]["billets"].append({
            "date_heure": row[4],
            "qr_code": row[5]
        })
    return jsonify(list(res_list.values()))

@app.route('/utilisateur/<int:user_id>', methods=['DELETE'])
def delete_utilisateur(user_id):
    try:
        conn = get_connexion()
        cur = conn.cursor()
        cur.execute("DELETE FROM utilisateurs WHERE id = %s", (user_id,))
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({'message': 'Utilisateur supprimé'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/verifier-billet', methods=['POST'])
def verifier_billet():
    data = request.json
    qr_code = data.get('qr_code')

    # Vérification du format du QR code
    if not qr_code:
        return jsonify({'valide': False, 'message': 'QR code manquant'}), 400

    try:
        # Ici, nous considérons que le QR code correspond à la clef_finale.
        clef_finale = qr_code.strip()

        conn = get_connexion()
        cur = conn.cursor()

        # Recherche de la réservation dont la clef_finale correspond
        cur.execute("SELECT id, statut FROM reservations WHERE clef_finale = %s", (clef_finale,))
        result = cur.fetchone()

        if result:
            reservation_id, statut = result
            if statut == 'valide':
                # Vous pouvez ici éventuellement mettre à jour le statut pour marquer le billet comme utilisé
                return jsonify({'valide': True, 'message': f'Billet valide pour la réservation {reservation_id}'})
            else:
                return jsonify({'valide': False, 'message': 'Billet non valide ou déjà utilisé'})
        else:
            return jsonify({'valide': False, 'message': 'Billet non trouvé'})
    except Exception as e:
        return jsonify({'valide': False, 'message': 'Erreur lors de la vérification : ' + str(e)}), 500



if __name__ == '__main__':
    app.run(debug=True)