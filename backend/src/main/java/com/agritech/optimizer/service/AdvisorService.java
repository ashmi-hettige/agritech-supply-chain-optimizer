package com.agritech.optimizer.service;

import com.agritech.optimizer.dto.advisor.AdvisorQuery;
import com.agritech.optimizer.dto.advisor.AdvisorResponse;
import com.agritech.optimizer.dto.reference.CentrePriceResponse;
import com.agritech.optimizer.entity.CollectionCentre;
import com.agritech.optimizer.entity.Crop;
import com.agritech.optimizer.entity.FarmerProfile;
import com.agritech.optimizer.entity.User;
import com.agritech.optimizer.exception.BusinessRuleException;
import com.agritech.optimizer.exception.ResourceNotFoundException;
import com.agritech.optimizer.optimizer.BestMarketCalculator;
import com.agritech.optimizer.optimizer.CentrePrice;
import com.agritech.optimizer.optimizer.MarketOption;
import com.agritech.optimizer.repository.CollectionCentreRepository;
import com.agritech.optimizer.repository.CropRepository;
import com.agritech.optimizer.repository.FarmerProfileRepository;
import com.agritech.optimizer.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Best-market advisor: for a crop and quantity, which economic centre pays the farmer the most
 * after transport? Prices come from the last 7 days; transport settings come from application.properties.
 *
 * @author Ashmi Hettige
 */
@Service
@Transactional(readOnly = true)
public class AdvisorService {

    private final MarketDataService marketDataService;
    private final CropRepository cropRepository;
    private final CollectionCentreRepository centreRepository;
    private final FarmerProfileRepository farmerProfileRepository;
    private final UserRepository userRepository;

    private final BigDecimal ratePerKgKm;
    private final BigDecimal fixedCost;
    private final double roadFactor;
    private final BestMarketCalculator calculator;

    public AdvisorService(MarketDataService marketDataService,
                          CropRepository cropRepository,
                          CollectionCentreRepository centreRepository,
                          FarmerProfileRepository farmerProfileRepository,
                          UserRepository userRepository,
                          @Value("${app.transport.rate-per-kg-km}") BigDecimal ratePerKgKm,
                          @Value("${app.transport.fixed-cost}") BigDecimal fixedCost,
                          @Value("${app.transport.road-factor}") double roadFactor) {
        this.marketDataService = marketDataService;
        this.cropRepository = cropRepository;
        this.centreRepository = centreRepository;
        this.farmerProfileRepository = farmerProfileRepository;
        this.userRepository = userRepository;
        this.ratePerKgKm = ratePerKgKm;
        this.fixedCost = fixedCost;
        this.roadFactor = roadFactor;
        this.calculator = new BestMarketCalculator(ratePerKgKm, fixedCost, roadFactor);
    }

    public AdvisorResponse advise(AdvisorQuery query, String email) {
        Crop crop = cropRepository.findById(query.cropId())
                .orElseThrow(() -> new ResourceNotFoundException("Crop " + query.cropId() + " not found"));

        // where the produce starts: the given point, or else the farm on the farmer's profile
        double fromLat;
        double fromLng;
        if (query.lat() != null && query.lng() != null) {
            fromLat = query.lat();
            fromLng = query.lng();
        } else {
            User farmer = userRepository.findByEmail(email)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));
            FarmerProfile farm = farmerProfileRepository.findByUserId(farmer.getId())
                    .orElseThrow(() -> new BusinessRuleException("Add your farm location first, or choose a listing"));
            fromLat = farm.getLatitude();
            fromLng = farm.getLongitude();
        }

        List<CentrePriceResponse> prices = marketDataService.latestPrices(crop.getId());
        if (prices.isEmpty()) {
            throw new BusinessRuleException("No prices for " + crop.getName() + " in the last 7 days");
        }

        Map<Long, CollectionCentre> centres = centreRepository.findAllById(
                        prices.stream().map(CentrePriceResponse::centreId).toList()).stream()
                .collect(Collectors.toMap(CollectionCentre::getId, Function.identity()));

        List<CentrePrice> input = prices.stream()
                .filter(price -> centres.containsKey(price.centreId()))
                .map(price -> {
                    CollectionCentre centre = centres.get(price.centreId());
                    return new CentrePrice(centre.getId(), centre.getName(), centre.getDistrict(),
                            centre.getLatitude(), centre.getLongitude(), price.latestDate(),
                            price.latestAvgPrice(), price.sevenDayAvgPrice());
                })
                .toList();

        List<MarketOption> ranked = calculator.rank(fromLat, fromLng, query.quantityKg(), input);

        // compare the best choice with the easy choice: the closest centre
        MarketOption nearest = ranked.stream()
                .min(Comparator.comparing(MarketOption::distanceKm))
                .orElseThrow();
        BigDecimal extra = ranked.get(0).netValue().subtract(nearest.netValue());

        return new AdvisorResponse(crop.getId(), crop.getName(), query.quantityKg(), fromLat, fromLng,
                ratePerKgKm, fixedCost, roadFactor, nearest.centreName(), extra, ranked);
    }
}
