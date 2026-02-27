import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
    login: (email: string, license?: string) => Promise<void>;
    logout: () => void;
    updateProfile: (updates: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Mock persistence
        const savedUser = localStorage.getItem('echecs-match-user');
        if (savedUser) {
            try {
                setUser(JSON.parse(savedUser));
            } catch (e) {
                console.error("Failed to parse saved user");
            }
        }
        setIsLoading(false);
    }, []);

    const login = async (email: string, license?: string) => {
        setIsLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        const newUser: UserProfile = {
            id: Math.random().toString(36).substr(2, 9),
            email,
            name: email.split('@')[0],
            license,
            elo: license ? 1500 : undefined, // Mock Elo
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`
        };

        setUser(newUser);
        localStorage.setItem('echecs-match-user', JSON.stringify(newUser));
        setIsLoading(false);
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('echecs-match-user');
    };

    const updateProfile = (updates: Partial<UserProfile>) => {
        if (!user) return;
        const updated = { ...user, ...updates };
        setUser(updated);
        localStorage.setItem('echecs-match-user', JSON.stringify(updated));
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
