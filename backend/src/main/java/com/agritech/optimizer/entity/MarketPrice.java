package com.agritech.optimizer.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Daily wholesale price (Rs per kg) of a crop at a collection centre.
 *
 * @author Ashmi Hettige
 */
@Entity
@Table(
        name = "market_prices",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_price_crop_centre_date",
                columnNames = {"crop_id", "centre_id", "price_date"}),
        indexes = @Index(name = "idx_price_crop_date", columnList = "crop_id, price_date"))
public class MarketPrice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "crop_id", nullable = false)
    private Crop crop;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "centre_id", nullable = false)
    private CollectionCentre centre;

    @Column(name = "price_date", nullable = false)
    private LocalDate priceDate;

    // BigDecimal avoids rounding errors that double has with money
    @Column(name = "min_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal minPrice;

    @Column(name = "max_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal maxPrice;

    @Column(name = "avg_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal avgPrice;

    protected MarketPrice() {
    }

    public MarketPrice(Crop crop, CollectionCentre centre, LocalDate priceDate,
                       BigDecimal minPrice, BigDecimal maxPrice, BigDecimal avgPrice) {
        this.crop = crop;
        this.centre = centre;
        this.priceDate = priceDate;
        this.minPrice = minPrice;
        this.maxPrice = maxPrice;
        this.avgPrice = avgPrice;
    }

    public Long getId() {
        return id;
    }

    public Crop getCrop() {
        return crop;
    }

    public CollectionCentre getCentre() {
        return centre;
    }

    public LocalDate getPriceDate() {
        return priceDate;
    }

    public BigDecimal getMinPrice() {
        return minPrice;
    }

    public void setMinPrice(BigDecimal minPrice) {
        this.minPrice = minPrice;
    }

    public BigDecimal getMaxPrice() {
        return maxPrice;
    }

    public void setMaxPrice(BigDecimal maxPrice) {
        this.maxPrice = maxPrice;
    }

    public BigDecimal getAvgPrice() {
        return avgPrice;
    }

    public void setAvgPrice(BigDecimal avgPrice) {
        this.avgPrice = avgPrice;
    }
}