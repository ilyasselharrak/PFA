package com.emsi.pfa.service;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;

import java.time.LocalDateTime;
import java.util.List;

import com.emsi.pfa.repository.AffectationRepository;
import com.emsi.pfa.repository.CommentaireRepository;
import com.emsi.pfa.repository.HistoriqueRepository;
import com.emsi.pfa.repository.NotificationRepository;
import com.emsi.pfa.repository.ReclamationRepository;
import com.emsi.pfa.repository.UserRepository;
import com.emsi.pfa.model.Affectation;
import com.emsi.pfa.model.Commentaire;
import com.emsi.pfa.model.Historique;
import com.emsi.pfa.model.Reclamation;
import com.emsi.pfa.model.User;
import com.emsi.pfa.model.Notification;

@Service
public class CommentaireService {
    @Autowired
    private CommentaireRepository repo;
    @Autowired
    private AffectationRepository affectationRepository;
    @Autowired
    private NotificationRepository notificationRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private ReclamationRepository reclamationRepository;
    @Autowired
    private CurrentUserService currentUserService;
    @Autowired
    private HistoriqueRepository historiqueRepository;

    public void addCommentaire(Commentaire commentaire) {
        User auteur = userRepository.findById(commentaire.getUser().getId())
            .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        Reclamation reclamation = reclamationRepository.findById(commentaire.getReclamation().getId())
            .orElseThrow(() -> new RuntimeException("Réclamation introuvable"));

        User currentUser = currentUserService.getCurrentUser();
        Historique historique = new Historique();
        historique.setAction(currentUser.getNom() + " " + currentUser.getPrenom() + " a ajouté un commentaire concernant réclamation #" + commentaire.getReclamation().getId());
        historique.setUser(currentUser);
        historique.setDateAction(LocalDateTime.now());
        historiqueRepository.save(historique);

        commentaire.setUser(auteur);
        commentaire.setReclamation(reclamation);

        String role = auteur.getRole().getName();

        if ("agent".equals(role)) {
            commentaire.setApprouveParAdmin(false);
            repo.save(commentaire);

            List<User> admins = userRepository.findByRole_Name("admin");
            for (User admin : admins) {
                Notification notification = new Notification();
                notification.setReclamation(reclamation);
                notification.setDateEnvoi(LocalDateTime.now());
                notification.setLue(false);
                notification.setUser(admin);
                notification.setMessage("Nouveau commentaire de l'agent sur la réclamation #" + reclamation.getId() + " \"" + reclamation.getTitre() + "\" - En attente de votre approbation");
                notificationRepository.save(notification);
            }
            return;
        }

        commentaire.setApprouveParAdmin(true);
        repo.save(commentaire);

        Notification notification = new Notification();
        notification.setReclamation(reclamation);
        notification.setDateEnvoi(LocalDateTime.now());
        notification.setLue(false);

        if ("client".equals(role)) {
            Affectation affectation = affectationRepository.findByReclamationId(reclamation.getId()).orElse(null);
            if (affectation != null) {
                notification.setUser(affectation.getAgent().getUser());
                notification.setMessage("Le client a ajouté un commentaire sur la réclamation : " + reclamation.getTitre());
                notificationRepository.save(notification);
            }
        }
    }

    public void approuverCommentaire(Long commentaireId, Authentication authentication) {
        String email = authentication.getName();
        User admin = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        if (!"admin".equals(admin.getRole().getName()) && !"manager".equals(admin.getRole().getName())) {
            throw new RuntimeException("Accès refusé");
        }

        Commentaire commentaire = repo.findById(commentaireId)
            .orElseThrow(() -> new RuntimeException("Commentaire introuvable"));

        commentaire.setApprouveParAdmin(true);
        repo.save(commentaire);

        Notification notification = new Notification();
        notification.setUser(commentaire.getReclamation().getClient().getUser());
        notification.setReclamation(commentaire.getReclamation());
        notification.setMessage("Nouveau commentaire concernant votre réclamation : " + commentaire.getReclamation().getTitre());
        notification.setDateEnvoi(LocalDateTime.now());
        notification.setLue(false);
        notificationRepository.save(notification);
    }

    public List<Commentaire> getCommentairesByReclamation(Long id, Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        if ("client".equals(user.getRole().getName())) {
            return repo.findAllByReclamationIdAndApprouveParAdmin(id, true);
        }

        return repo.findAllByReclamationId(id);
    }

    public Commentaire getCommentaire(Long id) {
        return repo.findById(id)
            .orElseThrow(() -> new RuntimeException("Commentaire non trouvé pour l'id: " + id));
    }

    public void updateCommentaire(Long id, Commentaire commentaire) {
        Commentaire existing = repo.findById(id)
            .orElseThrow(() -> new RuntimeException("Commentaire non trouvé pour l'id: " + id));
        existing.setContenu(commentaire.getContenu());
        existing.setDateCommentaire(commentaire.getDateCommentaire());
        repo.save(existing);
    }

    public void deleteCommentaire(Long id) {
        repo.deleteById(id);
    }
}
