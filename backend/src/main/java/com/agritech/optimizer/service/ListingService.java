package com.agritech.optimizer.service;

import com.agritech.optimizer.dto.common.PageResponse;
import com.agritech.optimizer.dto.listing.DeleteResult;
import com.agritech.optimizer.dto.listing.ListingRequest;
import com.agritech.optimizer.dto.listing.ListingResponse;
import com.agritech.optimizer.entity.Crop;
import com.agritech.optimizer.entity.ListingStatus;
import com.agritech.optimizer.entity.ProduceListing;
import com.agritech.optimizer.entity.User;
import com.agritech.optimizer.exception.BusinessRuleException;
import com.agritech.optimizer.exception.ResourceNotFoundException;
import com.agritech.optimizer.repository.CropRepository;
import com.agritech.optimizer.repository.ListingSpecifications;
import com.agritech.optimizer.repository.ProduceListingRepository;
import com.agritech.optimizer.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Business rules for produce listings: create, search, update, pause and safe delete.
 *
 * @author Ashmi Hettige
 */
@Service
@Transactional(readOnly = true)
public class ListingService {

    private static final int MAX_PAGE_SIZE = 50;

    private final ProduceListingRepository listingRepository;
    private final CropRepository cropRepository;
    private final UserRepository userRepository;

    public ListingService(ProduceListingRepository listingRepository,
                          CropRepository cropRepository,
                          UserRepository userRepository) {
        this.listingRepository = listingRepository;
        this.cropRepository = cropRepository;
        this.userRepository = userRepository;
    }

    public PageResponse<ListingResponse> search(String q, Long cropId, String district,
                                                BigDecimal minPrice, BigDecimal maxPrice,
                                                String sort, int page, int size) {
        LocalDate today = LocalDate.now();
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        Pageable pageable = PageRequest.of(Math.max(page, 0), safeSize, toSort(sort));

        var spec = ListingSpecifications.forMarketplace(q, cropId, district, minPrice, maxPrice, today);
        return PageResponse.from(listingRepository.findAll(spec, pageable)
                .map(listing -> ListingResponse.from(listing, today)));
    }

    public ListingResponse getById(Long id) {
        return ListingResponse.from(findListing(id), LocalDate.now());
    }

    public List<ListingResponse> myListings(String email) {
        User farmer = currentUser(email);
        LocalDate today = LocalDate.now();
        return listingRepository
                .findByFarmerIdAndStatusNotOrderByCreatedAtDesc(farmer.getId(), ListingStatus.ARCHIVED)
                .stream()
                .map(listing -> ListingResponse.from(listing, today))
                .toList();
    }

    @Transactional
    public ListingResponse create(ListingRequest request, String email) {
        User farmer = currentUser(email);
        Crop crop = cropRepository.findById(request.cropId())
                .orElseThrow(() -> new ResourceNotFoundException("Crop " + request.cropId() + " not found"));

        ProduceListing listing = new ProduceListing(farmer, crop, request.quantityKg(), request.pricePerKg(),
                request.harvestDate(), request.grade(), request.district().trim(),
                request.pickupLat(), request.pickupLng());
        rejectIfExpired(listing);

        return ListingResponse.from(listingRepository.save(listing), LocalDate.now());
    }

    @Transactional
    public ListingResponse update(Long id, ListingRequest request, String email) {
        ProduceListing listing = findOwnedListing(id, email);

        if (listing.getStatus() == ListingStatus.ARCHIVED) {
            throw new BusinessRuleException("Archived listings cannot be edited");
        }
        if (!listing.getCrop().getId().equals(request.cropId())) {
            throw new BusinessRuleException("The crop of a listing cannot be changed. Create a new listing instead.");
        }

        // kg already ordered must stay reserved: sold = quantity - available
        BigDecimal sold = listing.getQuantityKg().subtract(listing.getAvailableKg());
        if (request.quantityKg().compareTo(sold) < 0) {
            throw new BusinessRuleException("Quantity cannot be less than the " + sold + " kg already ordered");
        }

        listing.setQuantityKg(request.quantityKg());
        listing.setAvailableKg(request.quantityKg().subtract(sold));
        listing.setPricePerKg(request.pricePerKg());
        listing.setHarvestDate(request.harvestDate());
        listing.setGrade(request.grade());
        listing.setDistrict(request.district().trim());
        listing.setPickupLat(request.pickupLat());
        listing.setPickupLng(request.pickupLng());
        rejectIfExpired(listing);

        if (listing.getAvailableKg().signum() == 0) {
            listing.setStatus(ListingStatus.SOLD_OUT);
        } else if (listing.getStatus() == ListingStatus.SOLD_OUT) {
            listing.setStatus(ListingStatus.AVAILABLE);
        }
        // no save() call: the entity is managed, so Hibernate writes the changes at commit
        return ListingResponse.from(listing, LocalDate.now());
    }

    @Transactional
    public ListingResponse changeStatus(Long id, ListingStatus newStatus, String email) {
        ProduceListing listing = findOwnedListing(id, email);

        if (newStatus != ListingStatus.AVAILABLE && newStatus != ListingStatus.PAUSED) {
            throw new BusinessRuleException("A listing can only be paused or made available");
        }
        if (listing.getStatus() == ListingStatus.ARCHIVED) {
            throw new BusinessRuleException("Archived listings cannot be changed");
        }
        if (newStatus == ListingStatus.AVAILABLE) {
            if (listing.getAvailableKg().signum() == 0) {
                throw new BusinessRuleException("This listing is sold out. Increase the quantity first.");
            }
            if (listing.getExpiryDate().isBefore(LocalDate.now())) {
                throw new BusinessRuleException("This listing has passed its expiry date");
            }
        }
        listing.setStatus(newStatus);
        return ListingResponse.from(listing, LocalDate.now());
    }

    // safe delete: a listing that appears in orders is archived, so order history stays complete
    @Transactional
    public DeleteResult delete(Long id, String email) {
        ProduceListing listing = findOwnedListing(id, email);

        if (listingRepository.hasOrders(id)) {
            listing.setStatus(ListingStatus.ARCHIVED);
            return new DeleteResult(true, "This listing has orders, so it was archived instead of deleted");
        }
        listingRepository.delete(listing);
        return new DeleteResult(false, "Listing deleted");
    }

    private ProduceListing findListing(Long id) {
        return listingRepository.findWithDetailsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Listing " + id + " not found"));
    }

    private ProduceListing findOwnedListing(Long id, String email) {
        ProduceListing listing = findListing(id);
        User current = currentUser(email);
        if (!listing.getFarmer().getId().equals(current.getId())) {
            throw new AccessDeniedException("You can only change your own listings");
        }
        return listing;
    }

    private User currentUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private void rejectIfExpired(ProduceListing listing) {
        if (listing.getExpiryDate().isBefore(LocalDate.now())) {
            throw new BusinessRuleException("This harvest is already past the crop's shelf life");
        }
    }

    // only these sort options are allowed, so users cannot sort on hidden columns
    private Sort toSort(String sort) {
        if (sort == null) {
            return Sort.by("createdAt").descending();
        }
        return switch (sort) {
            case "price_asc" -> Sort.by("pricePerKg").ascending();
            case "price_desc" -> Sort.by("pricePerKg").descending();
            case "harvest_newest" -> Sort.by("harvestDate").descending();
            case "expiring_soon" -> Sort.by("expiryDate").ascending();
            default -> Sort.by("createdAt").descending();
        };
    }
}