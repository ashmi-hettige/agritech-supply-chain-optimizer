package com.agritech.optimizer.repository;

import com.agritech.optimizer.entity.Crop;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/** @author Ashmi Hettige */
public interface CropRepository extends JpaRepository<Crop, Long> {

    List<Crop> findAllByOrderByNameAsc();

    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);
}