import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as apiClient from '../api-client';
import { SearchParams } from '../api-client';

export const useSearchHotels = (searchParams: SearchParams) => {
  return useQuery({
    queryKey: ['searchHotels', searchParams],
    queryFn: () => apiClient.searchHotels(searchParams),
    enabled: !!searchParams.destination || !!searchParams.page,
  });
};

export const useFetchHotels = () => {
  return useQuery({
    queryKey: ['hotels'],
    queryFn: apiClient.fetchHotels,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useFetchHotelById = (hotelId: string) => {
  return useQuery({
    queryKey: ['hotel', hotelId],
    queryFn: () => apiClient.fetchHotelById(hotelId),
    enabled: !!hotelId,
  });
};

export const useMyHotels = () => {
  return useQuery({
    queryKey: ['myHotels'],
    queryFn: apiClient.fetchMyHotels,
  });
};

export const useFetchMyHotelById = (hotelId: string) => {
  return useQuery({
    queryKey: ['myHotel', hotelId],
    queryFn: () => apiClient.fetchMyHotelById(hotelId),
    enabled: !!hotelId,
  });
};

export const useAddHotel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: apiClient.addMyHotel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myHotels'] });
    },
  });
};

export const useUpdateHotel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: apiClient.updateMyHotelById,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myHotels'] });
    },
  });
};
