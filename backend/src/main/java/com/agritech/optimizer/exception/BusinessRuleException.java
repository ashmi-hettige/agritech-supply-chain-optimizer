package com.agritech.optimizer.exception;

/** Thrown when a request breaks a business rule, e.g. duplicate email (HTTP 409). @author Ashmi Hettige */
public class BusinessRuleException extends RuntimeException {

    public BusinessRuleException(String message) {
        super(message);
    }
}