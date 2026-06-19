package com.emsi.pfa.repository;
import org.springframework.data.jpa.repository.JpaRepository;
import com.emsi.pfa.model.CategorieReclamation;
import java.util.Optional;
public interface CategorieReclamationRepository extends JpaRepository<CategorieReclamation, Long> {
        
    boolean existsByCategorie(String categorie);
    Optional<CategorieReclamation> findByCategorie(String categorie); 

}
