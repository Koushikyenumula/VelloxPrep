package com.koushik.aiinterview.service.impl;

import com.koushik.aiinterview.dto.request.ChangePasswordRequest;
import com.koushik.aiinterview.dto.response.ApiResponse;
import com.koushik.aiinterview.entity.User;
import com.koushik.aiinterview.exception.InvalidCredentialsException;
import com.koushik.aiinterview.exception.ResourceNotFoundException;
import com.koushik.aiinterview.repository.UserRepository;
import com.koushik.aiinterview.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import com.koushik.aiinterview.dto.response.UpdateProfileResponse;
import com.koushik.aiinterview.exception.FileUploadException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;
import java.io.IOException;
import org.springframework.util.StringUtils;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public ApiResponse<Void> changePassword(String email, ChangePasswordRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            throw new InvalidCredentialsException("Incorrect current password.");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        log.info("User {} successfully changed their password.", email);
        return ApiResponse.success("Password changed successfully.");
    }

    @Override
    @Transactional
    public ApiResponse<UpdateProfileResponse> updateProfile(String email, String name, MultipartFile profileImage) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        boolean updated = false;

        if (StringUtils.hasText(name)) {
            user.setName(name.trim());
            updated = true;
        }

        if (profileImage != null && !profileImage.isEmpty()) {
            try {
                // Validate content type
                String contentType = profileImage.getContentType();
                if (contentType == null || !contentType.startsWith("image/")) {
                    throw new FileUploadException("Only image files are allowed. Received: " + contentType);
                }

                // Create directory
                Path uploadPath = Paths.get("uploads/avatars").toAbsolutePath().normalize();
                Files.createDirectories(uploadPath);

                // Generate filename
                String originalFileName = StringUtils.cleanPath(profileImage.getOriginalFilename() != null ? profileImage.getOriginalFilename() : "avatar.png");
                String uniqueFileName = UUID.randomUUID() + "_" + originalFileName;

                // Save file
                Path targetLocation = uploadPath.resolve(uniqueFileName);
                Files.copy(profileImage.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

                // Update user entity with the public URL (mapped in WebMvcConfig)
                String fileUrl = "/api/avatars/" + uniqueFileName;
                user.setProfileImageUrl(fileUrl);
                updated = true;
            } catch (IOException ex) {
                throw new FileUploadException("Could not store profile image", ex);
            }
        }

        if (updated) {
            userRepository.save(user);
            log.info("User {} successfully updated their profile.", email);
        }

        UpdateProfileResponse responseData = UpdateProfileResponse.builder()
                .name(user.getName())
                .profileImageUrl(user.getProfileImageUrl())
                .build();

        return ApiResponse.success("Profile updated successfully.", responseData);
    }
}
