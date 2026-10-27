package com.agritech.optimizer.service;

import com.agritech.optimizer.dto.order.CartItemRequest;
import com.agritech.optimizer.dto.order.CheckoutRequest;
import com.agritech.optimizer.dto.order.FarmerSalesSummary;
import com.agritech.optimizer.dto.order.OrderResponse;
import com.agritech.optimizer.entity.FarmerProfile;
import com.agritech.optimizer.entity.ListingStatus;
import com.agritech.optimizer.entity.Notification;
import com.agritech.optimizer.entity.Order;
import com.agritech.optimizer.entity.OrderItem;
import com.agritech.optimizer.entity.OrderStatus;
import com.agritech.optimizer.entity.ProduceListing;
import com.agritech.optimizer.entity.User;
import com.agritech.optimizer.exception.BusinessRuleException;
import com.agritech.optimizer.exception.ResourceNotFoundException;
import com.agritech.optimizer.repository.FarmerProfileRepository;
import com.agritech.optimizer.repository.NotificationRepository;
import com.agritech.optimizer.repository.OrderRepository;
import com.agritech.optimizer.repository.ProduceListingRepository;
import com.agritech.optimizer.repository.UserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Business rules for orders: checkout from the cart, stock updates and the order status flow.
 *
 * <pre>
 * PLACED ──farmer──▶ CONFIRMED ──farmer──▶ DELIVERED
 *   │ farmer rejects ▶ REJECTED      (stock goes back on the listing)
 *   │ buyer cancels  ▶ CANCELLED     (stock goes back on the listing)
 * </pre>
 *
 * @author Ashmi Hettige
 */
@Service
@Transactional(readOnly = true)
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProduceListingRepository listingRepository;
    private final UserRepository userRepository;
    private final FarmerProfileRepository farmerProfileRepository;
    private final NotificationRepository notificationRepository;

    public OrderService(OrderRepository orderRepository,
                        ProduceListingRepository listingRepository,
                        UserRepository userRepository,
                        FarmerProfileRepository farmerProfileRepository,
                        NotificationRepository notificationRepository) {
        this.orderRepository = orderRepository;
        this.listingRepository = listingRepository;
        this.userRepository = userRepository;
        this.farmerProfileRepository = farmerProfileRepository;
        this.notificationRepository = notificationRepository;
    }

    /**
     * Turns the cart into orders: one order per farmer, because each farmer confirms
     * and delivers separately. Everything runs in one transaction, so if any item
     * fails (e.g. not enough stock) no order is saved and no stock changes.
     */
    @Transactional
    public List<OrderResponse> checkout(CheckoutRequest request, String email) {
        User buyer = currentUser(email);

        // the same listing twice in one cart is merged into one line
        Map<Long, BigDecimal> wanted = new LinkedHashMap<>();
        for (CartItemRequest item : request.items()) {
            wanted.merge(item.listingId(), item.quantityKg(), BigDecimal::add);
        }

        Map<Long, ProduceListing> listings = listingRepository.findAllForUpdate(wanted.keySet()).stream()
                .collect(Collectors.toMap(ProduceListing::getId, Function.identity()));

        LocalDate today = LocalDate.now();
        Map<Long, Order> ordersByFarmer = new LinkedHashMap<>();

        for (Map.Entry<Long, BigDecimal> entry : wanted.entrySet()) {
            ProduceListing listing = listings.get(entry.getKey());
            if (listing == null) {
                throw new ResourceNotFoundException("Listing " + entry.getKey() + " not found");
            }
            BigDecimal kg = entry.getValue();
            String crop = listing.getCrop().getName();

            if (listing.getStatus() != ListingStatus.AVAILABLE || listing.getExpiryDate().isBefore(today)) {
                throw new BusinessRuleException(crop + " from this farm is no longer on sale. Remove it from your cart.");
            }
            if (kg.compareTo(listing.getAvailableKg()) > 0) {
                throw new BusinessRuleException("Only " + listing.getAvailableKg().stripTrailingZeros().toPlainString()
                        + " kg of " + crop + " is left. Lower the quantity in your cart.");
            }

            Order order = ordersByFarmer.computeIfAbsent(listing.getFarmer().getId(),
                    farmerId -> new Order(buyer, listing.getFarmer(), request.deliveryAddress().trim(),
                            request.deliveryLat(), request.deliveryLng()));
            order.addItem(new OrderItem(listing, kg));

            // reserve the kilos now, so other buyers see the new amount straight away
            listing.setAvailableKg(listing.getAvailableKg().subtract(kg));
            if (listing.getAvailableKg().signum() == 0) {
                listing.setStatus(ListingStatus.SOLD_OUT);
            }
        }

        List<Order> saved = orderRepository.saveAll(ordersByFarmer.values());
        for (Order order : saved) {
            notify(order.getFarmer(), "New order #" + order.getId() + " from " + buyer.getFullName());
        }
        return toResponses(saved);
    }

    public List<OrderResponse> myOrders(String email) {
        User buyer = currentUser(email);
        return toResponses(orderRepository.findByBuyerIdOrderByCreatedAtDesc(buyer.getId()));
    }

    public List<OrderResponse> incomingOrders(String email) {
        User farmer = currentUser(email);
        return toResponses(orderRepository.findByFarmerIdOrderByCreatedAtDesc(farmer.getId()));
    }

    public FarmerSalesSummary farmerSummary(String email) {
        User farmer = currentUser(email);
        LocalDateTime monthStart = LocalDate.now().withDayOfMonth(1).atStartOfDay();

        // orders placed this month that have been delivered
        List<Order> delivered = orderRepository.findByFarmerIdAndStatusAndCreatedAtGreaterThanEqual(
                farmer.getId(), OrderStatus.DELIVERED, monthStart);

        BigDecimal soldKg = BigDecimal.ZERO;
        BigDecimal revenue = BigDecimal.ZERO;
        for (Order order : delivered) {
            revenue = revenue.add(order.getTotalAmount());
            for (OrderItem item : order.getItems()) {
                soldKg = soldKg.add(item.getQuantityKg());
            }
        }
        long newOrders = orderRepository.countByFarmerIdAndStatus(farmer.getId(), OrderStatus.PLACED);
        return new FarmerSalesSummary(soldKg, revenue, delivered.size(), newOrders);
    }

    @Transactional
    public OrderResponse changeStatus(Long id, OrderStatus next, String email) {
        User current = currentUser(email);
        Order order = orderRepository.findWithDetailsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order " + id + " not found"));

        boolean isFarmer = order.getFarmer().getId().equals(current.getId());
        boolean isBuyer = order.getBuyer().getId().equals(current.getId());
        if (!isFarmer && !isBuyer) {
            throw new AccessDeniedException("This is not your order");
        }

        OrderStatus now = order.getStatus();
        boolean allowed = (isFarmer && now == OrderStatus.PLACED
                        && (next == OrderStatus.CONFIRMED || next == OrderStatus.REJECTED))
                || (isFarmer && now == OrderStatus.CONFIRMED && next == OrderStatus.DELIVERED)
                || (isBuyer && now == OrderStatus.PLACED && next == OrderStatus.CANCELLED);
        if (!allowed) {
            throw new BusinessRuleException("A " + label(now) + " order cannot be changed to " + label(next));
        }

        if (next == OrderStatus.REJECTED || next == OrderStatus.CANCELLED) {
            returnStock(order);
        }
        order.setStatus(next);

        // tell the other person what happened
        if (isFarmer) {
            notify(order.getBuyer(), "Your order #" + order.getId() + " was " + label(next));
        } else {
            notify(order.getFarmer(), "Order #" + order.getId() + " was cancelled by the buyer");
        }
        return toResponses(List.of(order)).get(0);
    }

    // puts the kilos of a rejected or cancelled order back on sale
    private void returnStock(Order order) {
        for (OrderItem item : order.getItems()) {
            ProduceListing listing = item.getListing();
            listing.setAvailableKg(listing.getAvailableKg().add(item.getQuantityKg()));
            if (listing.getStatus() == ListingStatus.SOLD_OUT) {
                listing.setStatus(ListingStatus.AVAILABLE);
            }
        }
    }

    private void notify(User user, String message) {
        notificationRepository.save(new Notification(user, message, "ORDER"));
    }

    // looks up all farm names in one query, like ListingService does
    private List<OrderResponse> toResponses(List<Order> orders) {
        Set<Long> farmerIds = orders.stream()
                .map(order -> order.getFarmer().getId())
                .collect(Collectors.toSet());

        Map<Long, String> farmNames = farmerIds.isEmpty()
                ? Map.of()
                : farmerProfileRepository.findByUserIdIn(farmerIds).stream()
                        .collect(Collectors.toMap(profile -> profile.getUser().getId(), FarmerProfile::getFarmName));

        return orders.stream()
                .map(order -> OrderResponse.from(order, farmNames.get(order.getFarmer().getId())))
                .toList();
    }

    private static String label(OrderStatus status) {
        return status.name().toLowerCase().replace('_', ' ');
    }

    private User currentUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}