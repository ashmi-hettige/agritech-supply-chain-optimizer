package com.agritech.optimizer.dto.admin;

import java.math.BigDecimal;

/** Numbers for the admin dashboard. @author Ashmi Hettige */
public record AdminStats(
        long farmers,
        long buyers,
        long transporters,
        long activeListings,
        long ordersWaiting,
        long ordersDelivered,
        BigDecimal deliveredValue,
        long crops,
        long centres,
        long pricesToday) {
}
