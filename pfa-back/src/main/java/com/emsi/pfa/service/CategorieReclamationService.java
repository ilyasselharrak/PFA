package com.emsi.pfa.service;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import com.emsi.pfa.model.CategorieReclamation;
import com.emsi.pfa.repository.CategorieReclamationRepository;
import com.emsi.pfa.repository.ReclamationRepository;
import com.emsi.pfa.repository.ReclamationRepository;
import com.emsi.pfa.model.Reclamation;
import java.util.List;

@Service
public class CategorieReclamationService {
    @Autowired
        private CategorieReclamationRepository repo;
    @Autowired
        private ReclamationRepository reclamationRepo;

    public void CreateCategorie(CategorieReclamation categoriereclamation){
    if(repo.existsByCategorie(categoriereclamation.getCategorie())){
        throw new RuntimeException("Categorie deja exist");
    }
        repo.save(categoriereclamation);
    }
  public void UpdateCategorie(Long id , CategorieReclamation Newcategoriereclamation){
    CategorieReclamation categoriereclamation = repo.findById(id)
                          .orElseThrow(() -> new RuntimeException("Categorie non trouver"));
    categoriereclamation.setCategorie(Newcategoriereclamation.getCategorie());
    repo.save(categoriereclamation);
  }
  public void DeleteCategorie(Long id){
    CategorieReclamation categoriereclamation = repo.findById(id)
           .orElseThrow(() -> new RuntimeException("Categorie non trouver"));
    CategorieReclamation inconnu = repo.findByCategorie("inconnu")
            .orElseThrow(() -> new RuntimeException("La catégorie 'inconnu' n'existe pas"));
    List<Reclamation> reclamations = reclamationRepo.findByCategorieId(id);
    for (Reclamation r : reclamations) {
        r.setCategorie(inconnu);
    }
    reclamationRepo.saveAll(reclamations);
    repo.delete(categoriereclamation);

  }
  public List<CategorieReclamation> getAllCategorie(){
    return repo.findAll();
  }
}
