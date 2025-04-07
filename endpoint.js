const express = require("express");
const db = require("./db");
const {verifyToken} = require("./middleware");
const router = express.Router();
const bcrypt = require("bcrypt");
// npm install jsonwebtoken
const jwt = require("jsonwebtoken");
const {sign} = require("jsonwebtoken");
const {response} = require("express");
//npm install --save-dev jest




/* Route : lister les produits
* Get /api/produits
*/

router.get("/produits", (req, res) => {
    db.query("SELECT * FROM produits", (error, result) => {
        if (error){
            return(res.status(500).json({message : "Erreur du serveur"}));
        }
        if (result.length === 0){
            return res.status(404).json({message: "Produit non trouvé"});
        }
        res.json(result);
    });
});

// Liste des vendeurs

router.get("/vendeur", (req, res) => {
    db.query("SELECT * FROM vendeur", (error, result) => {
        if (error){
            return(res.status(500).json({message : "Erreur du serveur"}));
        }
        if (result.length === 0){
            return res.status(404).json({message: "CE vendeur n'existe pas"});
        }
        res.json(result);
    });
});

//liste des commandes client

router.get("/commandes/:id", (req, res) => {
    const clientID = req.params.id;
    db.query("SELECT * FROM commandes WHERE clientID = ?", [clientID], (error, result) => {
        if (error) {
            return res.status(500).json({ message: "Erreur du serveur" });
        }
        if (result.length === 0) {
            return res.status(404).json({ message: "Commandes non trouvées" });
        }
        res.json(result);
    });
});



/*
Route : Inscription d'un client
POST /api/clients/register
exemple : JSON
{
"nom" : "dupont",
"prenom" : "John",
"mail" : "john.dupont@gmail.com,
"mot_de_passe": "motdepasse",
}
*/
router.post("/client/register", (req, res) => {
    const { nom_prenom, email, mot_de_passe, date_naissance, telephone } = req.body;

    // Vérifier si l'email est déjà utilisé
    db.query("SELECT * FROM client WHERE email = ?", [email], (error, result) => {
        if (error) {
            return res.status(500).json({ message: "Erreur du serveur" });
        }
        if (result.length > 0) {
            return res.status(400).json({ message: "Cette adresse mail est déjà utilisée" });
        }

        // Hachage du mot de passe
        bcrypt.hash(mot_de_passe, 10, (error, hash) => {
            if (error) {
                return res.status(500).json({ message: "Erreur lors du hachage du mot de passe" });
            }

            // Insertion du nouveau client
            db.query(
                "INSERT INTO client (nom_prenom, email, mot_de_passe, date_naissance, telephone, date_inscription) VALUES (?, ?, ?, ?, ?, CURRENT_DATE)",
                [nom_prenom, email, hash, date_naissance, telephone],
                (error, result) => {
                    if (error) {
                        console.log(error);
                        return res.status(500).json({ message: "Erreur lors de l'inscription" });
                    }
                    res.status(201).json({ message: "Inscription réussie", client_id: result.insertId });
                }
            );
        });
    });
});

//Creation d'un nouveau vendeur

router.post("/vendeur/employe", (req,res) => {
    const {nom_prenom, email, telephone,date_embauche, statut, salaire, mot_de_passe } = req.body;

    //Controler si le mail est déjà present dans la base de donnée
    db.query(`SELECT * FROM vendeur where email = ?`, [email], (error, result) => {
        if (error) {
            return (res.status(500).json({message: "Erreur du serveur"}));
        }
        if (result.length > 0) {
            return res.status(404).json({message: "Cette mauvais adresse mail "});
        }
});
    bcrypt.hash(mot_de_passe, 10, (error, hash) => {
        if (error) {
            return res
                .status(500)
                .json({message: "Erreur lors du hachage du mot de passe"})
        }

        //Insertion nouveau vendeur
        db.query("INSERT INTO vendeur (nom_prenom, email, telephone,date_embauche, statut, salaire, mot_de_passe) VALUES (?,?,?,?,?,?,?)",
            [nom_prenom, email, telephone,date_embauche, statut, salaire, hash],
            (error, result) => {
                if (error) {
                    console.log(error)
                    return res
                        .status(500)
                        .json({message: "Erreur lors de la connexion"})
                }
                res.status(201).json({message: "connexion réussis", vendeur_id: result.insertId})
            })
    })
})

// Ajouter un nouveau produit et il verifie qu'il existe deja

router.post("/produits/add", (req,res) => {
    const {nom, description, prix,type, quantite, TVA, typeUnite, typePoids } = req.body;

    db.query("SELECT * FROM produits where nom = ?", [nom], (error, result) => {
        if (error) {
            return (res.status(500).json({message: "Erreur du serveur"}));
        }
        if (result.length > 0) {
            return res.status(404).json({message: "Ce produit existe déjà"});
        } else {
            db.query("INSERT INTO produits (nom, description, prix,type, quantite, TVA, typeUnite, typePoids) VALUES (?,?,?,?,?,?,?,?)",
                [nom, description, prix,type, quantite, TVA, typeUnite, typePoids],
                (error, result) => {
                    if (error) {
                        console.log(error)
                        return res
                            .status(500)
                            .json({message: "Ce produit n'a pas pu être rajouter"})
                    }


                    res.status(201).json({message: "Produit ajouté", produit_id: result.insertId})
                })
        }

    })



})


// recup toutes les lignes de commande par Id du panier

router.get("/lignecommande/:id", (req, res) => {
    const {id} = req.params;
    db.query("SELECT * FROM ligne_commande where panierID = ?", [id], (error, result) => {
        if (error) {
            return res.status(500).json({ message: "Erreur du serveur" });
        } if (result.length > 0) {
            return res.status(404).json({message: "Ce panier n'a pas de ligne de commande "});
        }else{
            return res.json(result);
        }
    })
})

//supprime ou décrémente et edit à  une ligne de commande

router.post("/lignecommande/sub/:produitsID", (req, res) => {
    const {produitsID} = req.params;
    const {panierID} = req.body;

    // 1. Vérifier si le produit existe dans le panier
    db.query(
        "SELECT * FROM ligne_commande WHERE panierID = ? AND produitsID = ?",
        [panierID, produitsID],
        (error, results) => {
            if (error) {
                return res.status(500).json({ message: "Erreur du serveur" });
            }

            if (results.length === 0) {
                return res.status(404).json({ message: "Produit non trouvé dans le panier" });
            }

            const produitDansPanier = results[0];
            const quantiteActuelle = produitDansPanier.qt_produit_line_commande;

            // 2. Logique de suppression conditionnelle
            if (quantiteActuelle > 1) {
                // Décrémenter la quantité si > 1
                db.query(
                    "UPDATE panier SET qt_produit_line_commande = qt_produit_line_commande - 1 WHERE panierID = ? AND produitsID = ?",
                    [panierID, produitsID],
                    (error, updateResult) => {
                        if (error) {
                            return res.status(500).json({ message: "Erreur lors de la mise à jour de la quantité" });
                        }

                        res.status(200).json({
                            message: "Quantité décrémentée",
                            nouvelleQuantite: quantiteActuelle - 1
                        });
                    }
                );
            } else {
                // Supprimer complètement si quantité = 1
                db.query(
                    "DELETE FROM ligne_commande WHERE panierID = ? AND produitsID = ?",
                    [panierID, produitsID],
                    (error, deleteResult) => {
                        if (error) {
                            return res.status(500).json({ message: "Erreur lors de la suppression du produit" });
                        }

                        res.status(200).json({ message: "Produit supprimé du panier" });
                    }
                );
            }
        }
    );
});

router.post("/lignecommande/add/:produitsID", (req, res) => {
    const produitsID = parseInt(req.params.produitsID, 10);
    const { panierID } = req.body;

    console.log("produitsID reçu :", produitsID);

    db.query("SELECT * FROM produits WHERE produitsID = ?", [produitsID], (error, result) => {
        if (error) {
            return res.status(500).json({ message: "Erreur du serveur 2" });
        }


        if (result.length === 0) {
            return res.status(404).json({ message: "Produit non trouvé" });
        }

        // Maintenant qu'on a un produit valide, on peut l'insérer dans la ligne_commande
        db.query(
            "INSERT INTO ligne_commande (panierID, qt_produit_line_commande, prix_unitaire_ligne_commande, produitsID) VALUES (?, ?, ?, ?)",
            [panierID, 1, result[0].prix, produitsID],
            (error, insertResult) => {
                if (error) {
                    return res.status(500).json({ message: "Erreur lors de l'ajout à la ligne de commande" });
                }
                res.json({ message: "Produit ajouté au panier"});
            }
        );
    });
});

//Pour édit

router.put("/lignecommande/edit", (req, res) => {
    const { quantite, panierID, produitsID } = req.body;

    db.query(
        "SELECT * FROM ligne_commande WHERE panierID = ? AND produitsID = ?",
        [panierID, produitsID],
        (error, results) => {
            if (error) {
                return res.status(500).json({ message: "Erreur du serveur" });
            }

            if (results.length === 0) {
                return res.status(404).json({ message: "Produit non trouvé dans le panier" });
            }

            const produitDansPanier = results[0];
            const quantiteActuelle = produitDansPanier.qt_produit_line_commande;

            db.query(
                "SELECT * FROM produits WHERE produitsID = ?",
                [produitsID],
                (error, updateResult) => {
                    if (error) {
                        return res.status(500).json({ message: "Erreur lors de la mise à jour de la quantité" });
                    }
                    if (results[0].quantite <= quantite) {
                        return res.status(400).json({message : "Pas assez de stock"})
                    }
                    else{
                        db.query(
                            "UPDATE ligne_commmande set qt_produit_line_commande = ? where produitsID = ? and panierID = ?",
                            [quantite, panierID, produitsID],
                            (error, result) => {
                                if (error) {
                                    return res.status(500).json({ message: "Erreur lors de la mise à jour de la quantité" });
                                }
                                res.json(result)
                            }
                        )
                    }
                }
            );
        }
    );
})

// recup de la commande en cours d'un client

router.get("/panier/:clientId", (req, res) => {
    const {clientId} = req.params;

    db.query(`SELECT p.* 
       FROM panier as p
       WHERE p.clientID = ?
       ORDER BY p.panierID DESC
       LIMIT 1`,
        [clientId], (error, result) => {
        if (error){
            return(res.status(500).json({message : "Erreur du serveur"}));
        }
        if (result.length === 0){
            return res.status(404).json({message: "Produit non trouvé"});
        }
        res.json(result);
    })
});



//fiche produit
router.get("/produits/details/:id", (req, res) => {
    db.query("SELECT nom, description, prix, typeUnite, typePoids, image_url FROM produits where produitsID = ?",[req.params.id], (error, result) => {
        if (error){
            return(res.status(500).json({message : "Erreur du serveur"}));
        }
        if (result.length === 0){
            return res.status(404).json({message: " produit non trouvé"});
        }
        res.json(result[0]);
    })
});

//Fiche client

router.get("/client/details/:id", (req, res) => {
    db.query("SELECT nom_prenom, date_naissance, date_inscription, telephone, email  FROM client where clientID = ?",[req.params.id], (error, result) => {
        if (error){
            return(res.status(500).json({message : "Erreur du serveur"}));
        }
        if (result.length === 0){
            return res.status(404).json({message: " produit non trouvé"});
        }
        res.json(result[0]);
    })
});

//Route : Connexion d'un client

// router.post("/client/login", (req, res) => {
//     const {email, mot_de_passe} = req.body;
//
//     db.query("SELECT * FROM client where email = ?", [email], (error, result) => {
//         if (error) return (res.status(500).json({message : "Erreur du serveur"}));
//
//         if (result.length === 0) {
//             return res.status(401).json({message : "Identifiant incorrect"});
//         }
//         const client = result[0];
//
//         /* Vérification du mot de passe*/
//         bcrypt.compare(mot_de_passe, client.mot_de_passe, (error, isMatch) => {
//             if (error) return res.status(500).json({message : "Erreur Serveur"});
//             if(!isMatch) return res.status(401).json({message : "Mot de Passe incorrect"});
//         });
//
//         //Géneration d'un token JWT
//         const token = sign(
//             {id: client.clientID, email: client.email},
//             process.env.JWT_SECRET,
//             {expiresIn: "2h"},
//         );
//
//         res.json({
//             message : "Connexion réussie",
//             token,
//             client: {id: client.clientID,
//                 nom: client.nom_prenom,
//                 email: client.email,
//             },
//         })
//     });
// });

router.post("/client/login", (req, res) => {
    const {email, mot_de_passe} = req.body;

    db.query("SELECT * FROM client where email = ?", [email], (error, result) => {
        if (error) return (res.status(500).json({message : "Erreur du serveur"}));

        if (result.length === 0) {
            return res.status(401).json({message : "Identifiant incorrect"});
        }
        const client = result[0];

        /* Vérification du mot de passe*/
        bcrypt.compare(mot_de_passe, client.mot_de_passe, (error, isMatch) => {
            if (error) return res.status(500).json({message : "Erreur Serveur"});
            if(!isMatch) return res.status(401).json({message : "Mot de Passe incorrect"});
        });

        // Génération d'un token JWT
        const token = sign(
            {id: client.clientID, email: client.email},
            process.env.JWT_SECRET,
            {expiresIn: "2h"},
        );

        res.json({
            message : "Connexion réussie",
            token,
            client: {
                id: client.clientID,  // clientID correctement inclus ici
                nom: client.nom_prenom,
                email: client.email,
            },
        })
    });
});


//pwmodif =  password modif
router.put("/client/pwmodif/:id", (req, res) => {
    const pw = req.body.pw;

    db.query(
        "SELECT * FROM client WHERE clientID = ?",
        [req.params.id],
        (error, result) => {
            if (error) {
                return res.status(500).json({ message: "Erreur du serveur" });
            }
            if (result.length < 1) {
                return res.status(400).json({ message: "Client non trouvé" });
            } else {
                bcrypt.hash(pw, 10, (error, hash) => {
                    if (error) {
                        return res.status(500).json({ message: "Erreur de hash" });
                    }
                    db.query(
                        "UPDATE client SET mot_de_passe = ? WHERE clientID = ?",
                        [hash, req.params.id],
                        (error, result) => {
                            if (error) {
                                return res.status(500).json({
                                    message: "Erreur lors de la modification du mot de passe",
                                });
                            }
                            res.status(201).json({
                                message: "Modification du mot de passe réussie",
                                nouveau_mot_de_passe: pw,
                            });
                        },
                );
                });
            }
        },
);
});

//modif client
router.put("/client/modifier", (req, res) => {
    const { nom_prenom, date_naissance, telephone, email } = req.body;

    // Vérification si toutes les informations sont fournies
    if (!nom_prenom || !date_naissance || !telephone || !email) {
        return res.status(400).json({ message: "Tous les champs sont requis." });
    }

    // Requête SQL pour mettre à jour les informations du client
    db.query(
        "UPDATE client SET nom_prenom = ?, date_naissance = ?, telephone = ?, email = ? WHERE email = ?",
        [nom_prenom, date_naissance, telephone, email, email],
        (error, result) => {
            if (error) {
                return res.status(500).json({ message: "Erreur du serveur" });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Client non trouvé" });
            }
            res.json({ message: "Profil mis à jour avec succès" });
        }
    );
});



module.exports = router;

//SELECT * from adresse join ville on ville.villeID = adresse.villeID;