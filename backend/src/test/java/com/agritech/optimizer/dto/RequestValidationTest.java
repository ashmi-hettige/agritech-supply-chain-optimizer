package com.agritech.optimizer.dto;

import com.agritech.optimizer.dto.admin.PriceRequest;
import com.agritech.optimizer.dto.listing.ListingRequest;
import com.agritech.optimizer.dto.order.CartItemRequest;
import com.agritech.optimizer.dto.order.CheckoutRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Checks the Bean Validation rules on the request DTOs without starting Spring or the database.
 *
 * @author Ashmi Hettige
 */
class RequestValidationTest {

    private static ValidatorFactory factory;
    private static Validator validator;

    @BeforeAll
    static void setUp() {
        factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @AfterAll
    static void tearDown() {
        factory.close();
    }

    private static <T> Set<String> failedFields(Set<ConstraintViolation<T>> violations) {
        return violations.stream()
                .map(violation -> violation.getPropertyPath().toString())
                .collect(java.util.stream.Collectors.toSet());
    }

    @Test
    void validListingHasNoErrors() {
        ListingRequest request = new ListingRequest(1L, new BigDecimal("500"), new BigDecimal("210.50"),
                LocalDate.now(), "A", "Matale", 7.47, 80.62);

        assertTrue(validator.validate(request).isEmpty());
    }

    @Test
    void listingRejectsFutureHarvestAndPointOutsideSriLanka() {
        ListingRequest request = new ListingRequest(1L, new BigDecimal("500"), new BigDecimal("210"),
                LocalDate.now().plusDays(1), "A", "Matale", 12.0, 80.62);

        Set<String> fields = failedFields(validator.validate(request));

        assertEquals(Set.of("harvestDate", "pickupLat"), fields);
    }

    @Test
    void emptyCartCannotBeCheckedOut() {
        CheckoutRequest request = new CheckoutRequest(List.of(), "No. 12, Galle Road", 6.9271, 79.8612);

        Set<ConstraintViolation<CheckoutRequest>> violations = validator.validate(request);

        assertEquals(1, violations.size());
        assertEquals("Your cart is empty", violations.iterator().next().getMessage());
    }

    @Test
    void eachCartItemIsCheckedToo() {
        CheckoutRequest request = new CheckoutRequest(
                List.of(new CartItemRequest(3L, new BigDecimal("0.5"))), "No. 12, Galle Road", 6.9271, 79.8612);

        Set<String> fields = failedFields(validator.validate(request));

        assertEquals(Set.of("items[0].quantityKg"), fields);
    }

    @Test
    void pricesMustGoLowestAverageHighest() {
        PriceRequest request = new PriceRequest(1L, 1L, LocalDate.now(),
                new BigDecimal("320"), new BigDecimal("300"), new BigDecimal("340"));

        Set<String> fields = failedFields(validator.validate(request));

        assertEquals(Set.of("priceOrderValid"), fields);
    }
}
