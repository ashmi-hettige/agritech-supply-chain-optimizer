package com.agritech.optimizer.exception;

/** Thrown when a requested record does not exist (HTTP 404). @author Ashmi Hettige */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }
}