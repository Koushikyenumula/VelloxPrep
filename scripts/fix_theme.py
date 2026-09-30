import os
import re

frontend_dir = r'c:\OneDrive\Desktop\Ai-Interview Prep\frontend\css'

for file in os.listdir(frontend_dir):
    if file.endswith('.css'):
        filepath = os.path.join(frontend_dir, file)
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # 1. Remove the entire [data-theme="light"] { ... } root block
        content = re.sub(r'\[data-theme="light"\]\s*\{[^}]*\}', '', content, flags=re.MULTILINE)
        
        # 2. Replace all occurrences of '[data-theme="light"] ' with '' 
        content = content.replace('[data-theme="light"] ', '')
        
        # 3. Clean up any remaining '[data-theme="light"]'
        content = content.replace('[data-theme="light"]', '')

        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f'Processed {file}')
