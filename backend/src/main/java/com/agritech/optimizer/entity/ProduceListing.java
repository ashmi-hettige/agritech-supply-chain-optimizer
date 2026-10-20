package com.agritech.optimizer.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * A batch of produce a farmer has put up for sale.
 *
 * @author Ashmi Hettige
 */
@Entity
@Table(
        name = "produce_listings",
        indexes = @Index(name = "idx_listing_status_crop_district",
                columnList = "status, crop_id, district"))
public class ProduceListing {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "farmer_id", nullable = false)
    private User farmer;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "crop_id", nullable = false)
    private Crop crop;

    @Column(name = "quantity_kg", nullable = false, precision = 10, scale = 2)
    private BigDecimal quantityKg;

    // falls as orders are placed; the listing becomes SOLD_OUT at zero
    @Column(name = "available_kg", nullable = false, precision = 10, scale = 2)
    private BigDecimal availableKg;

    @Column(name = "price_per_kg", nullable = false, precision = 10, scale = 2)
    private BigDecimal pricePerKg;

    @Column(name = "harvest_date", nullable = false)
    private LocalDate harvestDate;

    @Column(name = "expiry_date", nullable = false)
    private LocalDate expiryDate;

    @Column(length = 10)
    private String grade;

    @Column(length = 40)
    private String district;

    @Column(name = "pickup_lat", nullable = false)
    private double pickupLat;

    @Column(name = "pickup_lng", nullable = false)
    private double pickupLng;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ListingStatus status = ListingStatus.AVAILABLE;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
    }

    protected ProduceListing() {
    }

    public ProduceListing(User farmer, Crop crop, BigDecimal quantityKg, BigDecimal pricePerKg,
                          LocalDate harvestDate, String grade, String district,
                          double pickupLat, double pickupLng) {
        this.farmer = farmer;
        this.crop = crop;
        this.quantityKg = quantityKg;
        this.availableKg = quantityKg;
        this.pricePerKg = pricePerKg;
        this.grade = grade;
        this.district = district;
        this.pickupLat = pickupLat;
        this.pickupLng = pickupLng;
        setHarvestDate(harvestDate);
    }

    // expiry always follows the harvest date, so it cannot get out of sync
    public void setHarvestDate(LocalDate harvestDate) {
        this.harvestDate = harvestDate;
        this.expiryDate = harvestDate.plusDays(crop.getShelfLifeDays());
    }

    public Long getId() {
        return id;
    }

    public User getFarmer() {
        return farmer;
    }

    public Crop getCrop() {
        return crop;
    }

    public BigDecimal getQuantityKg() {
        return quantityKg;
    }

    public void setQuantityKg(BigDecimal quantityKg) {
        this.quantityKg = quantityKg;
    }

    public BigDecimal getAvailableKg() {
        return availableKg;
    }

    public void setAvailableKg(BigDecimal availableKg) {
        this.availableKg = availableKg;
    }

    public BigDecimal getPricePerKg() {
        return pricePerKg;
    }

    public void setPricePerKg(BigDecimal pricePerKg) {
        this.pricePerKg = pricePerKg;
    }

    public LocalDate getHarvestDate() {
        return harvestDate;
    }

    public LocalDate getExpiryDate() {
        return expiryDate;
    }

    public String getGrade() {
        return grade;
    }

    public void setGrade(String grade) {
        this.grade = grade;
    }

    public String getDistrict() {
        return district;
    }

    public void setDistrict(String district) {
        this.district = district;
    }

    public double getPickupLat() {
        return pickupLat;
    }

    public void setPickupLat(double pickupLat) {
        this.pickupLat = pickupLat;
    }

    public double getPickupLng() {
        return pickupLng;
    }

    public void setPickupLng(double pickupLng) {
        this.pickupLng = pickupLng;
    }

    public ListingStatus getStatus() {
        return status;
    }

    public void setStatus(ListingStatus status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}