package com.koushik.aiinterview.service;

import com.koushik.aiinterview.dto.request.ChangePasswordRequest;
import com.koushik.aiinterview.dto.response.ApiResponse;
import org.springframework.web.multipart.MultipartFile;
import com.koushik.aiinterview.dto.response.UpdateProfileResponse;

public interface UserService {
    ApiResponse<Void> changePassword(String email, ChangePasswordRequest request);
    ApiResponse<UpdateProfileResponse> updateProfile(String email, String name, MultipartFile profileImage);
}
