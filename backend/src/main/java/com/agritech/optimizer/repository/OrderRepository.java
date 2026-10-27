package com.agritech.optimizer.repository;

import com.agritech.optimizer.entity.Order;
import com.agritech.optimizer.entity.OrderStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/** @author Ashmi Hettige */
public interface OrderRepository extends JpaRepository<Order, Long> {

    // each list loads the order, its people, items, listings and crops together,
    // so showing 10 orders does not run dozens of extra queries (the N+1 problem)
    @EntityGraph(attributePaths = {"buyer", "farmer", "items", "items.listing", "items.listing.crop"})
    List<Order> findByBuyerIdOrderByCreatedAtDesc(Long buyerId);

    @EntityGraph(attributePaths = {"buyer", "farmer", "items", "items.listing", "items.listing.crop"})
    List<Order> findByFarmerIdOrderByCreatedAtDesc(Long farmerId);

    @EntityGraph(attributePaths = {"buyer", "farmer", "items", "items.listing", "items.listing.crop"})
    Optional<Order> findWithDetailsById(Long id);

    // delivered orders since the start of the month, for the Sold and Revenue cards
    @EntityGraph(attributePaths = "items")
    List<Order> findByFarmerIdAndStatusAndCreatedAtGreaterThanEqual(Long farmerId, OrderStatus status,
                                                                    LocalDateTime from);

    long countByFarmerIdAndStatus(Long farmerId, OrderStatus status);

    // confirmed orders not yet on a trip: the trip planner's input
    List<Order> findByStatusAndTripIsNull(OrderStatus status);
}