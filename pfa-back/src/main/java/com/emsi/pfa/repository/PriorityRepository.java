package com.emsi.pfa.repository;
import org.springframework.data.jpa.repository.JpaRepository;
import com.emsi.pfa.model.Priority;
import java.util.Optional;
public interface PriorityRepository extends JpaRepository<Priority, Long> {
    boolean existsByPriority(String priority);
    Optional<Priority> findByPriority( String priority);
    
}
