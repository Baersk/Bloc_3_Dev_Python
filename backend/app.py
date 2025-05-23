from flask import Flask, request, jsonify, make_response
import psycopg2
import os
from dotenv import load_dotenv
import qrcode
import io
import base64
from flask_cors import CORS
import uuid
import datetime  # Import global pour manipuler les dates

load_dotenv()

app = Flask(__name__)
CORS(app)

def get_connexion():
    """
    Retourne une connexion à la base de données.
    Si DATABASE_URL est défini, on l'utilise ; sinon, on utilise les paramètres individuels.
    """
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
    """
    Récupère la liste des offres en effectuant une jointure avec la table calendrier_evenements.
    Retourne les offres avec leur date sous forme de chaîne.
    """
    try:
        conn = get_connexion()
        cur = conn.cursor()
        cur.execute("""
            SELECT o.id, o.nom, o.description, o.prix, o.capacite, c.date_heure
            FROM offres o
            JOIN calendrier_evenements c ON o.id = c.offre_id;
        """)
        rows = cur.fetchall()
        offres = []
        for row in rows:
            # Conversion de la date en chaîne, si elle est présente
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
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/offres', methods=['POST'])
def add_offre():
    """
    Ajoute une nouvelle offre ainsi qu'un événement associé dans la table calendrier_evenements.
    Les données attendues sont : nom, description, prix, capacite et date_heure (au format 'YYYY-MM-DD HH:MM:SS').
    """
    data = request.json
    nom = data.get('nom')
    description = data.get('description')
    prix = data.get('prix')
    capacite = data.get('capacite')
    date_heure_str = data.get('date_heure')  # Format attendu : 'YYYY-MM-DD HH:MM:SS'

    if not all([nom, description, prix, capacite, date_heure_str]):
        return jsonify({"error": "Tous les champs sont requis."}), 400

    try:
        # Conversion de la date
        date_heure = datetime.datetime.strptime(date_heure_str, '%Y-%m-%d %H:%M:%S')

        conn = get_connexion()
        cur = conn.cursor()

        # Insertion dans la table offres et récupération de l'ID généré
        cur.execute(
            "INSERT INTO offres (nom, description, prix, capacite) VALUES (%s, %s, %s, %s) RETURNING id",
            (nom, description, prix, capacite)
        )
        offre_id = cur.fetchone()[0]

        # Insertion dans la table calendrier_evenements pour l'événement associé à cette offre
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
    """
    Récupère et renvoie tous les événements du calendrier (table calendrier_evenements).
    """
    try:
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
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/reserver', methods=['POST'])
def reserver_billet():
    """
    Crée une réservation pour un utilisateur avec création des billets associés.
    Expects dans la requête (JSON) : utilisateur_id, offre_id, date_heure_event (format 'YYYY-MM-DD HH:MM:SS') et nombre_billets.
    Un QR code est généré pour chaque billet.
    """
    data = request.json
    utilisateur_id = data['utilisateur_id']
    offre_id = data['offre_id']
    date_event = data['date_heure_event']  # Format : 'YYYY-MM-DD HH:MM:SS'
    nb_billets = data['nombre_billets']

    try:
        conn = get_connexion()
        cur = conn.cursor()

        # Génération de clés uniques pour la réservation
        clef1 = str(uuid.uuid4())
        clef_finale = str(uuid.uuid4())

        # Création de la réservation avec statut 'validée'
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
            # Insertion initiale du billet avec qr_code vide et date_validite identique à date_event (modifiable)
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
    

@app.route('/utilisateurs', methods=['GET'])
def get_utilisateurs():
    try:
        conn = get_connexion()
        cur = conn.cursor()
        cur.execute("SELECT id, nom, prenom, email, role FROM utilisateurs")
        users = cur.fetchall()
        cur.close()
        conn.close()
        return jsonify([
            {
                'id': u[0],
                'nom': u[1],
                'prenom': u[2],
                'email': u[3],
                'role': u[4]
            } for u in users
        ])
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/utilisateurs/<user_id>', methods=['GET'])
def get_utilisateur(user_id):
    try:
        conn = get_connexion()
        cur = conn.cursor()
        cur.execute("SELECT id, nom, prenom, email, clef_utilisateur, role FROM utilisateurs WHERE id = %s", (user_id,))
        user = cur.fetchone()
        cur.close()
        conn.close()
        if user:
            return jsonify({
                "id": user[0],
                "nom": user[1],
                "prenom": user[2],
                "email": user[3],
                "clef_utilisateur": user[4],
                "role": user[5]
            })
        else:
            return jsonify({"error": "Utilisateur non trouvé"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/utilisateurs/<user_id>/reservations', methods=['GET'])
def get_reservations(user_id):
    try:
        conn = get_connexion()
        cur = conn.cursor()
        # Récupérer toutes les réservations de l'utilisateur (ID passé comme chaîne)
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
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/utilisateurs/<user_id>', methods=['DELETE'])
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


# ------------------------
#      Autres Routes
# ------------------------

@app.route('/verifier-billet', methods=['POST'])
def verifier_billet():
    data = request.json
    qr_code = data.get('qr_code')
    if not qr_code:
        return jsonify({'valide': False, 'message': 'QR code manquant'}), 400

    try:
        # Ici, on considère que le QR code correspond à la clef_finale stockée dans la réservation
        clef_finale = qr_code.strip()

        conn = get_connexion()
        cur = conn.cursor()
        cur.execute("SELECT id, statut FROM reservations WHERE clef_finale = %s", (clef_finale,))
        result = cur.fetchone()
        cur.close()
        conn.close()

        if result:
            reservation_id, statut = result
            if statut == 'valide':
                # Optionnel : vous pouvez mettre à jour le statut pour marquer le billet comme utilisé si nécessaire
                return jsonify({'valide': True, 'message': f'Billet valide pour la réservation {reservation_id}'})
            else:
                return jsonify({'valide': False, 'message': 'Billet non valide ou déjà utilisé'})
        else:
            return jsonify({'valide': False, 'message': 'Billet non trouvé'})
    except Exception as e:
        return jsonify({'valide': False, 'message': 'Erreur lors de la vérification : ' + str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)