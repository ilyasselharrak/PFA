package com.emsi.pfa.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import com.emsi.pfa.repository.AffectationRepository;
import com.emsi.pfa.repository.CategorieReclamationRepository;
import com.emsi.pfa.repository.HistoriqueRepository;
import com.emsi.pfa.repository.NotificationRepository;
import com.emsi.pfa.repository.PriorityRepository;
import com.emsi.pfa.repository.ReclamationRepository;
import com.emsi.pfa.repository.StatusRepository;
import com.emsi.pfa.repository.UserRepository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import java.time.LocalDateTime;
import java.time.LocalDate;

import com.emsi.pfa.model.Historique;
import com.emsi.pfa.model.Notification;
import com.emsi.pfa.model.Priority;
import com.emsi.pfa.model.Reclamation;
import com.emsi.pfa.model.User;
import com.emsi.pfa.model.Status;
import com.emsi.pfa.model.Client;
import com.emsi.pfa.model.CategorieReclamation;

import java.util.HashMap;
import java.util.List;
import java.util.ArrayList;
import java.util.Map;
import java.util.LinkedHashMap;

import org.springframework.security.core.Authentication;

@Service
public class ReclamationService {
    @Autowired
    private ReclamationRepository repo;
    @Autowired
    private StatusRepository statusRepository;
    @Autowired
    private NotificationRepository notificationRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private PriorityRepository priorityRepository;
    @Autowired 
    private AffectationRepository affectationRepository;
    @Autowired
    private CurrentUserService currentUserService;
    @Autowired
    private HistoriqueRepository historiqueRepository;
    @Autowired
    private CategorieReclamationRepository categorieRepository;

    public Reclamation addReclamation(Reclamation reclamation, Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
        
        Client client = user.getClient();
        if (client == null) {
            throw new RuntimeException("Aucun client associé à cet utilisateur");
        }
        
        Status status = statusRepository.findByStatus("en attente")
            .orElseThrow(() -> new RuntimeException("Status introuvable"));
        
        reclamation.setStatus(status);
        reclamation.setClient(client);
        reclamation.setDateDepot(LocalDateTime.now());
        reclamation.setDateModification(LocalDateTime.now());
        
        Reclamation savedReclamation = repo.save(reclamation);
        
        // Notifications aux managers
        List<User> managers = userRepository.findByRole_Name("manager");
        for (User manager : managers) {
            Notification notification = new Notification();
            notification.setUser(manager);
            notification.setReclamation(savedReclamation);
            notification.setMessage("Nouvelle réclamation : " + reclamation.getTitre());
            notification.setDateEnvoi(LocalDateTime.now());
            notification.setLue(false);
            notificationRepository.save(notification);
        }
        
        // Notifications aux admins
        List<User> admins = userRepository.findByRole_Name("admin");
        for (User admin : admins) {
            Notification notification = new Notification();
            notification.setUser(admin);
            notification.setReclamation(savedReclamation);
            notification.setMessage("Nouvelle réclamation #" + savedReclamation.getId() + " - " + reclamation.getTitre());
            notification.setDateEnvoi(LocalDateTime.now());
            notification.setLue(false);
            notificationRepository.save(notification);
        }
        
        return savedReclamation;
    }
    
    public Reclamation getReclamation(Long id, Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        Reclamation reclamation = repo.findById(id)
            .orElseThrow(() -> new RuntimeException("Réclamation introuvable"));

        if (user.getRole().getName().equals("client")) {
            if (user.getClient() == null) {
                throw new RuntimeException("Aucun client associé");
            }
            if (!reclamation.getClient().getId().equals(user.getClient().getId())) {
                throw new RuntimeException("Accès refusé");
            }
        }

        if (user.getRole().getName().equals("agent")) {
            if (user.getAgent() == null) {
                throw new RuntimeException("Aucun agent associé");
            }
            boolean affectationExiste = affectationRepository
                .existsByAgent_IdAndReclamation_Id(
                    user.getAgent().getId(),
                    reclamation.getId()
                );
            if (!affectationExiste) {
                throw new RuntimeException("Accès refusé");
            }
        }

        return reclamation;
    }

    public void updateReclamation(Long id, Reclamation reclamation) {
        Reclamation existingReclamation = repo.findById(id)
            .orElseThrow(() -> new RuntimeException("Réclamation non trouvée pour l'id: " + id));
        existingReclamation.setTitre(reclamation.getTitre());
        existingReclamation.setDescription(reclamation.getDescription());
        existingReclamation.setCategorie(reclamation.getCategorie());
        existingReclamation.setClient(reclamation.getClient());
        existingReclamation.setStatus(reclamation.getStatus());
        existingReclamation.setPriority(reclamation.getPriority());
        existingReclamation.setDateModification(LocalDateTime.now());
        repo.save(existingReclamation);
    }

    public void deleteReclamation(Long id) {
        Reclamation reclamation = repo.findById(id)
            .orElseThrow(() -> new RuntimeException("Réclamation non trouvée"));
        repo.delete(reclamation);
    }

    public void changeStatus(Long id, long statusId, Authentication authentication) {
        Reclamation reclamation = repo.findById(id)
            .orElseThrow(() -> new RuntimeException("Réclamation non trouvée pour l'id: " + id));

        Status status = statusRepository.findById(statusId)
            .orElseThrow(() -> new RuntimeException("Status non trouvé pour l'id: " + statusId));

        String ancienStatus = reclamation.getStatus().getStatus();

        reclamation.setStatus(status);
        reclamation.setDateModification(LocalDateTime.now());

        User currentUser = currentUserService.getCurrentUser();
        String role = currentUser.getRole().getName();

        if ("résolu".equalsIgnoreCase(status.getStatus()) && "agent".equals(role)) {
            reclamation.setValideeParAdmin(false);
            reclamation.setConfirmeParClient(null);
            repo.save(reclamation);

            Historique historique = new Historique();
            historique.setAncienStatus(ancienStatus);
            historique.setNouveauStatus("résolu (en validation)");
            historique.setAction("Agent a marqué la réclamation #" + reclamation.getId() + " comme résolue - en attente de validation admin");
            historique.setReclamation(reclamation);
            historique.setUser(currentUser);
            historique.setDateAction(LocalDateTime.now());
            historiqueRepository.save(historique);

            List<User> admins = userRepository.findByRole_Name("admin");
            for (User admin : admins) {
                Notification notification = new Notification();
                notification.setUser(admin);
                notification.setReclamation(reclamation);
                notification.setMessage("Réclamation #" + reclamation.getId() + " \"" + reclamation.getTitre() + "\" marquée résolue par l'agent - en attente de votre validation");
                notification.setDateEnvoi(LocalDateTime.now());
                notification.setLue(false);
                notificationRepository.save(notification);
            }
            return;
        }

        repo.save(reclamation);

        Historique historique = new Historique();
        historique.setAncienStatus(ancienStatus);
        historique.setNouveauStatus(status.getStatus());
        historique.setAction("Statut changé de " + ancienStatus + " vers " + status.getStatus() + " pour réclamation #" + reclamation.getId());
        historique.setReclamation(reclamation);
        historique.setUser(currentUser);
        historique.setDateAction(LocalDateTime.now());
        historiqueRepository.save(historique);

        Notification notification = new Notification();
        notification.setUser(reclamation.getClient().getUser());
        notification.setReclamation(reclamation);
        notification.setMessage("Le statut de votre réclamation \"" + reclamation.getTitre() + "\" est maintenant : " + status.getStatus());
        notification.setDateEnvoi(LocalDateTime.now());
        notification.setLue(false);
        notificationRepository.save(notification);
    }

    public void validerReclamation(Long id, Authentication authentication) {
        String email = authentication.getName();
        User admin = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
        if (!"admin".equals(admin.getRole().getName()) && !"manager".equals(admin.getRole().getName())) {
            throw new RuntimeException("Accès refusé");
        }

        Reclamation reclamation = repo.findById(id)
            .orElseThrow(() -> new RuntimeException("Réclamation introuvable"));

        reclamation.setValideeParAdmin(true);
        reclamation.setDateModification(LocalDateTime.now());
        repo.save(reclamation);

        Historique historique = new Historique();
        historique.setAncienStatus("résolu (en validation)");
        historique.setNouveauStatus("résolu (validée)");
        historique.setAction("Admin a validé la résolution de la réclamation #" + reclamation.getId() + " et l'a envoyée au client");
        historique.setReclamation(reclamation);
        historique.setUser(admin);
        historique.setDateAction(LocalDateTime.now());
        historiqueRepository.save(historique);

        Notification notification = new Notification();
        notification.setUser(reclamation.getClient().getUser());
        notification.setReclamation(reclamation);
        notification.setMessage("Votre réclamation \"" + reclamation.getTitre() + "\" a été résolue. Veuillez confirmer ou nous faire part de votre retour.");
        notification.setDateEnvoi(LocalDateTime.now());
        notification.setLue(false);
        notificationRepository.save(notification);
    }

    public void confirmerReclamation(Long id, Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
        if (user.getClient() == null) {
            throw new RuntimeException("Accès refusé");
        }

        Reclamation reclamation = repo.findById(id)
            .orElseThrow(() -> new RuntimeException("Réclamation introuvable"));
        if (!reclamation.getClient().getId().equals(user.getClient().getId())) {
            throw new RuntimeException("Accès refusé");
        }

        reclamation.setConfirmeParClient(true);
        reclamation.setDateModification(LocalDateTime.now());
        repo.save(reclamation);

        Historique historique = new Historique();
        historique.setAncienStatus("résolu (validée)");
        historique.setNouveauStatus("fermée");
        historique.setAction("Client a confirmé la résolution de la réclamation #" + reclamation.getId());
        historique.setReclamation(reclamation);
        historique.setUser(user);
        historique.setDateAction(LocalDateTime.now());
        historiqueRepository.save(historique);

        List<User> admins = userRepository.findByRole_Name("admin");
        for (User a : admins) {
            Notification notification = new Notification();
            notification.setUser(a);
            notification.setReclamation(reclamation);
            notification.setMessage("Le client a confirmé la résolution de la réclamation #" + reclamation.getId() + " \"" + reclamation.getTitre() + "\"");
            notification.setDateEnvoi(LocalDateTime.now());
            notification.setLue(false);
            notificationRepository.save(notification);
        }
    }

    public void rejeterReclamation(Long id, String feedback, Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
        if (user.getClient() == null) {
            throw new RuntimeException("Accès refusé");
        }

        Reclamation reclamation = repo.findById(id)
            .orElseThrow(() -> new RuntimeException("Réclamation introuvable"));
        if (!reclamation.getClient().getId().equals(user.getClient().getId())) {
            throw new RuntimeException("Accès refusé");
        }
        User agent = userRepository.findByEmail(reclamation.getAffectations().get(0).getAgent().getUser().getEmail())
            .orElseThrow(() -> new RuntimeException("Agent introuvable"));

        Status enAttente = statusRepository.findById(1L)
            .orElseThrow(() -> new RuntimeException("Status introuvable"));

        String ancienStatus = reclamation.getStatus().getStatus();
        reclamation.setStatus(enAttente);
        reclamation.setValideeParAdmin(null);
        reclamation.setConfirmeParClient(false);
        reclamation.setDateModification(LocalDateTime.now());
        repo.save(reclamation);

        Historique historique = new Historique();
        historique.setAncienStatus(ancienStatus);
        historique.setNouveauStatus("en attente (rejetée par client)");
        historique.setAction("Client a rejeté la résolution de la réclamation #" + reclamation.getId() + " - Feedback: " + feedback);
        historique.setReclamation(reclamation);
        historique.setUser(user);
        historique.setDateAction(LocalDateTime.now());
        historiqueRepository.save(historique);

        List<User> admins = userRepository.findByRole_Name("admin");
        List<User> managers = userRepository.findByRole_Name("manager");

        List<User> toNotify = new ArrayList<>();
        toNotify.addAll(admins);
        toNotify.addAll(managers);
        toNotify.add(agent);
        for (User u : toNotify) {
            Notification notification = new Notification();
            notification.setUser(u);
            notification.setReclamation(reclamation);
            notification.setMessage("Le client a rejeté la résolution de la réclamation #" + reclamation.getId() + " \"" + reclamation.getTitre() + "\" - Feedback: " + feedback);
            notification.setDateEnvoi(LocalDateTime.now());
            notification.setLue(false);
            notificationRepository.save(notification);
        }
    }

    public void changePriority(Long id, Long priorityId) {
        Reclamation reclamation = repo.findById(id)
            .orElseThrow(() -> new RuntimeException("Réclamation introuvable"));
        Priority priority = priorityRepository.findById(priorityId)
            .orElseThrow(() -> new RuntimeException("Priorité introuvable"));
        reclamation.setPriority(priority);
        reclamation.setDateModification(LocalDateTime.now());
        repo.save(reclamation);
    }

    public Page<Reclamation> getAllReclamations(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("dateDepot").descending());
        return repo.findAll(pageable);
    }

    public Page<Reclamation> getReclamationByClient(Long clientId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("dateDepot").descending());
        return repo.findByClientId(clientId, pageable);
    }

    public Page<Reclamation> filterReclamations(Long statusId, Long priorityId, Long categorieId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("dateDepot").descending());
        if (statusId != null && priorityId != null && categorieId != null) {
            return repo.findByStatusIdAndPriorityIdAndCategorieId(statusId, priorityId, categorieId, pageable);
        }
        if (statusId != null && priorityId != null) {
            return repo.findByStatusIdAndPriorityId(statusId, priorityId, pageable);
        }
        if (statusId != null && categorieId != null) {
            return repo.findByStatusIdAndCategorieId(statusId, categorieId, pageable);
        }
        if (priorityId != null && categorieId != null) {
            return repo.findByPriorityIdAndCategorieId(priorityId, categorieId, pageable);
        }
        if (statusId != null) {
            return repo.findByStatusId(statusId, pageable);
        }
        if (priorityId != null) {
            return repo.findByPriorityId(priorityId, pageable);
        }
        if (categorieId != null) {
            return repo.findByCategorieId(categorieId, pageable);
        }
        return repo.findAll(pageable);
    }

    public Map<String, Long> getStatistiques() {
        Map<String, Long> statistiques = new HashMap<>();
        statistiques.put("enAttente", repo.countByStatus_Status("en attente"));
        statistiques.put("enCours", repo.countByStatus_Status("en cours"));
        statistiques.put("resolu", repo.countByStatus_Status("résolu"));
        return statistiques;
    }

    public Map<String, Object> getStatistiquesAvancees() {
        Map<String, Object> stats = new LinkedHashMap<>();
        
        Map<String, Long> parStatut = new HashMap<>();
        parStatut.put("enAttente", repo.countByStatus_Status("en attente"));
        parStatut.put("enCours", repo.countByStatus_Status("en cours"));
        parStatut.put("resolu", repo.countByStatus_Status("résolu"));
        stats.put("parStatut", parStatut);
        
        Map<String, Long> parPriorite = new HashMap<>();
        List<Object[]> prioriteStats = repo.countByPriority();
        for (Object[] p : prioriteStats) {
            parPriorite.put((String) p[0], (Long) p[1]);
        }
        stats.put("parPriorite", parPriorite);
        
        stats.put("total", repo.count());
        
        long resolues = repo.countByStatus_Status("résolu");
        long total = repo.count();
        stats.put("tauxResolution", total > 0 ? (resolues * 100.0 / total) : 0);
        
        return stats;
    }

    public List<Map<String, Object>> getEvolution(String periode, int jours) {
        List<Map<String, Object>> evolution = new ArrayList<>();
        LocalDate today = LocalDate.now();
        
        for (int i = jours - 1; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            Map<String, Object> point = new LinkedHashMap<>();
            
            if (periode.equals("day")) {
                point.put("label", date.toString());
                point.put("count", repo.countByDateDepot(date));
                point.put("resolved", repo.countResolvedByDate(date));
            } else if (periode.equals("week")) {
                point.put("label", "Semaine " + (jours - i));
                point.put("count", repo.countByWeek(jours - i - 1));
            } else {
                point.put("label", date.getMonth().toString());
                point.put("count", repo.countByMonth(date.getMonthValue(), date.getYear()));
            }
            
            evolution.add(point);
        }
        return evolution;
    }

    public List<Map<String, Object>> getTopCategories(int limit) {
        List<Map<String, Object>> categories = new ArrayList<>();
        Pageable pageable = PageRequest.of(0, limit);
        List<Object[]> results = repo.countByCategorieWithLimit(pageable);
        
        for (Object[] row : results) {
            Map<String, Object> cat = new LinkedHashMap<>();
            cat.put("name", (String) row[0]);
            cat.put("count", (Long) row[1]);
            categories.add(cat);
        }
        return categories;
    }

    public Map<String, Object> getTempsMoyenResolution() {
        Map<String, Object> result = new LinkedHashMap<>();
        
        Double avgHours = repo.getAverageResolutionTimeHours();
        result.put("moyenneHeures", avgHours != null ? avgHours : 0);
        
        Map<String, Double> parPriorite = new HashMap<>();
        List<Object[]> byPriority = repo.getAverageResolutionTimeByPriority();
        for (Object[] p : byPriority) {
            parPriorite.put((String) p[0], (Double) p[1]);
        }
        result.put("parPriorite", parPriorite);
        
        return result;
    }
}