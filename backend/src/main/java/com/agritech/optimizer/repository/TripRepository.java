package com.agritech.optimizer.repository;

import com.agritech.optimizer.entity.Trip;
import com.agritech.optimizer.entity.TripSlot;
import com.agritech.optimizer.entity.TripStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/** @author Ashmi Hettige */
public interface TripRepository extends JpaRepository<Trip, Long> {

    // "My trips" page for a transporter
    @EntityGraph(attributePaths = {"vehicle", "vehicle.transporter"})
    List<Trip> findByVehicleTransporterIdOrderByTripDateDesc(Long transporterId);

    // the one trip a transporter has on a date and slot, if any
    Optional<Trip> findFirstByVehicleTransporterIdAndTripDateAndSlot(Long transporterId, LocalDate tripDate,
                                                                     TripSlot slot);

    // trips that can still take more orders, for "Fill your free space"
    @EntityGraph(attributePaths = "vehicle")
    List<Trip> findByVehicleTransporterIdAndStatusAndTripDateGreaterThanEqualOrderByTripDateAsc(
            Long transporterId, TripStatus status, LocalDate from);

    boolean existsByVehicleId(Long vehicleId);
}
