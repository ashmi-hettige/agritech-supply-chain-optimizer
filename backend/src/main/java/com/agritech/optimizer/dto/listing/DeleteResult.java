package com.agritech.optimizer.dto.listing;

/** Tells the UI whether a listing was deleted or archived. @author Ashmi Hettige */
public record DeleteResult(boolean archived, String message) {
}