package com.agritech.optimizer.repository;

import com.agritech.optimizer.entity.MarketPrice;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/** @author Ashmi Hettige */
public interface MarketPriceRepository extends JpaRepository<MarketPrice, Long> {

    // newest first, with the centre loaded, for the latest price and 7-day average
    @EntityGraph(attributePaths = "centre")
    List<MarketPrice> findByCropIdAndPriceDateGreaterThanEqualOrderByPriceDateDesc(Long cropId, LocalDate from);

    // the admin's "save price" updates this row if it already exists (unique crop + centre + date)
    Optional<MarketPrice> findByCropIdAndCentreIdAndPriceDate(Long cropId, Long centreId, LocalDate priceDate);

    @EntityGraph(attributePaths = {"crop", "centre"})
    List<MarketPrice> findByPriceDateAndCropIdOrderByCentreNameAsc(LocalDate priceDate, Long cropId);

    long countByPriceDate(LocalDate priceDate);

    // price history is reference data, so it is removed together with its crop or centre
    @Modifying
    @Query("delete from MarketPrice p where p.crop.id = :cropId")
    int deleteAllByCropId(@Param("cropId") Long cropId);

    @Modifying
    @Query("delete from MarketPrice p where p.centre.id = :centreId")
    int deleteAllByCentreId(@Param("centreId") Long centreId);
}
