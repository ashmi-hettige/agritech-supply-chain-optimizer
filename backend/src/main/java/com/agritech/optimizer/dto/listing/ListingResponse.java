package com.agritech.optimizer.dto.listing;

import com.agritech.optimizer.entity.ListingStatus;
import com.agritech.optimizer.entity.ProduceListing;
import com.agritech.optimizer.optimizer.Freshness;
import com.agritech.optimizer.optimizer.FreshnessScorer;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * A listing as sent to the React app, including its freshness badge and farm name.
 *
 * @author Ashmi Hettige
 */
public record ListingResponse(
        Long id,
        Long cropId,
        String cropName,
        String cropImageUrl,
        Long farmerId,
        String farmerName,
        String farmName,
        BigDecimal quantityKg,
        BigDecimal availableKg,
        BigDecimal pricePerKg,
        LocalDate harvestDate,
        LocalDate expiryDate,
        String grade,
        String district,
        double pickupLat,
        double pickupLng,
        ListingStatus status,
        long daysLeft,
        double freshnessScore,
        String freshnessLabel,
        LocalDateTime createdAt) {

    public static ListingResponse from(ProduceListing listing, LocalDate today, String farmName) {
        Freshness freshness = FreshnessScorer.score(
                listing.getExpiryDate(), listing.getCrop().getShelfLifeDays(), today);

        return new ListingResponse(
                listing.getId(),
                listing.getCrop().getId(),
                listing.getCrop().getName(),
                listing.getCrop().getImageUrl(),
                listing.getFarmer().getId(),
                listing.getFarmer().getFullName(),
                farmName,
                listing.getQuantityKg(),
                listing.getAvailableKg(),
                listing.getPricePerKg(),
                listing.getHarvestDate(),
                listing.getExpiryDate(),
                listing.getGrade(),
                listing.getDistrict(),
                listing.getPickupLat(),
                listing.getPickupLng(),
                listing.getStatus(),
                freshness.daysLeft(),
                freshness.score(),
                freshness.label(),
                listing.getCreatedAt());
    }
}