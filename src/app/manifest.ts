import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Échecs Match',
        short_name: 'ÉchecsMatch',
        description: 'Trouvez votre prochain tournoi d\'échecs sur une carte interactive',
        start_url: '/',
        display: 'standalone',
        background_color: '#0b0c0e',
        theme_color: '#10b981',
        orientation: 'portrait-primary',
        icons: [
            {
                src: '/icon-512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any',
            },
            {
                src: '/icon-512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable',
            },
        ],
    }
}
