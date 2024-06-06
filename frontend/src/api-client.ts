import { RegisterFormData } from "./pages/Register";
import { SignInFormData } from "./pages/SignIn";
import {
  HotelSearchResponse,
  HotelType,
  PaymentIntentResponse,
  UserType,
} from "../../backend/src/shared/types";
import { BookingFormData } from "./forms/BookingForm/BookingForm";
const API_BASE_URL = "https://holiday-com-backend.onrender.com";

// http://localhost:7000

// Function to get token from localStorage
const getToken = () => {
  return localStorage.getItem("auth_token");
};

// Set up headers to include the Authorization header
const getHeaders = () => {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

export const fetchCurrentUser = async (): Promise<UserType> => {
  const response = await fetch(`${API_BASE_URL}/api/users/me`, {
    headers: getHeaders(),
  });
  if (!response.ok) {
    throw new Error("Error fetching user");
  }
  return response.json();
};

export const register = async (formData: RegisterFormData) => {
  const response = await fetch(`${API_BASE_URL}/api/users/register`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(formData),
  });

  const responseBody = await response.json();

  if (!response.ok) {
    throw new Error(responseBody.message);
  }
};

export const signIn = async (formData: SignInFormData) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(formData),
  });

  const body = await response.json();
  if (!response.ok) {
    throw new Error(body.message);
  }

  // Save the token in localStorage
  localStorage.setItem("auth_token", body.token);
  return body;
};

export const validateToken = async () => {
  const response = await fetch(`${API_BASE_URL}/api/auth/validate-token`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error("Token invalid");
  }

  return response.json();
};

export const signOut = async () => {
  localStorage.removeItem("auth_token");
  const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Error during sign out");
  }
};

export const searchHotels = async (queryParams: URLSearchParams): Promise<HotelSearchResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/hotels/search?${queryParams}`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error("Error fetching hotels");
  }

  return response.json();
};

export const fetchHotels = async (): Promise<HotelType[]> => {
  const response = await fetch(`${API_BASE_URL}/api/hotels`, {
    headers: getHeaders(),
  });
  if (!response.ok) {
    throw new Error("Error fetching hotels");
  }
  return response.json();
};

export const fetchHotelById = async (hotelId: string): Promise<HotelType> => {
  const response = await fetch(`${API_BASE_URL}/api/hotels/${hotelId}`, {
    headers: getHeaders(),
  });
  if (!response.ok) {
    throw new Error("Error fetching Hotels");
  }

  return response.json();
};

export const createPaymentIntent = async (
  hotelId: string,
  numberOfNights: string
): Promise<PaymentIntentResponse> => {
  const response = await fetch(
    `${API_BASE_URL}/api/hotels/${hotelId}/bookings/payment-intent`,
    {
      method: "POST",
      body: JSON.stringify({ numberOfNights }),
      headers: getHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error("Error fetching payment intent");
  }

  return response.json();
};

export const createRoomBooking = async (formData: BookingFormData) => {
  const response = await fetch(
    `${API_BASE_URL}/api/hotels/${formData.hotelId}/bookings`,
    {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(formData),
    }
  );

  if (!response.ok) {
    throw new Error("Error booking room");
  }
};

export const fetchMyBookings = async (): Promise<HotelType[]> => {
  const response = await fetch(`${API_BASE_URL}/api/my-bookings`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error("Unable to fetch bookings");
  }

  return response.json();
};
