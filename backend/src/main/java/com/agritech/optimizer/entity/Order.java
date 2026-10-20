package com.agritech.optimizer.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * A buyer's order from one farmer. Checkout creates one order per farmer.
 *
 * @author Ashmi Hettige
 */
@Entity
@Table(name = "orders") // "order" is a reserved word in SQL
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "buyer_id", nullable = false)
    private User buyer;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "farmer_id", nullable = false)
    private User farmer;

    // null until the trip planner assigns this order to a vehicle
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_id")
    private Trip trip;

    @Column(name = "stop_sequence")
    private Integer stopSequence;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private OrderStatus status = OrderStatus.PLACED;

    @Column(name = "total_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Column(name = "delivery_address", nullable = false, length = 255)
    private String deliveryAddress;

    @Column(name = "delivery_lat", nullable = false)
    private double deliveryLat;

    @Column(name = "delivery_lng", nullable = false)
    private double deliveryLng;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // items belong to the order: saved, updated and deleted together with it
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items = new ArrayList<>();

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
    }

    protected Order() {
    }

    public Order(User buyer, User farmer, String deliveryAddress,
                 double deliveryLat, double deliveryLng) {
        this.buyer = buyer;
        this.farmer = farmer;
        this.deliveryAddress = deliveryAddress;
        this.deliveryLat = deliveryLat;
        this.deliveryLng = deliveryLng;
    }

    // keeps both sides of the relationship in sync and the total correct
    public void addItem(OrderItem item) {
        items.add(item);
        item.setOrder(this);
        totalAmount = totalAmount.add(item.getLineTotal());
    }

    public void assignToTrip(Trip trip, int stopSequence) {
        this.trip = trip;
        this.stopSequence = stopSequence;
        this.status = OrderStatus.ASSIGNED;
    }

    public Long getId() {
        return id;
    }

    public User getBuyer() {
        return buyer;
    }

    public User getFarmer() {
        return farmer;
    }

    public Trip getTrip() {
        return trip;
    }

    public Integer getStopSequence() {
        return stopSequence;
    }

    public OrderStatus getStatus() {
        return status;
    }

    public void setStatus(OrderStatus status) {
        this.status = status;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public String getDeliveryAddress() {
        return deliveryAddress;
    }

    public double getDeliveryLat() {
        return deliveryLat;
    }

    public double getDeliveryLng() {
        return deliveryLng;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public List<OrderItem> getItems() {
        return items;
    }
}