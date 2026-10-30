package com.agritech.optimizer.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

/**
 * A lorry or van owned by a transporter.
 *
 * @author Ashmi Hettige
 */
@Entity
@Table(name = "vehicles")
public class Vehicle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "transporter_id", nullable = false)
    private User transporter;

    @Column(name = "plate_no", nullable = false, unique = true, length = 15)
    private String plateNo;

    @Column(nullable = false, length = 30)
    private String type;

    // the bin size used by the First-Fit Decreasing load planner
    @Column(name = "capacity_kg", nullable = false, precision = 10, scale = 2)
    private BigDecimal capacityKg;

    @Column(nullable = false)
    private boolean refrigerated;

    protected Vehicle() {
    }

    public Vehicle(User transporter, String plateNo, String type,
                   BigDecimal capacityKg, boolean refrigerated) {
        this.transporter = transporter;
        this.plateNo = plateNo;
        this.type = type;
        this.capacityKg = capacityKg;
        this.refrigerated = refrigerated;
    }

    public Long getId() {
        return id;
    }

    public User getTransporter() {
        return transporter;
    }

    public String getPlateNo() {
        return plateNo;
    }

    public void setPlateNo(String plateNo) {
        this.plateNo = plateNo;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public BigDecimal getCapacityKg() {
        return capacityKg;
    }

    public void setCapacityKg(BigDecimal capacityKg) {
        this.capacityKg = capacityKg;
    }

    public boolean isRefrigerated() {
        return refrigerated;
    }

    public void setRefrigerated(boolean refrigerated) {
        this.refrigerated = refrigerated;
    }
}