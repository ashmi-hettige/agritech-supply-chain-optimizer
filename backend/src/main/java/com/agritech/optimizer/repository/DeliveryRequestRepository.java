package com.agritech.optimizer.repository;

import com.agritech.optimizer.entity.DeliveryRequest;
import com.agritech.optimizer.entity.DeliveryRequestStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/** @author Ashmi Hettige */
public interface DeliveryRequestRepository extends JpaRepository<DeliveryRequest, Long> {

    // farmer's Incoming orders page: the latest request for each order
    @EntityGraph(attributePaths = {"order", "transporter"})
    List<DeliveryRequest> findByOrderFarmerIdOrderByCreatedAtDesc(Long farmerId);

    // transporter's Requests page
    @EntityGraph(attributePaths = {"order", "order.farmer", "order.buyer"})
    List<DeliveryRequest> findByTransporterIdAndStatusOrderByTripDateAsc(Long transporterId, DeliveryRequestStatus status);

    boolean existsByOrderIdAndStatus(Long orderId, DeliveryRequestStatus status);

    List<DeliveryRequest> findByStatus(DeliveryRequestStatus status);
}
