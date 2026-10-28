package com.agritech.optimizer.optimizer;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Comparator;
import java.util.List;

/**
 * Ranks economic centres by what the farmer actually takes home after transport.
 *
 * <pre>
 * road km        = straight-line km × roadFactor          (roads are longer than a straight line)
 * transport cost = fixedCost + ratePerKgKm × kg × road km
 * gross value    = price per kg × kg
 * net value      = gross value − transport cost           → highest net value is the best market
 * </pre>
 *
 * This class has no Spring or database code, so it can be unit tested on its own.
 *
 * @author Ashmi Hettige
 */
public class BestMarketCalculator {

    private final BigDecimal ratePerKgKm;
    private final BigDecimal fixedCost;
    private final double roadFactor;

    public BestMarketCalculator(BigDecimal ratePerKgKm, BigDecimal fixedCost, double roadFactor) {
        this.ratePerKgKm = ratePerKgKm;
        this.fixedCost = fixedCost;
        this.roadFactor = roadFactor;
    }

    public List<MarketOption> rank(double fromLat, double fromLng, BigDecimal kg, List<CentrePrice> centres) {
        return centres.stream()
                .map(centre -> option(fromLat, fromLng, kg, centre))
                .sorted(Comparator.comparing(MarketOption::netValue).reversed())
                .toList();
    }

    private MarketOption option(double fromLat, double fromLng, BigDecimal kg, CentrePrice centre) {
        double roadKm = GeoDistance.km(fromLat, fromLng, centre.latitude(), centre.longitude()) * roadFactor;
        BigDecimal distance = BigDecimal.valueOf(roadKm).setScale(1, RoundingMode.HALF_UP);

        BigDecimal transport = fixedCost.add(ratePerKgKm.multiply(kg).multiply(distance))
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal gross = centre.pricePerKg().multiply(kg).setScale(2, RoundingMode.HALF_UP);
        BigDecimal net = gross.subtract(transport);
        BigDecimal netPerKg = net.divide(kg, 2, RoundingMode.HALF_UP);

        return new MarketOption(centre.centreId(), centre.centreName(), centre.district(), centre.priceDate(),
                centre.pricePerKg(), centre.sevenDayAvgPrice(), distance, gross, transport, net, netPerKg);
    }
}
