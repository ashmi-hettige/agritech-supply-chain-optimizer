package com.agritech.optimizer.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

/**
 * One line of an order: a quantity bought from a listing.
 *
 * @author Ashmi Hettige
 */
@Entity
@Table(name = "order_items")
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "listing_id", nullable = false)
    private ProduceListing listing;

    @Column(name = "quantity_kg", nullable = false, precision = 10, scale = 2)
    private BigDecimal quantityKg;

    // copied at checkout so later price changes don't alter past orders
    @Column(name = "unit_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal unitPrice;

    protected OrderItem() {
    }

    public OrderItem(ProduceListing listing, BigDecimal quantityKg) {
        this.listing = listing;
        this.quantityKg = quantityKg;
        this.unitPrice = listing.getPricePerKg();
    }

    public BigDecimal getLineTotal() {
        return unitPrice.multiply(quantityKg);
    }

    // package-private: only Order.addItem should set this
    void setOrder(Order order) {
        this.order = order;
    }

    public Long getId() {
        return id;
    }

    public Order getOrder() {
        return order;
    }

    public ProduceListing getListing() {
        return listing;
    }

    public BigDecimal getQuantityKg() {
        return quantityKg;
    }

    public BigDecimal getUnitPrice() {
        return unitPrice;
    }
}