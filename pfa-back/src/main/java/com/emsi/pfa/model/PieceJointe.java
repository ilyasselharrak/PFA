package com.emsi.pfa.model;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;

@Entity
public class PieceJointe {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String fichier;

    @ManyToOne
    @JoinColumn(name = "reclamation_id")
    @JsonIgnoreProperties({
    "historiques",
    "commentaires",
    "affectations",
    "reponses"
    })
    private Reclamation reclamation;

    @ManyToOne
    @JoinColumn(name = "user_id")
    @JsonIgnoreProperties({
    "piecesJointes",
    "notifications",
    "historiques",
    "commentaires"
    })
    private User user;


    public PieceJointe() {}

    public Long getId() {
        return id;
    }

    public String getFichier() {
        return fichier;
    }

    public void setFichier(String fichier) {
        this.fichier = fichier;
    }

    public Reclamation getReclamation() {
        return reclamation;
    }

    public void setReclamation(Reclamation reclamation) {
        this.reclamation = reclamation;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    

}
