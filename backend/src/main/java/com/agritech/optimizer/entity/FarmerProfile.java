package com.agritech.optimizer.entity;

import jakarta.persistence.*;

/**
 * Extra details for a user with the FARMER role, including farm location.
 *
 * @author Ashmi Hettige
 */
@Entity
@Table(name = "farmer_profiles")
public class FarmerProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // unique = true makes this a real one-to-one: a user can have only one profile
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "farm_name", nullable = false, length = 100)
    private String farmName;

    // farm location is the pickup point used by the trip planner
    @Column(nullable = false)
    private double latitude;

    @Column(nullable = false)
    private double longitude;

    // optional, so a wrapper type is used to allow null
    @Column(name = "land_size_acres")
    private Double landSizeAcres;

    protected FarmerProfile() {
    }

    public FarmerProfile(User user, String farmName, double latitude, double longitude) {
        this.user = user;
        this.farmName = farmName;
        this.latitude = latitude;
        this.longitude = longitude;
    }

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public String getFarmName() {
        return farmName;
    }

    public void setFarmName(String farmName) {
        this.farmName = farmName;
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

    public Double getLandSizeAcres() {
        return landSizeAcres;
    }

    public void setLandSizeAcres(Double landSizeAcres) {
        this.landSizeAcres = landSizeAcres;
    }
}