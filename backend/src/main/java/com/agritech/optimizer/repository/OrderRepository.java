package com.agritech.optimizer.repository;

import com.agritech.optimizer.entity.Order;
import com.agritech.optimizer.entity.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/** @author Ashmi Hettige */
public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findByBuyerIdOrderByCreatedAtDesc(Long buyerId);

    List<Order> findByFarmerIdOrderByCreatedAtDesc(Long farmerId);

    // confirmed orders not yet on a trip: the trip planner's input
    List<Order> findByStatusAndTripIsNull(OrderStatus status);
}