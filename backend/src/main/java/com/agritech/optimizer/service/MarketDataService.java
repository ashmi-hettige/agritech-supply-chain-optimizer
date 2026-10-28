package com.agritech.optimizer.service;

import com.agritech.optimizer.dto.reference.CentrePriceResponse;
import com.agritech.optimizer.dto.reference.CentreResponse;
import com.agritech.optimizer.dto.reference.CropResponse;
import com.agritech.optimizer.dto.reference.FarmOption;
import com.agritech.optimizer.dto.reference.PriceHistoryResponse;
import com.agritech.optimizer.entity.MarketPrice;
import com.agritech.optimizer.exception.ResourceNotFoundException;
import com.agritech.optimizer.repository.CollectionCentreRepository;
import com.agritech.optimizer.repository.CropRepository;
import com.agritech.optimizer.repository.FarmerProfileRepository;
import com.agritech.optimizer.repository.MarketPriceRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;

/**
 * Read-only reference data: crops, economic centres, farms and market prices.
 *
 * @author Ashmi Hettige
 */
@Service
@Transactional(readOnly = true)
public class MarketDataService {

    private final CropRepository cropRepository;
    private final CollectionCentreRepository centreRepository;
    private final MarketPriceRepository priceRepository;
    private final FarmerProfileRepository farmerProfileRepository;

    public MarketDataService(CropRepository cropRepository,
                             CollectionCentreRepository centreRepository,
                             MarketPriceRepository priceRepository,
                             FarmerProfileRepository farmerProfileRepository) {
        this.cropRepository = cropRepository;
        this.centreRepository = centreRepository;
        this.priceRepository = priceRepository;
        this.farmerProfileRepository = farmerProfileRepository;
    }

    public List<CropResponse> crops() {
        return cropRepository.findAllByOrderByNameAsc().stream().map(CropResponse::from).toList();
    }

    public List<CentreResponse> centres() {
        return centreRepository.findAll(Sort.by("name")).stream().map(CentreResponse::from).toList();
    }

    public List<FarmOption> farms() {
        return farmerProfileRepository.findAllByOrderByFarmNameAsc().stream().map(FarmOption::from).toList();
    }

    // daily prices for the chart: one series per centre, oldest day first
    public List<PriceHistoryResponse> priceHistory(Long cropId, int days) {
        if (!cropRepository.existsById(cropId)) {
            throw new ResourceNotFoundException("Crop " + cropId + " not found");
        }
        int safeDays = Math.min(Math.max(days, 7), 60);
        LocalDate from = LocalDate.now().minusDays(safeDays - 1L);
        List<MarketPrice> prices =
                priceRepository.findByCropIdAndPriceDateGreaterThanEqualOrderByPriceDateDesc(cropId, from);

        Map<Long, List<MarketPrice>> byCentre = new LinkedHashMap<>();
        for (MarketPrice price : prices) {
            byCentre.computeIfAbsent(price.getCentre().getId(), key -> new ArrayList<>()).add(price);
        }

        List<PriceHistoryResponse> result = new ArrayList<>();
        for (List<MarketPrice> centrePrices : byCentre.values()) {
            List<PriceHistoryResponse.DayPrice> series = centrePrices.stream()
                    .sorted(Comparator.comparing(MarketPrice::getPriceDate))
                    .map(price -> new PriceHistoryResponse.DayPrice(price.getPriceDate(), price.getMinPrice(),
                            price.getAvgPrice(), price.getMaxPrice()))
                    .toList();
            MarketPrice any = centrePrices.get(0);
            result.add(new PriceHistoryResponse(any.getCentre().getId(), any.getCentre().getName(), series));
        }
        result.sort(Comparator.comparing(PriceHistoryResponse::centreName));
        return result;
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