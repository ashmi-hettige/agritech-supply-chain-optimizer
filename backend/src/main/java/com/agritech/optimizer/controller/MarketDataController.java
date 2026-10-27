package com.agritech.optimizer.controller;

import com.agritech.optimizer.dto.reference.CentrePriceResponse;
import com.agritech.optimizer.dto.reference.CentreResponse;
import com.agritech.optimizer.dto.reference.CropResponse;
import com.agritech.optimizer.dto.reference.FarmOption;
import com.agritech.optimizer.service.MarketDataService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Public endpoints for crops, economic centres, farms and prices.
 *
 * @author Ashmi Hettige
 */
@RestController
@RequestMapping("/api")
public class MarketDataController {

    private final MarketDataService marketDataService;

    public MarketDataController(MarketDataService marketDataService) {
        this.marketDataService = marketDataService;
    }

    @GetMapping("/crops")
    public List<CropResponse> crops() {
        return marketDataService.crops();
    }

    @GetMapping("/centres")
    public List<CentreResponse> centres() {
        return marketDataService.centres();
    }

    @GetMapping("/farms")
    public List<FarmOption> farms() {
        return marketDataService.farms();
    }

    @GetMapping("/prices/latest")
    public List<CentrePriceResponse> latestPrices(@RequestParam Long cropId) {
        return marketDataService.latestPrices(cropId);
    }
}