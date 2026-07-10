package com.medappoint.api.controller;

import com.medappoint.api.dto.AppointmentResponse;
import com.medappoint.api.dto.BookingRequest;
import com.medappoint.api.service.AppointmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/appointments")
@RequiredArgsConstructor
public class AppointmentController {

    private final AppointmentService service;

    @GetMapping("/me")
    public ResponseEntity<List<AppointmentResponse>> getMyAppointments() {
        return ResponseEntity.ok(service.getMyAppointments());
    }

    @PostMapping("/book")
    public ResponseEntity<AppointmentResponse> bookAppointment(
            @RequestBody BookingRequest request
    ) {
        return ResponseEntity.ok(service.bookAppointment(request));
    }
}
