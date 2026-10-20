package com.agritech.optimizer.repository;

import com.agritech.optimizer.entity.ListingStatus;
import com.agritech.optimizer.entity.ProduceListing;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/** @author Ashmi Hettige */
public interface ProduceListingRepository extends JpaRepository<ProduceListing, Long> {

    List<ProduceListing> findByFarmerIdAndStatusNot(Long farmerId, ListingStatus status);
}