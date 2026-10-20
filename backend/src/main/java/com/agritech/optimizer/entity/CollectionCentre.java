package com.agritech.optimizer.entity;

import jakarta.persistence.*;

/**
 * An economic centre where produce is collected and traded, e.g. Dambulla.
 *
 * @author Ashmi Hettige
 */
@Entity
@Table(name = "collection_centres")
public class CollectionCentre {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 80)
    private String name;

    @Column(length = 40)
    private String district;

    // coordinates are used by the Haversine distance calculation in the optimizer
    @Column(nullable = false)
    private double latitude;

    @Column(nullable = false)
    private double longitude;

    protected CollectionCentre() {
    }

    public CollectionCentre(String name, String district, double latitude, double longitude) {
        this.name = name;
        this.district = district;
        this.latitude = latitude;
        this.longitude = longitude;
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

    public String getDistrict() {
        return district;
    }

    public void setDistrict(String district) {
        this.district = district;
    }

    public double getLatitude() {
        return latitude;
    }

    public void setLatitude(double latitude) {
        this.latitude = latitude;
    }

    public double getLongitude() {
        return longitude;
    }

    public void setLongitude(double longitude) {
        this.longitude = longitude;
    }
}