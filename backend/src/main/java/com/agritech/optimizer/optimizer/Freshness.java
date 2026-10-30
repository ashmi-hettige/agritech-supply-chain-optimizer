package com.agritech.optimizer.optimizer;

/** Result of the freshness calculation for one listing. @author Ashmi Hettige */
public record Freshness(long daysLeft, double score, String label) {
}