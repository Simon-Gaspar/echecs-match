import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
export interface UserProfile {
    id: string;
    email: string;
    name: string;
    license?: string;
    elo?: number;
    avatar?: string;
}

export interface AuthContextType {
    user: UserProfile | null;
    isLoading: boolean;
    login: (email: string) => Promise<void>;
    logout: () => void;
    updateProfile: (updates: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check active sessions and sets the user
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                fetchUserProfile(session.user.id, session.user.email!);
            } else {
                setIsLoading(false);
            }
        });

        // Listen for changes on auth state (sign in, sign out, etc.)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                fetchUserProfile(session.user.id, session.user.email!);
            } else {
                setUser(null);
                setIsLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchUserProfile = async (userId: string, email: string) => {
        try {
            // First fetch existing profile or create a default one
            let { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error && error.code === 'PGRST116') {
                // Profile doesn't exist yet, we will rely on default values 
                // but let's just make a mock one for the UI state until the user updates it
                profile = null;
            } else if (error) {
                console.error("Error fetching profile:", error);
            }

            const newUser: UserProfile = {
                id: userId,
                email: email,
                name: profile?.name || email.split('@')[0],
                license: profile?.license,
                elo: profile?.elo,
                avatar: profile?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`
            };

            setUser(newUser);
        } catch (error) {
            console.error("Auth context error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email: string) => {
        setIsLoading(true);
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: window.location.origin,
            }
        });

        setIsLoading(false);
        if (error) {
            alert(error.message);
            throw error;
        } else {
            alert('Un email magique vous a été envoyé ! Vérifiez votre boîte de réception.');
        }
    };

    const logout = async () => {
        setIsLoading(true);
        await supabase.auth.signOut();
        setIsLoading(false);
    };

    const updateProfile = async (updates: Partial<UserProfile>) => {
        if (!user) return;

        try {
            const { error } = await supabase
                .from('profiles')
                .upsert({ id: user.id, ...updates, updated_at: new Date() });

            if (error) throw error;

            setUser({ ...user, ...updates });
        } catch (error) {
            console.error("Error updating profile:", error);
            alert("Erreur lors de la mise à jour du profil.");
        }
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout, updateProfile }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
