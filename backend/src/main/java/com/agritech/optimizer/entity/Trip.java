package com.agritech.optimizer.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * One vehicle's planned route for a day, visiting several orders in sequence.
 *
 * @author Ashmi Hettige
 */
@Entity
@Table(name = "trips")
public class Trip {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @Column(name = "trip_date", nullable = false)
    private LocalDate tripDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TripStatus status = TripStatus.PLANNED;

    @Column(name = "total_distance_km", precision = 10, scale = 2)
    private BigDecimal totalDistanceKm;

    @Column(name = "total_load_kg", precision = 10, scale = 2)
    private BigDecimal totalLoadKg;

    // no cascade: deleting a trip must never delete the customers' orders
    @OneToMany(mappedBy = "trip")
    @OrderBy("stopSequence ASC")
    private List<Order> orders = new ArrayList<>();

    protected Trip() {
    }

    public Trip(Vehicle vehicle, LocalDate tripDate) {
        this.vehicle = vehicle;
        this.tripDate = tripDate;
    }

    public Long getId() {
        return id;
    }

    public Vehicle getVehicle() {
        return vehicle;
    }

    public LocalDate getTripDate() {
        return tripDate;
    }

    public TripStatus getStatus() {
        return status;
    }

    public void setStatus(TripStatus status) {
        this.status = status;
    }

    public BigDecimal getTotalDistanceKm() {
        return totalDistanceKm;
    }

    public void setTotalDistanceKm(BigDecimal totalDistanceKm) {
        this.totalDistanceKm = totalDistanceKm;
    }

    public BigDecimal getTotalLoadKg() {
        return totalLoadKg;
    }

    public void setTotalLoadKg(BigDecimal totalLoadKg) {
        this.totalLoadKg = totalLoadKg;
    }

    public List<Order> getOrders() {
        return orders;
    }
}