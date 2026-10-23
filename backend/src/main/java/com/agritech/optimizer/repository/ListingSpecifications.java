package com.agritech.optimizer.repository;

import com.agritech.optimizer.entity.ListingStatus;
import com.agritech.optimizer.entity.ProduceListing;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Builds the marketplace WHERE clause from whichever filters the buyer filled in.
 *
 * @author Ashmi Hettige
 */
public final class ListingSpecifications {

    private ListingSpecifications() {
    }

    public static Specification<ProduceListing> forMarketplace(String q, Long cropId, String district,
                                                               BigDecimal minPrice, BigDecimal maxPrice,
                                                               LocalDate today) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // buyers only see listings that are on sale and not past their expiry date
            predicates.add(cb.equal(root.get("status"), ListingStatus.AVAILABLE));
            predicates.add(cb.greaterThanOrEqualTo(root.<LocalDate>get("expiryDate"), today));

            if (q != null && !q.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("crop").<String>get("name")),
                        "%" + q.trim().toLowerCase() + "%"));
            }
            if (cropId != null) {
                predicates.add(cb.equal(root.get("crop").get("id"), cropId));
            }
            if (district != null && !district.isBlank()) {
                predicates.add(cb.equal(cb.lower(root.<String>get("district")), district.trim().toLowerCase()));
            }
            if (minPrice != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.<BigDecimal>get("pricePerKg"), minPrice));
            }
            if (maxPrice != null) {
                predicates.add(cb.lessThanOrEqualTo(root.<BigDecimal>get("pricePerKg"), maxPrice));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}