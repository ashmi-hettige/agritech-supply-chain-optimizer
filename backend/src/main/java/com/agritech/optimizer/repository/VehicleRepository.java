package com.agritech.optimizer.repository;

import com.agritech.optimizer.entity.Vehicle;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/** @author Ashmi Hettige */
public interface VehicleRepository extends JpaRepository<Vehicle, Long> {

    List<Vehicle> findByTransporterIdOrderByPlateNoAsc(Long transporterId);

    // vehicles of active transporters, for the trip planner
    @EntityGraph(attributePaths = "transporter")
    List<Vehicle> findByTransporterEnabledTrue();

    boolean existsByPlateNo(String plateNo);
}
