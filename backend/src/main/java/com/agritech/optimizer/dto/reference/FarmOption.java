package com.agritech.optimizer.dto.reference;

import com.agritech.optimizer.entity.FarmerProfile;

/**
 * One farm in the marketplace "Farm" filter. farmerId is the farmer's user id,
 * because listings are linked to the user, not to the profile.
 *
 * @author Ashmi Hettige
 */
public record FarmOption(Long farmerId, String farmName, String district) {

    public static FarmOption from(FarmerProfile profile) {
        return new FarmOption(profile.getUser().getId(), profile.getFarmName(), profile.getUser().getDistrict());
    }
}