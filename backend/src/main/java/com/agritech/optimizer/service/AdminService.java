package com.agritech.optimizer.service;

import com.agritech.optimizer.dto.admin.AdminStats;
import com.agritech.optimizer.dto.admin.AdminUserResponse;
import com.agritech.optimizer.dto.admin.CentreRequest;
import com.agritech.optimizer.dto.admin.CropRequest;
import com.agritech.optimizer.dto.admin.PriceRequest;
import com.agritech.optimizer.dto.admin.PriceRowResponse;
import com.agritech.optimizer.dto.common.PageResponse;
import com.agritech.optimizer.dto.reference.CentreResponse;
import com.agritech.optimizer.dto.reference.CropResponse;
import com.agritech.optimizer.entity.CollectionCentre;
import com.agritech.optimizer.entity.Crop;
import com.agritech.optimizer.entity.ListingStatus;
import com.agritech.optimizer.entity.MarketPrice;
import com.agritech.optimizer.entity.OrderStatus;
import com.agritech.optimizer.entity.Role;
import com.agritech.optimizer.entity.User;
import com.agritech.optimizer.exception.BusinessRuleException;
import com.agritech.optimizer.exception.ResourceNotFoundException;
import com.agritech.optimizer.repository.CollectionCentreRepository;
import com.agritech.optimizer.repository.CropRepository;
import com.agritech.optimizer.repository.MarketPriceRepository;
import com.agritech.optimizer.repository.OrderRepository;
import com.agritech.optimizer.repository.ProduceListingRepository;
import com.agritech.optimizer.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Logistics admin tasks: reference data (crops, centres, daily prices), user accounts and stats.
 *
 * @author Ashmi Hettige
 */
@Service
@Transactional(readOnly = true)
public class AdminService {

    private static final String DEFAULT_CROP_IMAGE = "/images/veg-basket.jpg";
    private static final int USERS_PER_PAGE = 15;

    private final CropRepository cropRepository;
    private final CollectionCentreRepository centreRepository;
    private final MarketPriceRepository priceRepository;
    private final ProduceListingRepository listingRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;

    public AdminService(CropRepository cropRepository,
                        CollectionCentreRepository centreRepository,
                        MarketPriceRepository priceRepository,
                        ProduceListingRepository listingRepository,
                        OrderRepository orderRepository,
                        UserRepository userRepository) {
        this.cropRepository = cropRepository;
        this.centreRepository = centreRepository;
        this.priceRepository = priceRepository;
        this.listingRepository = listingRepository;
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
    }

    // ---------- Dashboard ----------

    public AdminStats stats() {
        BigDecimal delivered = orderRepository.sumTotalByStatus(OrderStatus.DELIVERED);
        return new AdminStats(
                userRepository.countByRole(Role.FARMER),
                userRepository.countByRole(Role.BUYER),
                userRepository.countByRole(Role.TRANSPORTER),
                listingRepository.countByStatus(ListingStatus.AVAILABLE),
                orderRepository.countByStatus(OrderStatus.PLACED),
                orderRepository.countByStatus(OrderStatus.DELIVERED),
                delivered == null ? BigDecimal.ZERO : delivered,
                cropRepository.count(),
                centreRepository.count(),
                priceRepository.countByPriceDate(LocalDate.now()));
    }

    // ---------- Crops ----------

    @Transactional
    public CropResponse createCrop(CropRequest request) {
        String name = request.name().trim();
        if (cropRepository.existsByNameIgnoreCase(name)) {
            throw new BusinessRuleException("A crop called " + name + " already exists");
        }
        Crop crop = new Crop(name, request.category().trim(), request.shelfLifeDays(), request.needsColdChain());
        crop.setImageUrl(imageOrDefault(request.imageUrl()));
        return CropResponse.from(cropRepository.save(crop));
    }

    @Transactional
    public CropResponse updateCrop(Long id, CropRequest request) {
        Crop crop = findCrop(id);
        String name = request.name().trim();
        if (cropRepository.existsByNameIgnoreCaseAndIdNot(name, id)) {
            throw new BusinessRuleException("A crop called " + name + " already exists");
        }
        crop.setName(name);
        crop.setCategory(request.category().trim());
        crop.setShelfLifeDays(request.shelfLifeDays());
        crop.setNeedsColdChain(request.needsColdChain());
        crop.setImageUrl(imageOrDefault(request.imageUrl()));
        // note: existing listings keep their expiry date; only new or edited listings use the new shelf life
        return CropResponse.from(crop);
    }

    @Transactional
    public void deleteCrop(Long id) {
        Crop crop = findCrop(id);
        if (listingRepository.existsByCropId(id)) {
            throw new BusinessRuleException(crop.getName() + " is used by farmers' listings, so it cannot be deleted");
        }
        priceRepository.deleteAllByCropId(id);
        cropRepository.delete(crop);
    }

    // ---------- Economic centres ----------

    @Transactional
    public CentreResponse createCentre(CentreRequest request) {
        String name = request.name().trim();
        if (centreRepository.existsByNameIgnoreCase(name)) {
            throw new BusinessRuleException("A centre called " + name + " already exists");
        }
        CollectionCentre centre = new CollectionCentre(name, request.district().trim(),
                request.latitude(), request.longitude());
        return CentreResponse.from(centreRepository.save(centre));
    }

    @Transactional
    public CentreResponse updateCentre(Long id, CentreRequest request) {
        CollectionCentre centre = findCentre(id);
        String name = request.name().trim();
        if (centreRepository.existsByNameIgnoreCaseAndIdNot(name, id)) {
            throw new BusinessRuleException("A centre called " + name + " already exists");
        }
        centre.setName(name);
        centre.setDistrict(request.district().trim());
        centre.setLatitude(request.latitude());
        centre.setLongitude(request.longitude());
        return CentreResponse.from(centre);
    }

    @Transactional
    public void deleteCentre(Long id) {
        CollectionCentre centre = findCentre(id);
        priceRepository.deleteAllByCentreId(id);
        centreRepository.delete(centre);
    }

    // ---------- Daily prices ----------

    public List<PriceRowResponse> prices(LocalDate date, Long cropId) {
        return priceRepository.findByPriceDateAndCropIdOrderByCentreNameAsc(date, cropId).stream()
                .map(PriceRowResponse::from)
                .toList();
    }

    // insert, or update the existing row for the same crop, centre and day
    @Transactional
    public PriceRowResponse savePrice(PriceRequest request) {
        Crop crop = findCrop(request.cropId());
        CollectionCentre centre = findCentre(request.centreId());

        MarketPrice price = priceRepository
                .findByCropIdAndCentreIdAndPriceDate(crop.getId(), centre.getId(), request.priceDate())
                .orElse(null);
        if (price == null) {
            price = priceRepository.save(new MarketPrice(crop, centre, request.priceDate(),
                    request.minPrice(), request.maxPrice(), request.avgPrice()));
        } else {
            price.setMinPrice(request.minPrice());
            price.setAvgPrice(request.avgPrice());
            price.setMaxPrice(request.maxPrice());
        }
        return PriceRowResponse.from(price);
    }

    @Transactional
    public void deletePrice(Long id) {
        MarketPrice price = priceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Price " + id + " not found"));
        priceRepository.delete(price);
    }

    // ---------- Users ----------

    public PageResponse<AdminUserResponse> users(Role role, String q, int page) {
        String text = q == null || q.isBlank() ? null : q.trim();
        Page<User> result = userRepository.search(role, text,
                PageRequest.of(Math.max(page, 0), USERS_PER_PAGE, Sort.by("createdAt").descending()));
        return PageResponse.from(result.map(AdminUserResponse::from));
    }

    // accounts are disabled, never deleted, so their orders and listings stay in the records
    @Transactional
    public AdminUserResponse setEnabled(Long id, boolean enabled, String adminEmail) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User " + id + " not found"));
        if (!enabled && user.getEmail().equalsIgnoreCase(adminEmail)) {
            throw new BusinessRuleException("You cannot disable your own account");
        }
        user.setEnabled(enabled);
        return AdminUserResponse.from(user);
    }

    private Crop findCrop(Long id) {
        return cropRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Crop " + id + " not found"));
    }

    private CollectionCentre findCentre(Long id) {
        return centreRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Centre " + id + " not found"));
    }

    private static String imageOrDefault(String imageUrl) {
        return imageUrl == null || imageUrl.isBlank() ? DEFAULT_CROP_IMAGE : imageUrl.trim();
    }
}
