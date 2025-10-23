import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as apiClient from '../api-client';

export const useMyBookings = () => {
  return useQuery({
    queryKey: ['myBookings'],
    queryFn: apiClient.fetchMyBookings,
  });
};

export const useCreatePaymentIntent = () => {
  return useMutation({
    mutationFn: ({ hotelId, numberOfNights }: { hotelId: string; numberOfNights: string }) =>
      apiClient.createPaymentIntent(hotelId, numberOfNights),
  });
};

export const useCreateBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: apiClient.createRoomBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myBookings'] });
    },
  });
};
