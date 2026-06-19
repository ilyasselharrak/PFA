package com.emsi.pfa.model;
import jakarta.persistence.Entity;

import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
@Entity
public class Historique {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String ancienStatus;
    private String nouveauStatus;
    private String action;
    private LocalDateTime dateAction;

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
    private Reclamation reclamation;

    public Historique() {}
    
    public Long getId() {
        return id;
    }

    public String getAncienStatus() {
        return ancienStatus;
    }

    public void setAncienStatus(String ancienStatus) {
        this.ancienStatus = ancienStatus;
    }

    public String getNouveauStatus() {
        return nouveauStatus;
    }

    public void setNouveauStatus(String nouveauStatus) {
        this.nouveauStatus = nouveauStatus;
    }

    

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public LocalDateTime getDateAction() {
        return dateAction;
    }

    public void setDateAction(LocalDateTime dateAction) {
        this.dateAction = dateAction;
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
    
}
