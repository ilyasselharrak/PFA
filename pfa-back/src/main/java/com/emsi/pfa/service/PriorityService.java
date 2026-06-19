package com.emsi.pfa.service;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import java.util.List;
import com.emsi.pfa.model.Priority;
import com.emsi.pfa.repository.PriorityRepository;
import com.emsi.pfa.repository.ReclamationRepository;
import com.emsi.pfa.model.Reclamation;
@Service
public class PriorityService {
    @Autowired
        private PriorityRepository repo;
    @Autowired
      private ReclamationRepository reclamationRepo;
        
    public void CreatePriority(Priority priority){
    if(repo.existsByPriority(priority.getPriority())){
        throw new RuntimeException("priority deja exist");
    }
        repo.save(priority);
    }
  public void UpdatePriority(Long id , Priority Newpriority){
    Priority priority = repo.findById(id)
           .orElseThrow(() -> new RuntimeException("Status non trouver"));
    priority.setPriority(Newpriority.getPriority());
    repo.save(priority);
  }
  public void DeletePriority(Long id) {

    Priority priority = repo.findById(id)
            .orElseThrow(() -> new RuntimeException("Priorité non trouvée"));

    Priority inconnu = repo.findByPriority("inconnu")
            .orElseThrow(() -> new RuntimeException("La priorité 'inconnu' n'existe pas"));

    List<Reclamation> reclamations = reclamationRepo.findByPriorityId(id);

    for (Reclamation r : reclamations) {
        r.setPriority(inconnu);
    }

    reclamationRepo.saveAll(reclamations);

    repo.delete(priority);
}

  public List<Priority> getAllPriority(){
    return repo.findAll();
  }
}
