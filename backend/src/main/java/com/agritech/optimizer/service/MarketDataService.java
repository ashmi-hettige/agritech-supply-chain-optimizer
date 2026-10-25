package com.agritech.optimizer.service;

import com.agritech.optimizer.dto.reference.CentrePriceResponse;
import com.agritech.optimizer.dto.reference.CentreResponse;
import com.agritech.optimizer.dto.reference.CropResponse;
import com.agritech.optimizer.entity.MarketPrice;
import com.agritech.optimizer.exception.ResourceNotFoundException;
import com.agritech.optimizer.repository.CollectionCentreRepository;
import com.agritech.optimizer.repository.CropRepository;
import com.agritech.optimizer.repository.MarketPriceRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;

/**
 * Read-only reference data: crops, economic centres and market prices.
 *
 * @author Ashmi Hettige
 */
@Service
@Transactional(readOnly = true)
public class MarketDataService {

    private final CropRepository cropRepository;
    private final CollectionCentreRepository centreRepository;
    private final MarketPriceRepository priceRepository;

    public MarketDataService(CropRepository cropRepository,
                             CollectionCentreRepository centreRepository,
                             MarketPriceRepository priceRepository) {
        this.cropRepository = cropRepository;
        this.centreRepository = centreRepository;
        this.priceRepository = priceRepository;
    }

    public List<CropResponse> crops() {
        return cropRepository.findAllByOrderByNameAsc().stream().map(CropResponse::from).toList();
    }

    public List<CentreResponse> centres() {
        return centreRepository.findAll(Sort.by("name")).stream().map(CentreResponse::from).toList();
    }

    public List<CentrePriceResponse> latestPrices(Long cropId) {
        if (!cropRepository.existsById(cropId)) {
            throw new ResourceNotFoundException("Crop " + cropId + " not found");
        }
        // today plus the 6 days before it = 7 days
        LocalDate from = LocalDate.now().minusDays(6);
        List<MarketPrice> prices =
                priceRepository.findByCropIdAndPriceDateGreaterThanEqualOrderByPriceDateDesc(cropId, from);

        Map<Long, List<MarketPrice>> byCentre = new LinkedHashMap<>();
        for (MarketPrice price : prices) {
            byCentre.computeIfAbsent(price.getCentre().getId(), key -> new ArrayList<>()).add(price);
        }

        List<CentrePriceResponse> result = new ArrayList<>();
        for (List<MarketPrice> centrePrices : byCentre.values()) {
            MarketPrice latest = centrePrices.get(0); // list is newest first
            BigDecimal total = centrePrices.stream()
                    .map(MarketPrice::getAvgPrice)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal sevenDayAvg = total.divide(BigDecimal.valueOf(centrePrices.size()), 2, RoundingMode.HALF_UP);

            result.add(new CentrePriceResponse(
                    latest.getCentre().getId(),
                    latest.getCentre().getName(),
                    latest.getCentre().getDistrict(),
                    latest.getPriceDate(),
                    latest.getMinPrice(),
                    latest.getMaxPrice(),
                    latest.getAvgPrice(),
                    sevenDayAvg));
        }
        result.sort(Comparator.comparing(CentrePriceResponse::latestAvgPrice).reversed());
        return result;
    }
}