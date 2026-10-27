package com.agritech.optimizer.dto.order;

import java.math.BigDecimal;

/**
 * Numbers for the farmer dashboard cards: this month's delivered sales and orders waiting for a reply.
 *
 * @author Ashmi Hettige
 */
public record FarmerSalesSummary(BigDecimal soldKg, BigDecimal revenue, long deliveredOrders, long newOrders) {
}