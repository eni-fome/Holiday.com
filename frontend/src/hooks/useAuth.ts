import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/auth.store';
import * as apiClient from '../api-client';
import { useNavigate } from 'react-router-dom';

export const useAuth = () => {
    const { user, isAuthenticated, clearAuth } = useAuthStore();
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    // Validate token on mount
    const { data: validatedUser } = useQuery({
        queryKey: ['validateToken'],
        queryFn: apiClient.fetchCurrentUser,
        enabled: isAuthenticated,
        retry: false,
        refetchOnMount: false,
    });

    const loginMutation = useMutation({
        mutationFn: apiClient.signIn,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['validateToken'] });
        },
        onError: (error) => {
            console.error('Login failed:', error);
        },
    });

    const registerMutation = useMutation({
        mutationFn: apiClient.register,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['validateToken'] });
        },
        onError: (error) => {
            console.error('Registration failed:', error);
        },
    });

    const logoutMutation = useMutation({
        mutationFn: apiClient.signOut,
        onSuccess: () => {
            clearAuth();
            queryClient.clear();
            navigate('/');
        },
        onError: () => {
            clearAuth();
            queryClient.clear();
            navigate('/');
        },
    });

    return {
        user: user || validatedUser,
        isAuthenticated,
        login: loginMutation.mutateAsync,
        register: registerMutation.mutateAsync,
        logout: logoutMutation.mutateAsync,
        isLoggingIn: loginMutation.isPending,
        isRegistering: registerMutation.isPending,
    };
};
