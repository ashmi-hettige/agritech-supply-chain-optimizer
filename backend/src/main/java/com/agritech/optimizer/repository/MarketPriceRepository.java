package com.agritech.optimizer.repository;

import com.agritech.optimizer.entity.MarketPrice;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

/** @author Ashmi Hettige */
public interface MarketPriceRepository extends JpaRepository<MarketPrice, Long> {

    // newest first, with the centre loaded, for the latest price and 7-day average
    @EntityGraph(attributePaths = "centre")
    List<MarketPrice> findByCropIdAndPriceDateGreaterThanEqualOrderByPriceDateDesc(Long cropId, LocalDate from);
}