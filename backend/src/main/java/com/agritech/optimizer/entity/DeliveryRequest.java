package com.agritech.optimizer.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * A farmer asking a transporter to deliver one confirmed order on a date and slot.
 * The transporter accepts (the order joins or starts a trip) or declines.
 *
 * @author Ashmi Hettige
 */
@Entity
@Table(name = "delivery_requests",
        indexes = @Index(name = "idx_request_transporter_status", columnList = "transporter_id, status"))
public class DeliveryRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "transporter_id", nullable = false)
    private User transporter;

    @Column(name = "trip_date", nullable = false)
    private LocalDate tripDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TripSlot slot;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private DeliveryRequestStatus status = DeliveryRequestStatus.PENDING;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
    }

    protected DeliveryRequest() {
    }

    public DeliveryRequest(Order order, User transporter, LocalDate tripDate, TripSlot slot) {
        this.order = order;
        this.transporter = transporter;
        this.tripDate = tripDate;
        this.slot = slot;
    }

    public Long getId() {
        return id;
    }

    public Order getOrder() {
        return order;
    }

    public User getTransporter() {
        return transporter;
    }

    public LocalDate getTripDate() {
        return tripDate;
    }

    public TripSlot getSlot() {
        return slot;
    }

    public DeliveryRequestStatus getStatus() {
        return status;
    }

    public void setStatus(DeliveryRequestStatus status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
