import { RegisterFormData } from "./pages/Register";
import { SignInFormData } from "./pages/SignIn";
import {
  HotelSearchResponse,
  HotelType,
  PaymentIntentResponse,
  UserType,
} from "../../backend/src/shared/types";
import { BookingFormData } from "./forms/BookingForm/BookingForm";
import { apiClient } from "./api/client";
import { useAuthStore } from "./store/auth.store";

export const fetchCurrentUser = async (): Promise<UserType> => {
  return apiClient.get<UserType>("/api/users/me", true);
};

export const register = async (formData: RegisterFormData) => {
  const response = await apiClient.post<{
    accessToken: string;
    refreshToken: string;
    user: UserType;
  }>("/api/users/register", formData, false);

  // Store auth tokens in Zustand
  useAuthStore.getState().setAuth(
    response.accessToken,
    response.refreshToken,
    response.user
  );

  return response;
};


export const signIn = async (formData: SignInFormData) => {
  const response = await apiClient.post<{
    accessToken: string;
    refreshToken: string;
    user: UserType;
  }>("/api/auth/login", formData, false);

  // Store auth tokens in Zustand
  useAuthStore.getState().setAuth(
    response.accessToken,
    response.refreshToken,
    response.user
  );

  return response;
};


export const validateToken = async () => {
  return apiClient.get("/api/auth/validate-token", true);
};

export const signOut = async () => {
  // Clear auth from Zustand (also clears localStorage via persist)
  useAuthStore.getState().clearAuth();

  try {
    await apiClient.post("/api/auth/logout", {}, false);
  } catch (error) {
    // Ignore logout errors - user is already signed out locally
    console.warn("Logout request failed:", error);
  }
};

export const addMyHotel = async (hotelFormData: FormData) => {
  return apiClient.post<HotelType>("/api/my-hotels", hotelFormData, true);
};

export const fetchMyHotels = async (): Promise<HotelType[]> => {
  return apiClient.get<HotelType[]>("/api/my-hotels", true);
};

export const fetchMyHotelById = async (hotelId: string): Promise<HotelType> => {
  return apiClient.get<HotelType>(`/api/my-hotels/${hotelId}`, true);
};

export const updateMyHotelById = async (hotelFormData: FormData) => {
  const hotelId = hotelFormData.get("hotelId");
  return apiClient.put<HotelType>(`/api/my-hotels/${hotelId}`, hotelFormData, true);
};

export type SearchParams = {
  destination?: string;
  checkIn?: string;
  checkOut?: string;
  adultCount?: string;
  childCount?: string;
  page?: string;
  facilities?: string[];
  types?: string[];
  stars?: string[];
  maxPrice?: string;
  sortOption?: string;
};

export const searchHotels = async (
  searchParams: SearchParams
): Promise<HotelSearchResponse> => {
  const queryParams = new URLSearchParams();
  queryParams.append("destination", searchParams.destination || "");
  queryParams.append("checkIn", searchParams.checkIn || "");
  queryParams.append("checkOut", searchParams.checkOut || "");
  queryParams.append("adultCount", searchParams.adultCount || "");
  queryParams.append("childCount", searchParams.childCount || "");
  queryParams.append("page", searchParams.page || "");

  queryParams.append("maxPrice", searchParams.maxPrice || "");
  queryParams.append("sortOption", searchParams.sortOption || "");

  searchParams.facilities?.forEach((facility) =>
    queryParams.append("facilities", facility)
  );

  searchParams.types?.forEach((type) => queryParams.append("types", type));
  searchParams.stars?.forEach((star) => queryParams.append("stars", star));

  return apiClient.get<HotelSearchResponse>(`/api/hotels/search?${queryParams}`, false);
};



export const fetchHotels = async (): Promise<HotelType[]> => {
  return apiClient.get<HotelType[]>("/api/hotels", false);
};

export const fetchHotelById = async (hotelId: string): Promise<HotelType> => {
  return apiClient.get<HotelType>(`/api/hotels/${hotelId}`, false);
};

export const createPaymentIntent = async (
  hotelId: string,
  numberOfNights: string
): Promise<PaymentIntentResponse> => {
  return apiClient.post<PaymentIntentResponse>(
    `/api/hotels/${hotelId}/bookings/payment-intent`,
    { numberOfNights },
    true
  );
};

export const createRoomBooking = async (formData: BookingFormData) => {
  return apiClient.post(`/api/hotels/${formData.hotelId}/bookings`, formData, true);
};

export const fetchMyBookings = async (): Promise<HotelType[]> => {
  return apiClient.get<HotelType[]>("/api/my-bookings", true);
};