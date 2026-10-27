package com.agritech.optimizer.repository;

import com.agritech.optimizer.entity.FarmerProfile;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

/** @author Ashmi Hettige */
public interface FarmerProfileRepository extends JpaRepository<FarmerProfile, Long> {

    Optional<FarmerProfile> findByUserId(Long userId);

    // farm names for one page of listings, fetched in a single query
    List<FarmerProfile> findByUserIdIn(Collection<Long> userIds);

    // farm list for the marketplace filter; the user is loaded too, for the district
    @EntityGraph(attributePaths = "user")
    List<FarmerProfile> findAllByOrderByFarmNameAsc();
}