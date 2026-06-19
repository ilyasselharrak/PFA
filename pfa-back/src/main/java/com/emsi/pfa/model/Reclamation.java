package com.emsi.pfa.model;
import java.time.LocalDateTime;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import java.util.List;
import java.util.ArrayList;
import jakarta.persistence.OneToMany;
import jakarta.persistence.CascadeType;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
public class Reclamation {
    @Id 
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String titre;
    private String description;
    private LocalDateTime dateDepot = LocalDateTime.now();
    private LocalDateTime dateModification = LocalDateTime.now();
    @ManyToOne
    @JoinColumn(name = "status_id")
    private Status status;
    @ManyToOne
    @JoinColumn(name = "categorie_id")
    private CategorieReclamation categorie;
    @ManyToOne
    @JoinColumn(name = "client_id")
    private Client client;
    @ManyToOne
    @JoinColumn(name = "priority_id")
    private Priority priority;

    private Boolean valideeParAdmin;
    private Boolean confirmeParClient;
    @OneToMany(mappedBy = "reclamation", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<Historique> historiques = new ArrayList<>();

    @OneToMany(mappedBy = "reclamation", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<Commentaire> commentaires = new ArrayList<>();

    @OneToMany(mappedBy = "reclamation", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<Affectation> affectations = new ArrayList<>();

    @OneToMany(mappedBy = "reclamation", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<ReponseReclamation> reponses = new ArrayList<>();
    @OneToMany(mappedBy = "reclamation",cascade = CascadeType.ALL,orphanRemoval = true)
    @JsonIgnore
    private List<Notification> notifications = new ArrayList<>();
    @OneToMany(mappedBy = "reclamation",cascade = CascadeType.ALL,orphanRemoval = true)
    @JsonIgnore
    private List<PieceJointe> piecesJointes = new ArrayList<>();

    public Reclamation() {}
    
    public Long getId() {
        return id;
    }

    public String getTitre() {
        return titre;
    }

    public void setTitre(String titre) {
        this.titre = titre;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public LocalDateTime getDateDepot() {
        return dateDepot;
    }

    public void setDateDepot(LocalDateTime dateDepot) {
        this.dateDepot = dateDepot;
    }

    public LocalDateTime getDateModification() {
        return dateModification;
    }

    public void setDateModification(LocalDateTime dateModification) {
        this.dateModification = dateModification;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }

    public CategorieReclamation getCategorie() {
        return categorie;
    }

    public void setCategorie(CategorieReclamation categorie) {
        this.categorie = categorie;
    }

    public Priority getPriority() {
        return priority;
    }

    public void setPriority(Priority priority) {
        this.priority = priority;
    }

    public Client getClient() {
        return client;
    }

    public void setClient(Client client) {
        this.client = client;
    }

    public Boolean getValideeParAdmin() {
        return valideeParAdmin;
    }

    public void setValideeParAdmin(Boolean valideeParAdmin) {
        this.valideeParAdmin = valideeParAdmin;
    }

    public Boolean getConfirmeParClient() {
        return confirmeParClient;
    }

    public void setConfirmeParClient(Boolean confirmeParClient) {
        this.confirmeParClient = confirmeParClient;
    }
}
