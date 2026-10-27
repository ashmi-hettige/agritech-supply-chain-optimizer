package com.agritech.optimizer.repository;

import com.agritech.optimizer.entity.ListingStatus;
import com.agritech.optimizer.entity.ProduceListing;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
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

    public static Specification<ProduceListing> forMarketplace(String q, List<Long> cropIds, String district,
                                                               Long farmerId, List<String> freshness,
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
            if (cropIds != null && !cropIds.isEmpty()) {
                predicates.add(root.get("crop").get("id").in(cropIds));
            }
            if (district != null && !district.isBlank()) {
                predicates.add(cb.equal(cb.lower(root.<String>get("district")), district.trim().toLowerCase()));
            }
            if (farmerId != null) {
                predicates.add(cb.equal(root.get("farmer").get("id"), farmerId));
            }
            if (minPrice != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.<BigDecimal>get("pricePerKg"), minPrice));
            }
            if (maxPrice != null) {
                predicates.add(cb.lessThanOrEqualTo(root.<BigDecimal>get("pricePerKg"), maxPrice));
            }
            if (freshness != null && !freshness.isEmpty()) {
                // several ticked levels are joined with OR: "Fresh OR Sell soon"
                List<Predicate> levels = new ArrayList<>();
                for (String level : freshness) {
                    Predicate predicate = freshnessLevel(level, root, cb, today);
                    if (predicate != null) {
                        levels.add(predicate);
                    }
                }
                if (!levels.isEmpty()) {
                    predicates.add(cb.or(levels.toArray(new Predicate[0])));
                }
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    /*
     * Same rule as FreshnessScorer, written without decimals so the database can check it:
     *   score = daysLeft / shelfLife
     *   FRESH      score > 0.5         ->  2 * daysLeft > shelfLife
     *   SELL_SOON  0.2 < score <= 0.5  ->  5 * daysLeft > shelfLife  and  2 * daysLeft <= shelfLife
     *   URGENT     score <= 0.2        ->  5 * daysLeft <= shelfLife
     */
    private static Predicate freshnessLevel(String level, Root<ProduceListing> root, CriteriaBuilder cb,
                                            LocalDate today) {
        Expression<Integer> daysLeft =
                cb.function("datediff", Integer.class, root.get("expiryDate"), cb.literal(today));
        Expression<Integer> shelfLife = root.get("crop").<Integer>get("shelfLifeDays");
        Expression<Integer> twiceDaysLeft = cb.prod(daysLeft, 2);
        Expression<Integer> fiveTimesDaysLeft = cb.prod(daysLeft, 5);

        return switch (level) {
            case "FRESH" -> cb.gt(twiceDaysLeft, shelfLife);
            case "SELL_SOON" -> cb.and(cb.gt(fiveTimesDaysLeft, shelfLife), cb.le(twiceDaysLeft, shelfLife));
            case "URGENT" -> cb.le(fiveTimesDaysLeft, shelfLife);
            default -> null; // unknown values are ignored
        };
    }
}