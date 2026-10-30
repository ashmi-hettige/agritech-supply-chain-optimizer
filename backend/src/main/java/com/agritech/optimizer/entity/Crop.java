package com.agritech.optimizer.entity;

import jakarta.persistence.*;

/**
 * A crop type sold on the platform, with its typical shelf life.
 *
 * @author Ashmi Hettige
 */
@Entity
@Table(name = "crops")
public class Crop {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 60)
    private String name;

    @Column(nullable = false, length = 30)
    private String category;

    // used to work out each listing's expiry date and freshness score
    @Column(name = "shelf_life_days", nullable = false)
    private int shelfLifeDays;

    @Column(name = "needs_cold_chain", nullable = false)
    private boolean needsColdChain;

    @Column(name = "image_url", length = 255)
    private String imageUrl;

    protected Crop() {
    }

    public Crop(String name, String category, int shelfLifeDays, boolean needsColdChain) {
        this.name = name;
        this.category = category;
        this.shelfLifeDays = shelfLifeDays;
        this.needsColdChain = needsColdChain;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public int getShelfLifeDays() {
        return shelfLifeDays;
    }

    public void setShelfLifeDays(int shelfLifeDays) {
        this.shelfLifeDays = shelfLifeDays;
    }

    public boolean isNeedsColdChain() {
        return needsColdChain;
    }

    public void setNeedsColdChain(boolean needsColdChain) {
        this.needsColdChain = needsColdChain;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }
}