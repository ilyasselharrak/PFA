package com.emsi.pfa.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.emsi.pfa.model.Reclamation;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ReclamationRepository extends JpaRepository<Reclamation, Long>{
    List<Reclamation> findAllByOrderByDateDepotDesc();
    List<Reclamation> findByClientId(Long clientId);
    Page<Reclamation> findByClientId(Long clientId, Pageable pageable);
    Page<Reclamation> findByStatusId(Long statusId, Pageable pageable);
    Page<Reclamation> findByPriorityId(Long priorityId, Pageable pageable);
    Page<Reclamation> findByCategorieId(Long categorieId, Pageable pageable);
    Page<Reclamation> findByStatusIdAndPriorityId(Long statusId, Long priorityId, Pageable pageable);
    Page<Reclamation> findByStatusIdAndCategorieId(Long statusId, Long categorieId, Pageable pageable);
    Page<Reclamation> findByPriorityIdAndCategorieId(Long priorityId, Long categorieId, Pageable pageable);
    Page<Reclamation> findByStatusIdAndPriorityIdAndCategorieId(Long statusId, Long priorityId, Long categorieId, Pageable pageable);
    long countByStatus_Status(String status);
    
    @Query("SELECT r.priority.priority, COUNT(r) FROM Reclamation r GROUP BY r.priority.priority")
    List<Object[]> countByPriority();
    
    @Query("SELECT COUNT(r) FROM Reclamation r WHERE DATE(r.dateDepot) = :date")
    long countByDateDepot(@Param("date") LocalDate date);
    
    @Query("SELECT COUNT(r) FROM Reclamation r WHERE DATE(r.dateDepot) = :date AND r.status.status = 'résolu'")
    long countResolvedByDate(@Param("date") LocalDate date);
    
    @Query(value = "SELECT COUNT(*) FROM reclamation WHERE YEARWEEK(date_depot) = YEARWEEK(CURDATE()) - :weekOffset", nativeQuery = true)
    long countByWeek(@Param("weekOffset") int weekOffset);
    
    @Query("SELECT COUNT(r) FROM Reclamation r WHERE MONTH(r.dateDepot) = :month AND YEAR(r.dateDepot) = :year")
    long countByMonth(@Param("month") int month, @Param("year") int year);
    
    @Query("SELECT r.categorie.categorie, COUNT(r) FROM Reclamation r GROUP BY r.categorie.categorie ORDER BY COUNT(r) DESC")
    List<Object[]> countByCategorieWithLimit(Pageable pageable);
    
    @Query("SELECT AVG(TIMESTAMPDIFF(HOUR, r.dateDepot, r.dateModification)) FROM Reclamation r WHERE r.status.status = 'résolu'")
    Double getAverageResolutionTimeHours();
    
    @Query("SELECT r.priority.priority, AVG(TIMESTAMPDIFF(HOUR, r.dateDepot, r.dateModification)) FROM Reclamation r WHERE r.status.status = 'résolu' GROUP BY r.priority.priority")
    List<Object[]> getAverageResolutionTimeByPriority();
    
    long countByClientId(Long clientId);
    long countByClientIdAndStatusStatus(Long clientId, String status);
    List<Reclamation> findByPriorityId(Long priorityId);
    List<Reclamation> findByStatusId(Long statusId);
    List<Reclamation> findByCategorieId(Long categorieId);
}