package com.agritech.optimizer.repository;

import com.agritech.optimizer.entity.Trip;
import com.agritech.optimizer.entity.TripStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

/** @author Ashmi Hettige */
public interface TripRepository extends JpaRepository<Trip, Long> {

    // "My trips" page for a transporter
    @EntityGraph(attributePaths = {"vehicle", "vehicle.transporter"})
    List<Trip> findByVehicleTransporterIdOrderByTripDateDesc(Long transporterId);

    // admin trip planner: all trips on one day
    @EntityGraph(attributePaths = {"vehicle", "vehicle.transporter"})
    List<Trip> findByTripDateOrderByIdAsc(LocalDate tripDate);

    // a vehicle that already has an unfinished trip that day is not planned again
    boolean existsByVehicleIdAndTripDateAndStatusNot(Long vehicleId, LocalDate tripDate, TripStatus status);

    boolean existsByVehicleId(Long vehicleId);
}
