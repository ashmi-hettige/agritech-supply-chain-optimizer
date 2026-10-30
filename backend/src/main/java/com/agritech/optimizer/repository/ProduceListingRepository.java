package com.agritech.optimizer.repository;

import com.agritech.optimizer.entity.ListingStatus;
import com.agritech.optimizer.entity.ProduceListing;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

/** @author Ashmi Hettige */
public interface ProduceListingRepository
        extends JpaRepository<ProduceListing, Long>, JpaSpecificationExecutor<ProduceListing> {

    // load crop and farmer in the same query, so a page of 12 listings is 1 query, not 25
    @Override
    @EntityGraph(attributePaths = {"crop", "farmer"})
    Page<ProduceListing> findAll(Specification<ProduceListing> spec, Pageable pageable);

    @EntityGraph(attributePaths = {"crop", "farmer"})
    Optional<ProduceListing> findWithDetailsById(Long id);

    @EntityGraph(attributePaths = {"crop", "farmer"})
    List<ProduceListing> findByFarmerIdAndStatusNotOrderByCreatedAtDesc(Long farmerId, ListingStatus status);

    @Query("select case when count(oi) > 0 then true else false end "
            + "from OrderItem oi where oi.listing.id = :listingId")
    boolean hasOrders(@Param("listingId") Long listingId);

    boolean existsByCropId(Long cropId);

    long countByStatus(ListingStatus status);

    // SELECT ... FOR UPDATE: locks these rows until checkout commits, so two buyers
    // cannot both buy the last 50 kg at the same moment
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select l from ProduceListing l where l.id in :ids")
    List<ProduceListing> findAllForUpdate(@Param("ids") Collection<Long> ids);
}