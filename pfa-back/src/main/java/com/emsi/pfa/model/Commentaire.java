package com.emsi.pfa.model;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.JoinColumn;
@Entity
public class Commentaire {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;
    private String contenu;
    private LocalDateTime  dateCommentaire = LocalDateTime.now();
    @ManyToOne
    @JoinColumn(name = "user_id")
    @JsonIgnoreProperties({
    "notifications",
    "historiques",
    "commentaires"
    })
private User user;
    @ManyToOne
    @JoinColumn(name = "reclamation_id")
    @JsonIgnoreProperties({
    "historiques",
    "commentaires",
    "affectations",
    "reponses"
    })
private Reclamation reclamation;

    private Boolean approuveParAdmin;

    public Commentaire() {}
    
        public long getId() {
            return id;
        }

    public String getContenu() {
        return contenu;
    }

    public void setContenu(String contenu) {
        this.contenu = contenu;
    }

    public LocalDateTime getDateCommentaire() {
        return dateCommentaire;
    }

    public void setDateCommentaire(LocalDateTime dateCommentaire) {
        this.dateCommentaire = dateCommentaire;
    }

    

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Reclamation getReclamation() {
        return reclamation;
    }

    public void setReclamation(Reclamation reclamation) {
        this.reclamation = reclamation;
    }

    public Boolean getApprouveParAdmin() {
        return approuveParAdmin;
    }

    public void setApprouveParAdmin(Boolean approuveParAdmin) {
        this.approuveParAdmin = approuveParAdmin;
    }
}
