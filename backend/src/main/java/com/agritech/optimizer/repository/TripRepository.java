package com.agritech.optimizer.repository;

import com.agritech.optimizer.entity.Trip;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/** @author Ashmi Hettige */
public interface TripRepository extends JpaRepository<Trip, Long> {

    // "My trips" page for a transporter
    List<Trip> findByVehicleTransporterIdOrderByTripDateDesc(Long transporterId);
}