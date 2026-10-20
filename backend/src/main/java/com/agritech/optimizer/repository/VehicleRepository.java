package com.agritech.optimizer.repository;

import com.agritech.optimizer.entity.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/** @author Ashmi Hettige */
public interface VehicleRepository extends JpaRepository<Vehicle, Long> {

    List<Vehicle> findByTransporterId(Long transporterId);

    boolean existsByPlateNo(String plateNo);
}