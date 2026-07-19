package com.koushik.aiinterview.controller;

import com.koushik.aiinterview.dto.request.ChangePasswordRequest;
import com.koushik.aiinterview.dto.response.ApiResponse;
import com.koushik.aiinterview.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PutMapping("/password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            Authentication authentication,
            @Valid @RequestBody ChangePasswordRequest request) {
        return ResponseEntity.ok(userService.changePassword(authentication.getName(), request));
    }

    @PostMapping("/profile")
    public ResponseEntity<ApiResponse<com.koushik.aiinterview.dto.response.UpdateProfileResponse>> updateProfile(
            Authentication authentication,
            @RequestParam(value = "name", required = false) String name,
            @RequestParam(value = "profileImage", required = false) org.springframework.web.multipart.MultipartFile profileImage) {
        return ResponseEntity.ok(userService.updateProfile(authentication.getName(), name, profileImage));
    }
}
