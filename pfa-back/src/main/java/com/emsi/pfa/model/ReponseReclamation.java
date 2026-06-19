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
public class ReponseReclamation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;
    private String reponse;
    private LocalDateTime dateCreation = LocalDateTime.now();
    @ManyToOne
    @JoinColumn(name = "agent_id")
    @JsonIgnoreProperties({
    "affectations",
    "reponses"
    })
    private Agent agent;
    
    @ManyToOne
    @JoinColumn(name = "reclamation_id")
    @JsonIgnoreProperties({
    "historiques",
    "commentaires",
    "affectations",
    "reponses"
    })
    private Reclamation reclamation;

     public ReponseReclamation() {}
     
    public long getId() {
         return id;
     }


     public String getReponse() {
         return reponse;
     }

     public void setReponse(String reponse) {
         this.reponse = reponse;
     }
    
     public Agent getAgent() {
         return agent;
     }

     public void setAgent(Agent agent) {
         this.agent = agent;
     }

     public Reclamation getReclamation() {
         return reclamation;
     }

     public void setReclamation(Reclamation reclamation) {
         this.reclamation = reclamation;
     }

     public LocalDateTime getDateCreation() {
         return dateCreation;
     }

     public void setDateCreation(LocalDateTime dateCreation) {
         this.dateCreation = dateCreation;
     }


    
     

}
