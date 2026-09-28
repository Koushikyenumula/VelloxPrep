import os
import re

frontend_dir = r'c:\OneDrive\Desktop\Ai-Interview Prep\frontend'

head_additions = '''
    <!-- Performance Optimization -->
    <link rel="preconnect" href="https://velloxprep.onrender.com" crossorigin>
    <link rel="dns-prefetch" href="https://velloxprep.onrender.com">
    <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
'''

for root, _, files in os.walk(frontend_dir):
    for file in files:
        if file.endswith('.html'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            new_content = content
            
            # 1. Add Preconnects if not there
            if 'velloxprep.onrender.com' not in new_content and '<head>' in new_content:
                new_content = new_content.replace('<head>', '<head>' + head_additions)
            
            # 2. Add lazy loading to images
            new_content = re.sub(r'<img(?![^>]*loading=)([^>]+)>', r'<img loading="lazy"\1>', new_content)

            if new_content != content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f'Optimized {file}')
