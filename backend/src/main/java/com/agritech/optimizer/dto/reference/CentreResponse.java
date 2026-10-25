package com.agritech.optimizer.dto.reference;

import com.agritech.optimizer.entity.CollectionCentre;

/** @author Ashmi Hettige */
public record CentreResponse(Long id, String name, String district, double latitude, double longitude) {

    public static CentreResponse from(CollectionCentre centre) {
        return new CentreResponse(centre.getId(), centre.getName(), centre.getDistrict(),
                centre.getLatitude(), centre.getLongitude());
    }
}