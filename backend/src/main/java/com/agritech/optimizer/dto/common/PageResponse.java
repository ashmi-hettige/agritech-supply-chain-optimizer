package com.agritech.optimizer.dto.common;

import org.springframework.data.domain.Page;
import java.util.List;

/**
 * One page of results plus the numbers the UI needs for its pagination controls.
 *
 * @author Ashmi Hettige
 */
public record PageResponse<T>(List<T> content, int page, int size, long totalElements, int totalPages) {

    public static <T> PageResponse<T> from(Page<T> page) {
        return new PageResponse<>(page.getContent(), page.getNumber(), page.getSize(),
                page.getTotalElements(), page.getTotalPages());
    }
}