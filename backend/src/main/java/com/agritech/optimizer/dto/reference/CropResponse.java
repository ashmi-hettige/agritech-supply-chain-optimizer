package com.agritech.optimizer.dto.reference;

import com.agritech.optimizer.entity.Crop;

/** @author Ashmi Hettige */
public record CropResponse(Long id, String name, String category, int shelfLifeDays,
                           boolean needsColdChain, String imageUrl) {

    public static CropResponse from(Crop crop) {
        return new CropResponse(crop.getId(), crop.getName(), crop.getCategory(),
                crop.getShelfLifeDays(), crop.isNeedsColdChain(), crop.getImageUrl());
    }
}