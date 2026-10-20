package com.agritech.optimizer.repository;

import com.agritech.optimizer.entity.MarketPrice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

/** @author Ashmi Hettige */
public interface MarketPriceRepository extends JpaRepository<MarketPrice, Long> {

    // prices for one crop from a start date onwards, used for the 7-day average
    List<MarketPrice> findByCropIdAndPriceDateGreaterThanEqual(Long cropId, LocalDate from);
}