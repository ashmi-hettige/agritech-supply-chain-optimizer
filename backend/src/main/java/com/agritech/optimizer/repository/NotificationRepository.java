package com.agritech.optimizer.repository;

import com.agritech.optimizer.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/** @author Ashmi Hettige */
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);

    long countByUserIdAndReadFalse(Long userId);
}