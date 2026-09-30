import os

frontend_dir = r'c:\OneDrive\Desktop\Ai-Interview Prep\frontend'

# 1. Create favicon.svg
favicon_svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <rect width="100" height="100" rx="20" fill="#0057FF" />
    <path d="M25 30 L50 80 L75 30" stroke="#FFFFFF" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" fill="none" />
</svg>'''

favicon_path = os.path.join(frontend_dir, 'favicon.svg')
with open(favicon_path, 'w', encoding='utf-8') as f:
    f.write(favicon_svg)

print('Created favicon.svg')

# 2. Add favicon to all HTML files
for root, _, files in os.walk(frontend_dir):
    for file in files:
        if file.endswith('.html'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            if '<link rel="icon"' not in content:
                # determine path depth
                is_root = root == frontend_dir
                favicon_ref = './favicon.svg' if is_root else '../favicon.svg'
                link_tag = f'\n    <link rel="icon" type="image/svg+xml" href="{favicon_ref}">\n</head>'
                
                new_content = content.replace('</head>', link_tag)
                
                if new_content != content:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f'Added favicon to {file}')
