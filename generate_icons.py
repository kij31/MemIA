#!/usr/bin/env python3
"""
Script pour générer les icônes PWA pour MemIA
"""

import os

# Tailles d'icônes requises pour PWA
SIZES = [72, 96, 128, 144, 152, 192, 384, 512]

def generate_svg_icon(size):
    """Génère une icône SVG simple"""
    svg_content = f'''<svg width="{size}" height="{size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="{size}" height="{size}" rx="{size//8}" fill="url(#grad1)"/>
  <text x="50%" y="50%" text-anchor="middle" dy=".35em"
        font-family="Arial, sans-serif" font-size="{size//4}"
        font-weight="bold" fill="white">M</text>
  <circle cx="{size//4}" cy="{size*3//4}" r="{size//12}" fill="#ff6b6b" opacity="0.8"/>
  <circle cx="{size*3//4}" cy="{size*3//4}" r="{size//12}" fill="#4ecdc4" opacity="0.8"/>
</svg>'''
    return svg_content

def main():
    icons_dir = '/home/user/MemIA/icons'

    for size in SIZES:
        svg_content = generate_svg_icon(size)
        filename = f'{icons_dir}/icon-{size}x{size}.svg'

        with open(filename, 'w') as f:
            f.write(svg_content)

        print(f'✓ Généré: icon-{size}x{size}.svg')

    print(f'\n✅ {len(SIZES)} icônes SVG générées avec succès!')
    print('\nNote: Les icônes SVG sont prêtes à être utilisées.')
    print('Pour une meilleure compatibilité, vous pouvez les convertir en PNG avec:')
    print('  - Un outil en ligne comme https://cloudconvert.com/svg-to-png')
    print('  - Ou ImageMagick: convert icon.svg icon.png')

if __name__ == '__main__':
    main()
